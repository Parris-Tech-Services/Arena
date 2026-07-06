import { createDefaultState } from "../domain/rules";
import type { FighterAgent, FighterId, MatchResult, PlanV1 } from "../domain/types";
import { buildPrompt } from "./prompt-builder";
import { simulate } from "../engine/simulate";

export type Standing = { id: string; played: number; wins: number; draws: number; losses: number; points: number; hpFor: number; hpAgainst: number };
export type TournamentResult = { matches: { A: string; B: string; result: MatchResult }[]; standings: Standing[] };

export async function runRoundRobin(agents: FighterAgent[], signal?: AbortSignal): Promise<TournamentResult> {
  const standings = new Map(agents.map(agent => [agent.id, fresh(agent.id)])); const matches: TournamentResult["matches"] = [];
  for (let a = 0; a < agents.length; a += 1) for (let b = a + 1; b < agents.length; b += 1) {
    if (signal?.aborted) throw signal.reason;
    const agentA = agents[a]!, agentB = agents[b]!, state = createDefaultState();
    const plans: Record<FighterId, PlanV1> = { A: await agentA.createPlan({ side: "A", state, prompt: buildPrompt("A", state) }, signal), B: await agentB.createPlan({ side: "B", state, prompt: buildPrompt("B", state) }, signal) };
    const result = simulate(plans.A, plans.B, state); matches.push({ A: agentA.id, B: agentB.id, result }); score(standings.get(agentA.id)!, standings.get(agentB.id)!, result);
  }
  return { matches, standings: [...standings.values()].sort((x, y) => y.points - x.points || (y.hpFor - y.hpAgainst) - (x.hpFor - x.hpAgainst) || x.id.localeCompare(y.id)) };
}
function fresh(id: string): Standing { return { id, played: 0, wins: 0, draws: 0, losses: 0, points: 0, hpFor: 0, hpAgainst: 0 }; }
function score(a: Standing, b: Standing, result: MatchResult): void {
  a.played++; b.played++; const last = result.frames?.at(-1); a.hpFor += last?.fighters.A.hp ?? 0; a.hpAgainst += last?.fighters.B.hp ?? 0; b.hpFor += last?.fighters.B.hp ?? 0; b.hpAgainst += last?.fighters.A.hp ?? 0;
  if (result.outcome === "A" || result.outcome === "A_leading") { a.wins++; a.points += 3; b.losses++; }
  else if (result.outcome === "B" || result.outcome === "B_leading") { b.wins++; b.points += 3; a.losses++; }
  else { a.draws++; b.draws++; a.points++; b.points++; }
}
