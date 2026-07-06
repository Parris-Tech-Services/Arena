import type { PlanV1 } from "../domain/types";

export const SAMPLE_A: PlanV1 = { schema: 1, fighter_name: "Iron Psalm", strategy: "Close carefully, then strike.", actions: [
  { tick: 1, action: "move", direction: "right" }, { tick: 2, action: "move", direction: "right" },
  { tick: 3, action: "cast", spell: "shield" }, { tick: 4, action: "attack", direction: "right" },
  { tick: 5, action: "cast", spell: "firebolt", direction: "right" }, { tick: 6, action: "duck" },
  { tick: 7, action: "move", direction: "up" }, { tick: 8, action: "cast", spell: "snare", direction: "right" },
  { tick: 9, action: "dash", direction: "right" }, { tick: 10, action: "attack", direction: "right" },
  { tick: 11, action: "cast", spell: "heal" }, { tick: 12, action: "attack", direction: "right" }
] };
export const SAMPLE_B: PlanV1 = { schema: 1, fighter_name: "Glass Wyrm", strategy: "Keep distance and punish approaches.", actions: [
  { tick: 1, action: "cast", spell: "firebolt", direction: "left" }, { tick: 2, action: "move", direction: "up" },
  { tick: 3, action: "duck" }, { tick: 4, action: "cast", spell: "snare", direction: "left" },
  { tick: 5, action: "move", direction: "left" }, { tick: 6, action: "cast", spell: "shield" },
  { tick: 7, action: "attack", direction: "left" }, { tick: 8, action: "cast", spell: "blink", direction: "down" },
  { tick: 9, action: "cast", spell: "firebolt", direction: "left" }, { tick: 10, action: "block" },
  { tick: 11, action: "move", direction: "left" }, { tick: 12, action: "attack", direction: "left" }
] };
