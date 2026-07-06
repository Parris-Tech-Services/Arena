import { RULES } from "../domain/rules";
import type { FighterId, MatchStateV1 } from "../domain/types";
import { ABILITIES } from "../domain/abilities";

export function buildPrompt(side: FighterId, state: MatchStateV1): string {
  const abilities = Object.values(ABILITIES).map(ability => `- ${ability.id}: ${ability.promptSummary}`).join("\n");
  return `You are Fighter ${side} in LLM Gladiator Arena. Return ONLY valid JSON matching schema 1. Provide exactly ${RULES.maxTicks} actions, ticks 1-${RULES.maxTicks}.\n\nActions: move, dash, attack, block, duck, cast, idle. Directions: up, down, left, right.\n\nAbilities:\n${abilities}\n\nGrid: ${RULES.gridSize}×${RULES.gridSize}. Damage: melee ${RULES.meleeDamage}. The simulation is deterministic and simultaneous.\n\nCurrent state:\n${JSON.stringify(state, null, 2)}`;
}
