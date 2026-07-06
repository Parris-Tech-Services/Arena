import Ajv2020, { type ErrorObject } from "ajv/dist/2020";
import planSchema from "../../schemas/plan-v1.schema.json";
import stateSchema from "../../schemas/match-state-v1.schema.json";
import type { MatchStateV1, PlanV1, ValidationIssue } from "../domain/types";

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validatePlanSchema = ajv.compile<PlanV1>(planSchema);
const validateStateSchema = ajv.compile<MatchStateV1>(stateSchema);

export function validatePlan(value: unknown): ValidationIssue[] { return validatePlanSchema(value) ? [] : issues(validatePlanSchema.errors); }
export function validateState(value: unknown): ValidationIssue[] { return validateStateSchema(value) ? [] : issues(validateStateSchema.errors); }

function issues(errors: ErrorObject[] | null | undefined): ValidationIssue[] {
  return (errors ?? []).map(error => ({ severity: "error", path: error.instancePath || "/", message: error.message ?? "Schema validation failed." }));
}
