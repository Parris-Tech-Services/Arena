# LLM Gladiator Arena

LLM Gladiator Arena is a deterministic, turn-planning combat prototype. Two models submit JSON plans, the browser resolves the duel, and players can replay the result and feed a private battle log into the next planning round.

## Current project

Canonical source lives in `src/`. Original HTML/ZIP copies are archived under `legacy/prototype-v1/` and must not be edited.

```powershell
npm.cmd install
npm.cmd run dev
```

Use `npm.cmd test`, `npm.cmd run typecheck`, and `npm.cmd run build` before completing a change. The production build is written to `dist/`. Use `npm.cmd run release` for the self-contained HTML and ZIP, `npm.cmd run cli -- PLAN_A.json PLAN_B.json [STATE.json]` for a headless match, and `npm.cmd run tournament -- PLAN_1.json PLAN_2.json [...]` for round robin standings.

## Documentation map

- [`docs/FINDINGS.md`](./docs/FINDINGS.md) — audit of the current prototype, risks, and opportunities; its appendix is a line-numbered map of the current single-file implementation.
- [`docs/TARGET_ARCHITECTURE.md`](./docs/TARGET_ARCHITECTURE.md) — recommended module boundaries and data flow.
- [`docs/VIBE_CODING_GUIDE.md`](./docs/VIBE_CODING_GUIDE.md) — the working agreement and prompt recipe for AI-assisted changes.
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — an ordered migration plan with completion criteria.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — a small, repeatable change workflow.
- [`CLAUDE.md`](./CLAUDE.md) — invariants and verification steps for coding agents (valid for the current single-file phase).

## Architecture status

The engine is extracted, browser-independent, schema-validated, tested with scenarios and randomized properties, and shared by the browser, CLI, and tournament runner. Add mechanics through the ability/rules modules and scenario tests; never edit generated release files. See `docs/PLATFORM_STATUS.md` and `docs/decisions/`.

## Product principles

1. The simulation is deterministic and independent of the UI.
2. Rules and content are data where practical; resolution policies are explicit code.
3. Every behaviour change has an executable example or test.
4. Saved matches are versioned and reproducible.
5. The browser remains easy to run locally.
6. Documentation explains where a change belongs and how to verify it.
