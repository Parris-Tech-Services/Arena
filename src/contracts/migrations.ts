import type { MatchStateV1, PlanV1 } from "../domain/types";

type LegacyPlan = { schema?: number; fighter?: string; fighter_name?: string; strategy?: string; actions?: unknown[] };
export function migratePlan(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const raw = value as LegacyPlan;
  if (raw.schema === 1) return value;
  return { schema: 1, fighter_name: raw.fighter_name ?? raw.fighter ?? "Fighter", strategy: raw.strategy ?? "", actions: (raw.actions ?? []) as PlanV1["actions"] } satisfies PlanV1;
}

export function migrateState(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const raw = value as Partial<MatchStateV1>;
  if (raw.schema === 1) return value;
  return { ...raw, schema: 1, round: raw.round ?? 1, gridSize: raw.gridSize ?? 7 };
}
