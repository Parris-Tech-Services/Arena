import { RULES } from "../domain/rules";
import type { CombatEvent, FighterId, FighterState, MatchResult, MatchStateV1, Phase, PlanV1, PlannedAction, ReplayFrame, SpellId } from "../domain/types";
import { addDirection, inBounds, lineHits, samePosition } from "./geometry";
import { normalizePlan, normalizeState } from "./normalize";

const copy = <T>(value: T): T => structuredClone(value);
const other = (side: FighterId): FighterId => side === "A" ? "B" : "A";
const event = (tick: number, phase: Phase, type: string, actor?: FighterId, target?: FighterId, data?: Record<string, unknown>): CombatEvent => ({ tick, phase, type, ...(actor ? { actor } : {}), ...(target ? { target } : {}), ...(data ? { data } : {}) });
const cooldown = (fighter: FighterState, spell: SpellId) => Number(fighter.cooldowns[spell] ?? 0) > 0;
const effect = (fighter: FighterState, id: string) => Number(fighter.effects[id] ?? 0) > 0;

export function simulate(planA: unknown, planB: unknown, rawState: unknown): MatchResult {
  const a = normalizePlan(planA, "Fighter A"), b = normalizePlan(planB, "Fighter B"), normalizedState = normalizeState(rawState);
  const issues = [...a.issues, ...b.issues, ...normalizedState.issues];
  if (issues.some(issue => issue.severity === "error")) return { ok: false, issues };
  const state = normalizedState.state;
  const plans: Record<FighterId, PlanV1> = { A: a.plan, B: b.plan };
  const names = { A: a.plan.fighter_name, B: b.plan.fighter_name };
  const events: CombatEvent[] = [event(0, "tick-start", "round-start", undefined, undefined, { round: state.round })];
  const frames: ReplayFrame[] = [snapshot(0, state, events)];
  for (let tick = 1; tick <= RULES.maxTicks; tick += 1) {
    const tickEvents: CombatEvent[] = [];
    const action = { A: plans.A.actions[tick - 1]!, B: plans.B.actions[tick - 1]! };
    tickEvents.push(event(tick, "tick-start", "actions-declared", undefined, undefined, { A: action.A, B: action.B }));
    decay(state);
    resolveMovement(tick, state, action, tickEvents);
    const defence = { A: action.A.action === "block", B: action.B.action === "block" };
    const duck = { A: action.A.action === "duck", B: action.B.action === "duck" };
    resolveUtility(tick, state, action, tickEvents);
    const damage: Record<FighterId, { amount: number; type: "melee" | "spell" }[]> = { A: [], B: [] };
    resolveOffence(tick, state, action, duck, damage, tickEvents);
    for (const side of ["A", "B"] as const) {
      let total = 0;
      for (const hit of damage[side]) {
        let amount = hit.amount;
        if (hit.type === "melee" && defence[side]) amount = Math.ceil(amount / 2);
        if (effect(state.fighters[side], "shielded")) amount = Math.ceil(amount / 2);
        total += amount;
      }
      if (total) { const before = state.fighters[side].hp; state.fighters[side].hp = Math.max(0, before - total); tickEvents.push(event(tick, "damage", "damage-applied", other(side), side, { amount: total, before, after: state.fighters[side].hp })); }
    }
    if (state.fighters.A.hp <= 0 || state.fighters.B.hp <= 0) tickEvents.push(event(tick, "defeat", "fighter-defeated", undefined, undefined, { A: state.fighters.A.hp <= 0, B: state.fighters.B.hp <= 0 }));
    events.push(...tickEvents); frames.push(snapshot(tick, state, tickEvents));
    if (state.fighters.A.hp <= 0 || state.fighters.B.hp <= 0) break;
  }
  const finalState = copy(state); finalState.round += 1;
  return { ok: true, issues, names, frames, events, finalState, outcome: outcome(finalState) };
}

function decay(state: MatchStateV1): void {
  for (const side of ["A", "B"] as const) for (const collection of [state.fighters[side].cooldowns, state.fighters[side].effects]) for (const key of Object.keys(collection)) collection[key as keyof typeof collection] = Math.max(0, Number(collection[key as keyof typeof collection]) - 1);
}

function resolveMovement(tick: number, state: MatchStateV1, actions: Record<FighterId, PlannedAction>, events: CombatEvent[]): void {
  const before = { A: copy(state.fighters.A.position), B: copy(state.fighters.B.position) };
  const desired = { A: before.A, B: before.B };
  for (const side of ["A", "B"] as const) if (actions[side].action === "move" || actions[side].action === "dash") {
    if (effect(state.fighters[side], "snared")) { events.push(event(tick, "movement", "movement-prevented", side, undefined, { reason: "snared" })); continue; }
    const target = addDirection(before[side], actions[side].direction!, actions[side].action === "dash" ? 2 : 1);
    if (inBounds(target, state.gridSize)) desired[side] = target; else events.push(event(tick, "movement", "movement-prevented", side, undefined, { reason: "edge" }));
  }
  const collision = samePosition(desired.A, desired.B) || (samePosition(desired.A, before.B) && samePosition(desired.B, before.A));
  if (collision) { events.push(event(tick, "movement", "collision")); return; }
  for (const side of ["A", "B"] as const) if (!samePosition(before[side], desired[side])) { state.fighters[side].position = desired[side]; events.push(event(tick, "movement", "fighter-moved", side, undefined, { from: before[side], to: desired[side] })); }
}

function resolveUtility(tick: number, state: MatchStateV1, actions: Record<FighterId, PlannedAction>, events: CombatEvent[]): void {
  const blinkIntents: Partial<Record<FighterId, ReturnType<typeof addDirection>>> = {};
  for (const side of ["A", "B"] as const) {
    const fighter = state.fighters[side], action = actions[side]; if (action.action !== "cast" || !action.spell || cooldown(fighter, action.spell)) continue;
    if (action.spell === "shield") { fighter.effects.shielded = RULES.spells.shield.duration; fighter.cooldowns.shield = RULES.spells.shield.cooldown; events.push(event(tick, "utility", "shield-applied", side)); }
    if (action.spell === "heal") { if (!fighter.usedHeal) { const before = fighter.hp; fighter.hp = Math.min(RULES.maxHp, fighter.hp + RULES.spells.heal.amount); fighter.usedHeal = true; fighter.cooldowns.heal = RULES.spells.heal.cooldown; events.push(event(tick, "utility", "healed", side, side, { before, after: fighter.hp })); } else events.push(event(tick, "utility", "spell-failed", side, undefined, { spell: "heal", reason: "already-used" })); }
    if (action.spell === "blink") { fighter.cooldowns.blink = RULES.spells.blink.cooldown; blinkIntents[side] = addDirection(fighter.position, action.direction!, RULES.spells.blink.range); }
  }
  for (const side of ["A", "B"] as const) {
    const target = blinkIntents[side]; if (!target) continue;
    const opposingTarget = blinkIntents[other(side)];
    const blocked = !inBounds(target, state.gridSize) || samePosition(target, state.fighters[other(side)].position) || Boolean(opposingTarget && samePosition(target, opposingTarget));
    if (blocked) events.push(event(tick, "utility", "spell-failed", side, undefined, { spell: "blink", reason: "blocked" }));
    else { state.fighters[side].position = target; events.push(event(tick, "utility", "blinked", side, undefined, { to: target })); }
  }
}

function resolveOffence(tick: number, state: MatchStateV1, actions: Record<FighterId, PlannedAction>, duck: Record<FighterId, boolean>, damage: Record<FighterId, { amount: number; type: "melee" | "spell" }[]>, events: CombatEvent[]): void {
  for (const side of ["A", "B"] as const) {
    const target = other(side), action = actions[side], fighter = state.fighters[side];
    if (action.action === "attack" && samePosition(addDirection(fighter.position, action.direction!), state.fighters[target].position)) { damage[target].push({ amount: RULES.meleeDamage, type: "melee" }); events.push(event(tick, "offence", "melee-hit", side, target)); }
    if (action.action !== "cast" || !action.spell || cooldown(fighter, action.spell)) continue;
    if (action.spell === "firebolt") { fighter.cooldowns.firebolt = RULES.spells.firebolt.cooldown; if (lineHits(fighter.position, action.direction!, state.fighters[target].position, RULES.spells.firebolt.range) && !duck[target]) { damage[target].push({ amount: RULES.spells.firebolt.damage, type: "spell" }); events.push(event(tick, "offence", "firebolt-hit", side, target)); } }
    if (action.spell === "snare") { fighter.cooldowns.snare = RULES.spells.snare.cooldown; if (lineHits(fighter.position, action.direction!, state.fighters[target].position, RULES.spells.snare.range)) { state.fighters[target].effects.snared = RULES.spells.snare.duration; events.push(event(tick, "offence", "snare-applied", side, target)); } }
  }
}

function snapshot(tick: number, state: MatchStateV1, events: readonly CombatEvent[]): ReplayFrame { return { tick, fighters: copy(state.fighters), events: copy(events) }; }
function outcome(state: MatchStateV1): MatchResult["outcome"] { const a = state.fighters.A.hp, b = state.fighters.B.hp; if (a <= 0 && b <= 0) return "draw"; if (a <= 0) return "B"; if (b <= 0) return "A"; if (a > b) return "A_leading"; if (b > a) return "B_leading"; return "even"; }
