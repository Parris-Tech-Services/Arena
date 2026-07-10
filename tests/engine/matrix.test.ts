import { describe, expect, it } from "vitest";
import { SAMPLE_A, SAMPLE_B } from "../../src/content/samples";
import { createDefaultState } from "../../src/domain/rules";
import type { PlanV1, PlannedAction } from "../../src/domain/types";
import { simulate } from "../../src/engine/simulate";

const plan = (name: string, actions: PlannedAction[]): PlanV1 => ({ schema: 1, fighter_name: name, actions });
const idle = (name = "Idle"): PlanV1 => plan(name, []);
const at = (ax: number, ay: number, bx: number, by: number) => {
  const state = createDefaultState();
  state.fighters.A.position = { x: ax, y: ay };
  state.fighters.B.position = { x: bx, y: by };
  return state;
};

describe("golden fixture", () => {
  it("pins the sample duel outcome (ruleset v2)", () => {
    const result = simulate(SAMPLE_A, SAMPLE_B, createDefaultState());
    expect(result.ok).toBe(true);
    expect(result.frames).toHaveLength(13); // initial frame + 12 ticks
    expect(result.finalState?.fighters.A.hp).toBe(75);
    expect(result.finalState?.fighters.B.hp).toBe(100);
    expect(result.finalState?.fighters.A.position).toEqual({ x: 5, y: 2 });
    expect(result.finalState?.fighters.B.position).toEqual({ x: 3, y: 4 });
    expect(result.outcome).toBe("B_leading");
  });
});

describe("movement matrix", () => {
  it("prevents moving off the edge", () => {
    const result = simulate(plan("A", [{ tick: 1, action: "move", direction: "left" }]), idle(), at(0, 3, 5, 3));
    expect(result.frames?.[1]?.fighters.A.position).toEqual({ x: 0, y: 3 });
    expect(result.frames?.[1]?.events.some(e => e.type === "movement-prevented" && e.data?.reason === "edge")).toBe(true);
  });

  it("prevents dashing past the edge", () => {
    const result = simulate(plan("A", [{ tick: 1, action: "dash", direction: "right" }]), idle(), at(6, 3, 5, 0));
    expect(result.frames?.[1]?.fighters.A.position).toEqual({ x: 6, y: 3 });
  });

  it("bounces both fighters when they target the same square", () => {
    const result = simulate(
      plan("A", [{ tick: 1, action: "move", direction: "right" }]),
      plan("B", [{ tick: 1, action: "move", direction: "left" }]),
      at(2, 3, 4, 3)
    );
    expect(result.frames?.[1]?.fighters.A.position).toEqual({ x: 2, y: 3 });
    expect(result.frames?.[1]?.fighters.B.position).toEqual({ x: 4, y: 3 });
    expect(result.frames?.[1]?.events.some(e => e.type === "collision")).toBe(true);
  });

  it("bounces both fighters on a swap", () => {
    const result = simulate(
      plan("A", [{ tick: 1, action: "move", direction: "right" }]),
      plan("B", [{ tick: 1, action: "move", direction: "left" }]),
      at(2, 3, 3, 3)
    );
    expect(result.frames?.[1]?.fighters.A.position).toEqual({ x: 2, y: 3 });
    expect(result.frames?.[1]?.fighters.B.position).toEqual({ x: 3, y: 3 });
  });

  it("prevents moving into a stationary opponent", () => {
    const result = simulate(plan("A", [{ tick: 1, action: "move", direction: "right" }]), idle(), at(2, 3, 3, 3));
    expect(result.frames?.[1]?.fighters.A.position).toEqual({ x: 2, y: 3 });
  });

  it("allows dashing through the opponent to the far side (documented dodge mechanic)", () => {
    const result = simulate(plan("A", [{ tick: 1, action: "dash", direction: "right" }]), idle(), at(2, 3, 3, 3));
    expect(result.frames?.[1]?.fighters.A.position).toEqual({ x: 4, y: 3 });
  });
});

describe("melee matrix", () => {
  it("misses a non-adjacent target", () => {
    const result = simulate(plan("A", [{ tick: 1, action: "attack", direction: "right" }]), idle(), at(1, 3, 5, 3));
    expect(result.frames?.[1]?.fighters.B.hp).toBe(100);
  });

  it("block halves melee to 9", () => {
    const result = simulate(
      plan("A", [{ tick: 1, action: "attack", direction: "right" }]),
      plan("B", [{ tick: 1, action: "block" }]),
      at(2, 3, 3, 3)
    );
    expect(result.frames?.[1]?.fighters.B.hp).toBe(91);
  });

  it("shield alone halves melee to 9", () => {
    const state = at(2, 3, 3, 3);
    state.fighters.B.effects.shielded = 2;
    const result = simulate(plan("A", [{ tick: 1, action: "attack", direction: "right" }]), idle("B"), state);
    expect(result.frames?.[1]?.fighters.B.hp).toBe(91);
  });
});

describe("firebolt matrix", () => {
  it("hits at exactly range 4", () => {
    const result = simulate(plan("A", [{ tick: 1, action: "cast", spell: "firebolt", direction: "right" }]), idle(), at(1, 3, 5, 3));
    expect(result.frames?.[1]?.fighters.B.hp).toBe(78);
  });

  it("misses beyond range 4", () => {
    const result = simulate(plan("A", [{ tick: 1, action: "cast", spell: "firebolt", direction: "right" }]), idle(), at(0, 3, 5, 3));
    expect(result.frames?.[1]?.fighters.B.hp).toBe(100);
  });

  it("misses a target off the firing line", () => {
    const result = simulate(plan("A", [{ tick: 1, action: "cast", spell: "firebolt", direction: "right" }]), idle(), at(1, 3, 4, 2));
    expect(result.frames?.[1]?.fighters.B.hp).toBe(100);
  });

  it("is avoided by duck but shield only halves it", () => {
    const ducked = simulate(
      plan("A", [{ tick: 1, action: "cast", spell: "firebolt", direction: "right" }]),
      plan("B", [{ tick: 1, action: "duck" }]),
      at(1, 3, 5, 3)
    );
    expect(ducked.frames?.[1]?.fighters.B.hp).toBe(100);
    const shielded = at(1, 3, 5, 3);
    shielded.fighters.B.effects.shielded = 2;
    const result = simulate(plan("A", [{ tick: 1, action: "cast", spell: "firebolt", direction: "right" }]), idle("B"), shielded);
    expect(result.frames?.[1]?.fighters.B.hp).toBe(89);
  });

  it("honours the 3-tick cooldown boundary", () => {
    const result = simulate(
      plan("A", [
        { tick: 1, action: "cast", spell: "firebolt", direction: "right" },
        { tick: 2, action: "cast", spell: "firebolt", direction: "right" },
        { tick: 3, action: "cast", spell: "firebolt", direction: "right" },
        { tick: 4, action: "cast", spell: "firebolt", direction: "right" }
      ]),
      idle(),
      at(1, 3, 5, 3)
    );
    expect(result.frames?.[1]?.fighters.B.hp).toBe(78); // tick 1 hits
    expect(result.frames?.[2]?.fighters.B.hp).toBe(78); // tick 2 on cooldown
    expect(result.frames?.[3]?.fighters.B.hp).toBe(78); // tick 3 on cooldown
    expect(result.frames?.[4]?.fighters.B.hp).toBe(56); // tick 4 castable again
  });
});

describe("blink matrix", () => {
  it("teleports two squares", () => {
    const result = simulate(plan("A", [{ tick: 1, action: "cast", spell: "blink", direction: "right" }]), idle(), at(1, 3, 5, 3));
    expect(result.frames?.[1]?.fighters.A.position).toEqual({ x: 3, y: 3 });
  });

  it("consumes cooldown even when the landing square is invalid (documented policy)", () => {
    const result = simulate(
      plan("A", [
        { tick: 1, action: "cast", spell: "blink", direction: "up" },
        { tick: 2, action: "cast", spell: "blink", direction: "right" }
      ]),
      idle(),
      at(1, 0, 5, 3)
    );
    expect(result.frames?.[1]?.fighters.A.position).toEqual({ x: 1, y: 0 }); // failed: off the grid
    expect(result.frames?.[1]?.events.some(e => e.type === "spell-failed" && e.data?.spell === "blink")).toBe(true);
    expect(result.frames?.[2]?.fighters.A.position).toEqual({ x: 1, y: 0 }); // still on cooldown
  });

  it("fails when both fighters blink to the same square", () => {
    const result = simulate(
      plan("A", [{ tick: 1, action: "cast", spell: "blink", direction: "right" }]),
      plan("B", [{ tick: 1, action: "cast", spell: "blink", direction: "left" }]),
      at(1, 3, 5, 3)
    );
    expect(result.frames?.[1]?.fighters.A.position).toEqual({ x: 1, y: 3 });
    expect(result.frames?.[1]?.fighters.B.position).toEqual({ x: 5, y: 3 });
  });
});

describe("snare matrix", () => {
  it("misses beyond range 3", () => {
    const result = simulate(
      plan("A", [{ tick: 1, action: "cast", spell: "snare", direction: "right" }]),
      plan("B", [{ tick: 2, action: "move", direction: "up" }]),
      at(1, 3, 5, 3)
    );
    expect(result.frames?.[2]?.fighters.B.position).toEqual({ x: 5, y: 2 });
  });

  it("also blocks dash on the following tick", () => {
    const result = simulate(
      plan("A", [{ tick: 1, action: "cast", spell: "snare", direction: "right" }]),
      plan("B", [{ tick: 2, action: "dash", direction: "up" }]),
      at(2, 3, 4, 3)
    );
    expect(result.frames?.[2]?.fighters.B.position).toEqual({ x: 4, y: 3 });
  });

  it("does not block non-movement actions", () => {
    const result = simulate(
      plan("A", [{ tick: 1, action: "cast", spell: "snare", direction: "right" }]),
      plan("B", [{ tick: 2, action: "attack", direction: "left" }]),
      at(2, 3, 3, 3)
    );
    expect(result.frames?.[2]?.fighters.A.hp).toBe(82);
  });
});

describe("heal matrix", () => {
  it("restores 15 and clamps at max HP", () => {
    const low = at(1, 3, 5, 3);
    low.fighters.A.hp = 50;
    expect(simulate(plan("A", [{ tick: 1, action: "cast", spell: "heal" }]), idle(), low).frames?.[1]?.fighters.A.hp).toBe(65);
    const high = at(1, 3, 5, 3);
    high.fighters.A.hp = 95;
    expect(simulate(plan("A", [{ tick: 1, action: "cast", spell: "heal" }]), idle(), high).frames?.[1]?.fighters.A.hp).toBe(100);
  });

  it("cannot be used twice, and a failed attempt costs nothing (documented policy)", () => {
    const state = at(1, 3, 5, 3);
    state.fighters.A.hp = 50;
    const result = simulate(
      plan("A", [{ tick: 1, action: "cast", spell: "heal" }, { tick: 5, action: "cast", spell: "heal" }]),
      idle(),
      state
    );
    expect(result.frames?.[5]?.fighters.A.hp).toBe(65);
    expect(result.frames?.[5]?.events.some(e => e.type === "spell-failed" && e.data?.reason === "already-used")).toBe(true);
  });

  it("respects usedHeal carried over from a previous round", () => {
    const state = at(1, 3, 5, 3);
    state.fighters.A.hp = 50;
    state.fighters.A.usedHeal = true;
    const result = simulate(plan("A", [{ tick: 1, action: "cast", spell: "heal" }]), idle(), state);
    expect(result.frames?.[1]?.fighters.A.hp).toBe(50);
  });
});

describe("lifecycle matrix", () => {
  it("ends the round early and declares a draw on mutual defeat", () => {
    const state = at(3, 3, 4, 3);
    state.fighters.A.hp = 10;
    state.fighters.B.hp = 10;
    const result = simulate(
      plan("A", [{ tick: 1, action: "attack", direction: "right" }]),
      plan("B", [{ tick: 1, action: "attack", direction: "left" }]),
      state
    );
    expect(result.frames).toHaveLength(2);
    expect(result.outcome).toBe("draw");
  });
});

describe("validation matrix", () => {
  it("lets the last duplicate tick win and reports a warning", () => {
    const result = simulate(
      plan("A", [
        { tick: 1, action: "move", direction: "up" },
        { tick: 1, action: "attack", direction: "right" }
      ]),
      idle(),
      at(2, 3, 3, 3)
    );
    expect(result.frames?.[1]?.fighters.B.hp).toBe(82);
    expect(result.issues.some(i => i.severity === "warning" && i.message.includes("Duplicate"))).toBe(true);
  });

  it("ignores out-of-range ticks and unknown actions with warnings", () => {
    const raw = { schema: 1, fighter_name: "Odd", actions: [
      { tick: 13, action: "move", direction: "up" },
      { tick: 1, action: "teleport", direction: "up" }
    ] };
    const result = simulate(raw, idle(), createDefaultState());
    expect(result.ok).toBe(true);
    expect(result.frames?.[1]?.fighters.A.position).toEqual({ x: 1, y: 3 });
    expect(result.issues.filter(i => i.severity === "warning").length).toBeGreaterThanOrEqual(2);
  });
});
