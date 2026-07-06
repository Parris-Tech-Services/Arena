import type { MatchBundleV1, MatchResult, MatchStateV1, PlanV1 } from "../domain/types";
import { ENGINE_VERSION, RULESET_ID, RULESET_VERSION } from "../domain/rules";

export function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

export async function sha256(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalize(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function createMatchBundle(plans: Record<"A" | "B", PlanV1>, initialState: MatchStateV1, result: MatchResult): Promise<MatchBundleV1> {
  const content = { schema: 1 as const, engineVersion: ENGINE_VERSION, ruleset: { id: RULESET_ID, version: RULESET_VERSION }, plans, initialState, result };
  return { ...content, replayHash: await sha256(content) };
}

export async function verifyMatchBundle(bundle: MatchBundleV1): Promise<boolean> {
  const { replayHash: _hash, createdAt: _createdAt, ...content } = bundle;
  return bundle.replayHash === await sha256(content);
}
