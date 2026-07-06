import { describe, expect, it } from "vitest";
import { FixtureAgent } from "../../src/application/agents";
import { runRoundRobin } from "../../src/application/tournament";
import type { PlanV1 } from "../../src/domain/types";
const idle=(name:string):PlanV1=>({schema:1,fighter_name:name,actions:[]});
describe("tournaments",()=>{it("runs each pairing once and deterministically ranks ties",async()=>{const result=await runRoundRobin([new FixtureAgent("C",idle("C")),new FixtureAgent("A",idle("A")),new FixtureAgent("B",idle("B"))]);expect(result.matches).toHaveLength(3);expect(result.standings.map(s=>s.id)).toEqual(["A","B","C"]);expect(result.standings.every(s=>s.played===2&&s.draws===2)).toBe(true);});});
