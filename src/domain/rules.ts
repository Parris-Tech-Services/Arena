import type { Direction, MatchStateV1, SpellId } from "./types";

export const ENGINE_VERSION = "0.2.0";
export const RULESET_ID = "standard";
export const RULESET_VERSION = 2;

export const RULES = Object.freeze({
  gridSize: 7,
  maxTicks: 12,
  maxHp: 100,
  meleeDamage: 18,
  spells: {
    firebolt: { range: 4, damage: 22, cooldown: 3, summary: "Line spell; duck avoids it." },
    blink: { range: 2, cooldown: 4, summary: "Teleport two squares if the landing square is free." },
    shield: { duration: 2, cooldown: 4, summary: "Halves all incoming damage this tick and next tick." },
    snare: { duration: 2, range: 3, cooldown: 4, summary: "Prevents movement on the target's next tick." },
    heal: { amount: 15, cooldown: 999, summary: "Restore 15 HP once per match." }
  } satisfies Record<SpellId, Record<string, number | string>>
});

export const DIRECTIONS: Readonly<Record<Direction, readonly [number, number]>> = {
  up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0]
};

export function createDefaultState(): MatchStateV1 {
  return {
    schema: 1, round: 1, gridSize: RULES.gridSize,
    fighters: {
      A: { hp: 100, position: { x: 1, y: 3 }, cooldowns: {}, effects: {}, usedHeal: false },
      B: { hp: 100, position: { x: 5, y: 3 }, cooldowns: {}, effects: {}, usedHeal: false }
    }
  };
}
