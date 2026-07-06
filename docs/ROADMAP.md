# Modernization roadmap

> The requested platform phases have a completed, tested baseline in version 0.2.0. See `PLATFORM_STATUS.md`. Future additions should extend these boundaries rather than reopening the migration.

Each phase should leave the game runnable. Separate structural migration from new mechanics.

## Phase 0 — establish truth

- Declare the root HTML as the temporary source of truth.
- Remove or relocate duplicate copies; generate ZIPs only during release.
- Normalize the source to UTF-8 and repair damaged glyphs.
- Record representative input/result fixtures from the current engine.

**Complete when:** there is one editable source and documented release artifacts.

## Phase 1 — extract the engine

- Create a TypeScript project with formatter, linter, typecheck, Vitest, and build scripts.
- Extract config, plan/state normalization, geometry, simulation, and result logic.
- Preserve current behaviour initially, including documented quirks.
- Add regression tests for every action and the existing sample duel.

**Complete when:** the browser and headless tests call the same engine, and no engine file uses browser APIs.

## Phase 2 — settle rule semantics

- Write `docs/RULES.md` with exact phase, cooldown, and status timing.
- Add tests for snare-next-tick behaviour and simultaneous blink.
- Resolve A/B ordering, failed-action cooldown, stacked defence rounding, and collision wording.
- Increment the ruleset version for intentional changes.

**Complete when:** swapping fighter labels cannot change a symmetric outcome, except for explicitly asymmetric input.

## Phase 3 — formal contracts and structured events

- Add TypeScript discriminated unions and JSON Schemas.
- Validate at import/agent boundaries and return path-aware issues.
- Replace engine log strings with typed events.
- Add public, private, accessible, and model-context event formatters.

**Complete when:** no UI or integration needs to parse human-readable logs.

## Phase 4 — canonical content and UI split

- Add an ability registry/ruleset definition.
- Generate prompt rules and in-game help from the registry.
- Split UI components, match controller, replay playback, and storage.
- Add accessible grid narration, focus states, live status, and reduced-motion support.

**Complete when:** a simple ability addition has one definition, one resolver, tests, and optional presentation assets—not edits scattered across the app.

## Phase 5 — reproducible matches

- Import/export a versioned match bundle.
- Persist drafts and current matches locally.
- Include engine/ruleset versions and canonical input hash.
- Add a headless CLI to simulate a fixture and emit JSON.

**Complete when:** a bug report can be a single small match file that reproduces exactly in CI.

## Phase 6 — agent and tournament platform

- Implement the `FighterAgent` interface, starting with manual/clipboard and fixture agents.
- Add provider calls behind a server or safe user-controlled adapter.
- Add timeouts, cancellation, retries, response validation, cost/token budgets, and audit metadata.
- Build seeded schedules, round robin tournaments, rankings, and exportable metrics.

**Complete when:** tournament results record enough metadata to reproduce plans and simulation independently, without exposing secrets.

## Suggested first regression matrix

| Area | Scenarios |
|---|---|
| Movement | edge, dash edge, same target, swap, enter stationary opponent, dash through opponent |
| Melee | hit, miss, block, shield, block + shield rounding |
| Firebolt | range boundaries, wrong line, duck, shield, cooldown |
| Blink | success, edge failure, occupied target, simultaneous destinations |
| Snare | hit, miss, next-tick move, non-movement action, refresh |
| Heal | normal, max-HP clamp, second use, state carry-over |
| Lifecycle | simultaneous defeat, early round end, tied/leading result |
| Validation | malformed JSON, missing actions, duplicate/out-of-range ticks, unknown fields |
| Reproducibility | repeated input equality, A/B symmetry, save/load round trip |
