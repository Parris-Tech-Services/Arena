import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { createDefaultState, RULES } from "../../src/domain/rules";
import type { Direction, PlannedAction } from "../../src/domain/types";
import { simulate } from "../../src/engine/simulate";

const directions: Direction[]=["up","down","left","right"];
const actionArb=fc.record({tick:fc.integer({min:1,max:12}),action:fc.constantFrom("move","dash","attack","block","duck","idle"),direction:fc.constantFrom(...directions)}).map(x=>x as PlannedAction);
describe("engine properties",()=>{
  it("keeps health and positions in bounds and remains deterministic",()=>fc.assert(fc.property(fc.array(actionArb,{maxLength:20}),fc.array(actionArb,{maxLength:20}),(a,b)=>{const state=createDefaultState(),pa={schema:1 as const,fighter_name:"A",actions:a},pb={schema:1 as const,fighter_name:"B",actions:b},one=simulate(pa,pb,state),two=simulate(pa,pb,state);expect(one).toEqual(two);for(const frame of one.frames??[])for(const side of ["A","B"] as const){const f=frame.fighters[side];expect(f.hp).toBeGreaterThanOrEqual(0);expect(f.hp).toBeLessThanOrEqual(RULES.maxHp);expect(f.position.x).toBeGreaterThanOrEqual(0);expect(f.position.x).toBeLessThan(RULES.gridSize);expect(f.position.y).toBeGreaterThanOrEqual(0);expect(f.position.y).toBeLessThan(RULES.gridSize);}return true;}),{numRuns:100}));
});
