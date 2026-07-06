import type { AgentContext, FighterAgent, PlanV1 } from "../domain/types";
import { validatePlan } from "../contracts/runtime-schema";

export class FixtureAgent implements FighterAgent {
  constructor(readonly id: string, private readonly plan: PlanV1) {}
  async createPlan(): Promise<PlanV1> { return structuredClone(this.plan); }
}

export class ManualAgent implements FighterAgent {
  constructor(readonly id: string, private readonly read: (context: AgentContext) => Promise<unknown>) {}
  async createPlan(context: AgentContext): Promise<PlanV1> {
    const value = await this.read(context); const issues = validatePlan(value);
    if (issues.length) throw new Error(`Agent returned an invalid plan: ${issues.map(issue => `${issue.path} ${issue.message}`).join("; ")}`);
    return value as PlanV1;
  }
}

export type HostedAgentOptions = Readonly<{ id: string; endpoint: URL; model: string; getToken: () => Promise<string> }>;
export class HostedAgent implements FighterAgent {
  readonly id: string;
  constructor(private readonly options: HostedAgentOptions) { this.id = options.id; if (options.endpoint.protocol !== "https:") throw new Error("Hosted agent endpoints must use HTTPS."); }
  async createPlan(context: AgentContext, signal?: AbortSignal): Promise<PlanV1> {
    const token = await this.options.getToken();
    const response = await fetch(this.options.endpoint, { method: "POST", signal, headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ model: this.options.model, prompt: context.prompt }) });
    if (!response.ok) throw new Error(`Agent request failed with status ${response.status}.`);
    const value: unknown = await response.json(); const issues = validatePlan(value);
    if (issues.length) throw new Error("Agent returned an invalid plan.");
    return value as PlanV1;
  }
}

// Tokens are requested at call time, held only in memory, and never accepted by
// constructors as plaintext configuration. Production deployments should proxy
// provider calls server-side so browser clients never receive long-lived keys.
