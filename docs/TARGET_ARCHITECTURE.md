# Target architecture

## Recommended shape

Use TypeScript with a small Vite-based web app and Vitest. Keep a generated standalone HTML release if one-click portability matters. The important choice is not the framework; it is keeping the engine free of browser APIs.

```text
src/
  domain/
    types.ts              # Plan, Action, MatchState, Event, Result
    rules.ts              # Canonical immutable ruleset data
    schemas/              # JSON Schemas and schema versions
  engine/
    normalize-plan.ts
    normalize-state.ts
    phases/
      tick-start.ts
      movement.ts
      defence.ts
      utility-spells.ts
      attacks.ts
      damage.ts
      defeat.ts
    simulate-tick.ts
    simulate-round.ts
  content/
    standard-ruleset.ts
    samples.ts
  application/
    match-controller.ts    # Coordinates use cases, not DOM
    replay-store.ts
    prompt-builder.ts
    agent-adapter.ts
  presentation/
    format-event.ts
    components/
    styles/
  infrastructure/
    browser-storage.ts
    clipboard-agent.ts
tests/
  engine/
  fixtures/
  contracts/
docs/
```

## Dependency rule

Dependencies point inward:

```text
UI / storage / model adapters -> application -> engine -> domain
```

The domain and engine must not import DOM, timers, storage, clipboard, network, or UI code. A headless test or command-line tool must be able to call the same engine as the browser.

## Core contracts

Prefer explicit versioned objects:

```ts
type PlanV1 = {
  schema: 1;
  fighter_name: string;
  strategy?: string;
  actions: PlannedAction[];
};

type MatchInputV1 = {
  engineVersion: string;
  rulesetId: string;
  rulesetVersion: number;
  state: MatchStateV1;
  plans: { A: PlanV1; B: PlanV1 };
};

type CombatEvent = {
  tick: number;
  phase: Phase;
  type: string;
  actor?: FighterId;
  target?: FighterId;
  data: Record<string, unknown>;
};
```

Text logs should be views of `CombatEvent`, not the engine's only record. Public/private narration, UI animations, analytics, and model context can then use separate formatters.

## Simulation pipeline

Each tick should execute an ordered list of phases. Each phase accepts immutable state plus declared actions and returns updated state plus events. Even if implementation uses local mutation for speed, the public boundary should behave as a pure function.

```text
normalize input -> tick start -> movement intents -> resolve movement
-> defensive intents -> utility spell intents -> attack intents
-> simultaneous damage -> defeat check -> snapshot
```

Intent collection matters. All fighters declare effects from the same phase snapshot, then those intents resolve together. This prevents A/B iteration order from deciding simultaneous actions.

## Rules and abilities

Keep numeric content in a `Ruleset` object, but do not force every rule into configuration. Complex resolution belongs in tested code. A useful compromise is an ability registry:

```ts
type AbilityDefinition = {
  id: string;
  cooldown: number;
  targeting: "self" | "direction-line" | "direction-destination";
  promptSummary: string;
  validate(action: Action): ValidationIssue[];
  createIntent(context: AbilityContext): Intent[];
};
```

Registering an ability should automatically make it available to validation, prompt/help generation, and the simulator. UI-specific art and labels can remain presentation metadata.

## Versioning and migration

Version four things independently:

- input schema;
- engine release;
- ruleset;
- replay format.

Never silently reinterpret an old saved match with new rules. Load it with the recorded compatible engine/ruleset or migrate it explicitly. Store a canonicalized input hash so a replay can prove which inputs produced it.

## Agent boundary

Model providers should not be imported into combat code. Define an adapter such as:

```ts
interface FighterAgent {
  id: string;
  createPlan(context: FighterContext, signal?: AbortSignal): Promise<PlanV1>;
}
```

Adapters can include clipboard/manual entry, deterministic fixtures, local models, or hosted APIs. Put secrets only in a server-side or user-controlled provider layer; never bake API keys into the standalone HTML.

## Testing strategy

- **Unit tests:** geometry, normalization, phase policies, cooldown/effect timing, damage reduction.
- **Scenario tests:** complete tick/round fixtures with exact state and structured events.
- **Contract tests:** every sample plan and saved match validates against its schema.
- **Property tests:** HP stays in range, positions remain in bounds and distinct, identical inputs give identical outputs.
- **UI tests:** load samples, simulate, navigate replay, carry state, import/export.
- **Golden tests:** prompt/help output changes only via reviewed snapshots.

