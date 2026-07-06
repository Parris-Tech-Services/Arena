import type { CombatEvent, FighterId } from "../domain/types";

export function formatEvent(value: CombatEvent, names: Record<FighterId, string>): string {
  const actor = value.actor ? names[value.actor] : ""; const target = value.target ? names[value.target] : ""; const data = value.data ?? {};
  switch (value.type) {
    case "round-start": return `Round ${data.round} begins.`;
    case "actions-declared": return `Tick ${value.tick}: actions declared.`;
    case "fighter-moved": return `${actor} moved to ${position(data.to)}.`;
    case "movement-prevented": return `${actor} could not move (${data.reason}).`;
    case "collision": return "Collision: movement was cancelled.";
    case "shield-applied": return `${actor} cast shield.`;
    case "healed": return `${actor} healed to ${data.after} HP.`;
    case "blinked": return `${actor} blinked to ${position(data.to)}.`;
    case "spell-failed": return `${actor}'s ${data.spell} failed (${data.reason}).`;
    case "melee-hit": return `${actor} hit ${target} with melee.`;
    case "firebolt-hit": return `${actor} struck ${target} with firebolt.`;
    case "snare-applied": return `${actor} snared ${target}.`;
    case "damage-applied": return `${target} took ${data.amount} damage (${data.before} → ${data.after} HP).`;
    case "fighter-defeated": return "Defeat detected.";
    default: return value.type;
  }
}
function position(value: unknown): string { const p = value as { x?: unknown; y?: unknown } | undefined; return `(${p?.x},${p?.y})`; }
