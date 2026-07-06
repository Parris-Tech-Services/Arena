import { describe, expect, it } from "vitest";
import { createDefaultState } from "../../src/domain/rules";
import type { MatchStateV1, PlanV1, PlannedAction } from "../../src/domain/types";
import { simulate } from "../../src/engine/simulate";

const plan = (name: string, actions: PlannedAction[]): PlanV1 => ({ schema: 1, fighter_name: name, actions });
const idle = (name = "Idle"): PlanV1 => plan(name, []);

describe("simulation", () => {
  it("is deterministic and does not mutate inputs", () => {
    const state = createDefaultState(), a = plan("A", [{ tick: 1, action: "cast", spell: "firebolt", direction: "right" }]);
    const before = JSON.stringify({ state, a });
    expect(simulate(a, idle("B"), state)).toEqual(simulate(a, idle("B"), state));
    expect(JSON.stringify({ state, a })).toBe(before);
  });

  it("applies simultaneous damage", () => {
    const state = createDefaultState(); state.fighters.A.position = { x: 2, y: 3 }; state.fighters.B.position = { x: 3, y: 3 };
    const result = simulate(plan("A", [{ tick: 1, action: "attack", direction: "right" }]), plan("B", [{ tick: 1, action: "attack", direction: "left" }]), state);
    expect(result.frames?.[1]?.fighters.A.hp).toBe(82); expect(result.frames?.[1]?.fighters.B.hp).toBe(82);
  });

  it("snare prevents movement on the following tick", () => {
    const state = createDefaultState(); state.fighters.A.position = { x: 2, y: 3 };
    const result = simulate(plan("A", [{ tick: 1, action: "cast", spell: "snare", direction: "right" }]), plan("B", [{ tick: 2, action: "move", direction: "up" }]), state);
    expect(result.frames?.[2]?.fighters.B.position).toEqual({ x: 5, y: 3 });
    expect(result.frames?.[2]?.events.some(e => e.type === "movement-prevented" && e.data?.reason === "snared")).toBe(true);
  });

  it("resolves both blink intents from the same phase snapshot", () => {
    const state = createDefaultState(); state.fighters.A.position = { x: 1, y: 3 }; state.fighters.B.position = { x: 3, y: 3 };
    const result = simulate(plan("A", [{ tick: 1, action: "cast", spell: "blink", direction: "right" }]), plan("B", [{ tick: 1, action: "cast", spell: "blink", direction: "left" }]), state);
    expect(result.frames?.[1]?.fighters.A.position).toEqual({ x: 1, y: 3 });
    expect(result.frames?.[1]?.fighters.B.position).toEqual({ x: 3, y: 3 });
  });

  it("halves melee twice when block and shield stack", () => {
    const state = createDefaultState(); state.fighters.A.position = { x: 2, y: 3 }; state.fighters.B.position = { x: 3, y: 3 }; state.fighters.B.effects.shielded = 2;
    const result = simulate(plan("A", [{ tick: 1, action: "attack", direction: "right" }]), plan("B", [{ tick: 1, action: "block" }]), state);
    expect(result.frames?.[1]?.fighters.B.hp).toBe(95);
  });

  it("rejects overlapping starting positions", () => {
    const state: MatchStateV1 = createDefaultState(); state.fighters.B.position = state.fighters.A.position;
    expect(simulate(idle("A"), idle("B"), state).ok).toBe(false);
  });
});
