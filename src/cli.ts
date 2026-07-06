#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createDefaultState } from "./domain/rules";
import type { PlanV1 } from "./domain/types";
import { simulate } from "./engine/simulate";
import { FixtureAgent } from "./application/agents";
import { runRoundRobin } from "./application/tournament";

const args = process.argv.slice(2);
try {
  if (args[0] === "tournament") {
    if (args.length < 3) usage("tournament needs at least two plan files");
    const plans = await Promise.all(args.slice(1).map(readJson<PlanV1>));
    const result = await runRoundRobin(plans.map((plan, index) => new FixtureAgent(plan.fighter_name || `fighter-${index + 1}`, plan)));
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (args.length < 2) usage("simulate needs PLAN_A.json PLAN_B.json [STATE.json]");
    const [a, b, state] = await Promise.all([readJson<PlanV1>(args[0]!), readJson<PlanV1>(args[1]!), args[2] ? readJson(args[2]) : Promise.resolve(createDefaultState())]);
    console.log(JSON.stringify(simulate(a, b, state), null, 2));
  }
} catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
function readJson<T = unknown>(path: string): Promise<T> { return readFile(path, "utf8").then(text => JSON.parse(text) as T); }
function usage(message: string): never { throw new Error(`${message}\nUsage:\n  npm.cmd run cli -- PLAN_A.json PLAN_B.json [STATE.json]\n  npm.cmd run tournament -- PLAN_1.json PLAN_2.json [...]`); }
