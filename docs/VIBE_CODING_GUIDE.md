# Vibe coding guide

This guide is the handrail for humans using coding agents. The goal is fast iteration without letting plausible-looking changes quietly alter the combat model.

## Before asking an AI to change the game

Give it four pieces of context:

1. **Outcome:** what the player should experience.
2. **Boundary:** which module should own the change.
3. **Invariants:** behaviour that must remain true.
4. **Proof:** the tests or acceptance scenarios that demonstrate completion.

Avoid requests like “add poison and make it good.” Prefer:

> Add a poison ability to the standard ruleset. A successful line cast at range 3 applies 5 damage at tick start for the next 3 ticks. It cannot stack; recasting refreshes duration. Shield halves poison damage, duck does not. Add schema/validation support, generated help text, engine scenarios for hit/miss/refresh/shield, and one UI sample. Do not change existing replay fixtures.

## The change loop

1. Read `README.md`, the relevant architecture section, and nearby tests.
2. State the intended module and list any ambiguous rule decisions.
3. Add or update a failing scenario test first for gameplay changes.
4. Make the smallest coherent implementation.
5. Run type checks, unit/scenario tests, and the production build.
6. Exercise the affected browser flow.
7. Update rules, schemas, examples, and docs in the same change.
8. Report files changed, behaviour proven, and known follow-ups.

## Rules for AI-friendly code

- Keep files focused and name them after game concepts.
- Use explicit domain types; avoid untyped dictionaries at module boundaries.
- Use exhaustive switches for action, phase, and event kinds.
- Pass dependencies as arguments rather than reading globals.
- Keep deterministic functions free of clock, network, random, DOM, and storage access.
- Represent outcomes as structured data, then format them for humans/models.
- Prefer small scenario fixtures over long setup code.
- Put a comment on *why* a non-obvious policy exists, not what the syntax does.
- Do not duplicate rule numbers in UI copy or prompts; generate them from the ruleset.
- Do not edit generated release files directly.

## Repository instructions for coding agents

`AGENTS.md` (and the equivalent `CLAUDE.md`) exist at the repo root and contain only stable, enforceable facts: canonical source location, engine purity rules, verification commands, and versioning obligations. Keep task-specific desires out of them; overly long instructions consume context and eventually contradict the code. Update them in the same change whenever one of those facts changes.

## Prompt template for a feature

```text
Goal:
Player-visible behaviour:

Rules/edge cases:
-

Must remain unchanged:
-

Likely ownership:
- domain/rules:
- engine:
- application:
- UI:

Acceptance scenarios:
1.
2.

Verification required:
- tests
- typecheck
- build
- browser flow

Update relevant schemas, examples, generated help, and docs. Ask only if a
choice would change gameplay semantics; otherwise make a conservative assumption
and record it.
```

## Prompt template for a bug

```text
Observed behaviour:
Expected behaviour:
Smallest reproduction (initial state + both plans):
Affected version/ruleset:

First encode the reproduction as a failing regression test. Identify the owning
phase and root cause, fix it without unrelated cleanup, run the full engine suite,
and report whether replay compatibility changes.
```

## Definition of done

A change is not done merely because the browser looks right. It is done when:

- ownership follows the dependency rule;
- rule semantics are explicit;
- automated tests cover the happy path and relevant edge cases;
- contracts, prompt/help output, and examples agree;
- deterministic fixtures still pass or changed snapshots were intentionally reviewed;
- accessibility and error states were considered;
- no credentials or generated artifacts were hand-edited;
- the contributor can explain how to reproduce and verify it.

## Things a vibe coder should not do

- Rewrite the whole project and add gameplay in the same change.
- Trust a model's claim that tests passed without reading the output.
- Accept visual testing as proof of combat correctness.
- use event-log wording as an API.
- Add a dependency for a tiny utility without a clear maintenance benefit.
- Allow a model integration to call the engine with unvalidated data.
- Change cooldown/timing semantics without a scenario and ruleset-version decision.
- Maintain multiple hand-edited copies of the game.

## High-leverage context files

Keep these concise and current. They dramatically improve agent output:

- `AGENTS.md` / `CLAUDE.md`: invariant repo instructions;
- `docs/RULES.md`: canonical phase/timing policies and worked examples;
- `schemas/`: machine-readable contracts;
- scenario tests in `tests/`: tiny reproducible battles;
- `docs/decisions/`: short architecture decisions for choices that should not be relitigated;
- per-module READMEs only where the ownership is not obvious.

