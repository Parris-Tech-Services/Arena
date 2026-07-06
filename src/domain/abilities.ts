import { RULES } from "./rules";
import type { SpellId } from "./types";

export type AbilityDefinition = Readonly<{
  id: SpellId;
  targeting: "self" | "direction-line" | "direction-destination";
  phase: "utility" | "offence";
  cooldown: number;
  promptSummary: string;
}>;

export const ABILITIES: Readonly<Record<SpellId, AbilityDefinition>> = Object.freeze({
  firebolt: { id: "firebolt", targeting: "direction-line", phase: "offence", cooldown: RULES.spells.firebolt.cooldown, promptSummary: RULES.spells.firebolt.summary },
  blink: { id: "blink", targeting: "direction-destination", phase: "utility", cooldown: RULES.spells.blink.cooldown, promptSummary: RULES.spells.blink.summary },
  shield: { id: "shield", targeting: "self", phase: "utility", cooldown: RULES.spells.shield.cooldown, promptSummary: RULES.spells.shield.summary },
  snare: { id: "snare", targeting: "direction-line", phase: "offence", cooldown: RULES.spells.snare.cooldown, promptSummary: RULES.spells.snare.summary },
  heal: { id: "heal", targeting: "self", phase: "utility", cooldown: RULES.spells.heal.cooldown, promptSummary: RULES.spells.heal.summary }
});

export const abilityIds = Object.freeze(Object.keys(ABILITIES) as SpellId[]);
export const directionalAbilityIds = new Set(abilityIds.filter(id => ABILITIES[id].targeting !== "self"));
