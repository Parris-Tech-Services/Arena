import { describe, expect, it } from "vitest";
import { SAMPLE_A, SAMPLE_B } from "../../src/content/samples";
import { createDefaultState } from "../../src/domain/rules";
import { validatePlan, validateState } from "../../src/contracts/runtime-schema";
import { migratePlan } from "../../src/contracts/migrations";
import { createMatchBundle, verifyMatchBundle } from "../../src/application/canonical";
import { simulate } from "../../src/engine/simulate";

describe("contracts", () => {
  it("validates shipped samples and state", () => { expect(validatePlan(SAMPLE_A)).toEqual([]); expect(validatePlan(SAMPLE_B)).toEqual([]); expect(validateState(createDefaultState())).toEqual([]); });
  it("reports schema paths", () => { expect(validatePlan({ schema: 1, fighter_name: "", actions: [] })[0]?.path).toBe("/fighter_name"); });
  it("migrates legacy fighter names", () => { expect(migratePlan({ fighter: "Legacy", actions: [] })).toMatchObject({ schema: 1, fighter_name: "Legacy" }); });
  it("detects replay tampering", async () => { const state=createDefaultState(),result=simulate(SAMPLE_A,SAMPLE_B,state),bundle=await createMatchBundle({A:SAMPLE_A,B:SAMPLE_B},state,result); expect(await verifyMatchBundle(bundle)).toBe(true); expect(await verifyMatchBundle({...bundle,replayHash:"0".repeat(64)})).toBe(false); });
});
