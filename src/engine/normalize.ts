import { createDefaultState, RULES } from "../domain/rules";
import type { Direction, MatchStateV1, PlanV1, PlannedAction, SpellId, ValidationIssue } from "../domain/types";
import { inBounds, samePosition } from "./geometry";
import { abilityIds, directionalAbilityIds } from "../domain/abilities";

const actions = new Set(["move", "dash", "attack", "block", "duck", "cast", "idle"]);
const directions = new Set<Direction>(["up", "down", "left", "right"]);
const spells = new Set<SpellId>(abilityIds);
const directionalSpells = directionalAbilityIds;
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

export function normalizePlan(value: unknown, label: string): { plan: PlanV1; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  if (!object(value)) return { plan: { schema: 1, fighter_name: label, actions: [] }, issues: [{ severity: "error", path: "", message: `${label} must be an object.` }] };
  if (value.schema !== 1) issues.push({ severity: "warning", path: "schema", message: "Expected plan schema 1." });
  const fighterName = typeof value.fighter_name === "string" && value.fighter_name.trim() ? value.fighter_name.trim().slice(0, 40) : label;
  if (!Array.isArray(value.actions)) issues.push({ severity: "warning", path: "actions", message: "Missing actions array; fighter will idle." });
  const byTick = new Map<number, PlannedAction>();
  for (const [index, raw] of (Array.isArray(value.actions) ? value.actions : []).entries()) {
    const path = `actions[${index}]`;
    if (!object(raw)) { issues.push({ severity: "warning", path, message: "Ignored non-object action." }); continue; }
    const tick = Number(raw.tick);
    if (!Number.isInteger(tick) || tick < 1 || tick > RULES.maxTicks) { issues.push({ severity: "warning", path: `${path}.tick`, message: `Tick must be 1-${RULES.maxTicks}; action ignored.` }); continue; }
    if (byTick.has(tick)) issues.push({ severity: "warning", path, message: `Duplicate tick ${tick}; last action wins.` });
    const action = typeof raw.action === "string" ? raw.action.toLowerCase() : "idle";
    if (!actions.has(action)) { issues.push({ severity: "warning", path: `${path}.action`, message: "Unknown action; treated as idle." }); byTick.set(tick, { tick, action: "idle" }); continue; }
    if (action === "move" || action === "dash" || action === "attack") {
      const direction = typeof raw.direction === "string" ? raw.direction.toLowerCase() as Direction : undefined;
      if (!direction || !directions.has(direction)) { issues.push({ severity: "warning", path: `${path}.direction`, message: `${action} requires a direction; treated as idle.` }); byTick.set(tick, { tick, action: "idle" }); }
      else byTick.set(tick, { tick, action, direction });
      continue;
    }
    if (action === "cast") {
      const spell = typeof raw.spell === "string" ? raw.spell.toLowerCase() as SpellId : undefined;
      const direction = typeof raw.direction === "string" ? raw.direction.toLowerCase() as Direction : undefined;
      if (!spell || !spells.has(spell) || (directionalSpells.has(spell) && (!direction || !directions.has(direction)))) {
        issues.push({ severity: "warning", path, message: "Unknown or incomplete spell; treated as idle." }); byTick.set(tick, { tick, action: "idle" });
      } else byTick.set(tick, { tick, action: "cast", spell, ...(direction ? { direction } : {}) });
      continue;
    }
    byTick.set(tick, { tick, action: action as "block" | "duck" | "idle" });
  }
  return { plan: { schema: 1, fighter_name: fighterName, strategy: typeof value.strategy === "string" ? value.strategy : "", actions: Array.from({ length: RULES.maxTicks }, (_, index) => byTick.get(index + 1) ?? { tick: index + 1, action: "idle" }) }, issues };
}

export function normalizeState(value: unknown): { state: MatchStateV1; issues: ValidationIssue[] } {
  const state = createDefaultState();
  const issues: ValidationIssue[] = [];
  if (!object(value)) return { state, issues: [{ severity: "error", path: "", message: "State must be an object." }] };
  state.round = Number.isInteger(Number(value.round)) ? Math.max(1, Number(value.round)) : 1;
  if (value.gridSize !== RULES.gridSize) issues.push({ severity: "warning", path: "gridSize", message: `Only grid size ${RULES.gridSize} is supported.` });
  const fighters = object(value.fighters) ? value.fighters : {};
  for (const side of ["A", "B"] as const) {
    const raw = object(fighters[side]) ? fighters[side] : undefined;
    if (!raw) { issues.push({ severity: "warning", path: `fighters.${side}`, message: "Missing fighter; default used." }); continue; }
    const hp = Number(raw.hp); if (Number.isFinite(hp)) state.fighters[side].hp = Math.max(0, Math.min(RULES.maxHp, Math.round(hp)));
    if (object(raw.position)) {
      const position = { x: Number(raw.position.x), y: Number(raw.position.y) };
      if (Number.isInteger(position.x) && Number.isInteger(position.y) && inBounds(position, RULES.gridSize)) state.fighters[side].position = position;
      else issues.push({ severity: "warning", path: `fighters.${side}.position`, message: "Invalid position; default used." });
    }
    state.fighters[side].cooldowns = object(raw.cooldowns) ? sanitizeNumbers(raw.cooldowns) as MatchStateV1["fighters"]["A"]["cooldowns"] : {};
    state.fighters[side].effects = object(raw.effects) ? sanitizeNumbers(raw.effects) : {};
    state.fighters[side].usedHeal = Boolean(raw.usedHeal);
  }
  if (samePosition(state.fighters.A.position, state.fighters.B.position)) issues.push({ severity: "error", path: "fighters", message: "Fighters cannot occupy the same starting square." });
  return { state, issues };
}

function sanitizeNumbers(value: Record<string, unknown>): Record<string, number> {
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, number] => Number.isFinite(entry[1])).map(([key, number]) => [key, Math.max(0, Number(number))]));
}
