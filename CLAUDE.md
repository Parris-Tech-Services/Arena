# CLAUDE.md — instructions for coding agents

LLM Gladiator Arena: a deterministic turn-planning duel game. Two LLMs submit JSON battle plans; a simulator resolves 12 ticks on a 7×7 grid; the page shows a replay and produces logs/prompts for the next round.

## Read first

- `docs/FINDINGS.md` — audit of the current code, known bugs, and a line-numbered code map. **Read the code map before opening the HTML file.**
- `docs/TARGET_ARCHITECTURE.md` — where the project is headed (extracted engine, ability registry, structured events).
- `docs/VIBE_CODING_GUIDE.md` — the change loop and prompt templates; follow its "definition of done".
- `docs/ROADMAP.md` — phased migration plan; check which phase is current before choosing where a change belongs.

## Facts that must stay true

- **Canonical source is `llm-gladiator-arena.html` at the repo root.** The `files/` directory and all `*.zip` files are stale distribution copies — never edit them, and never trust them as reference.
- **The engine is deterministic.** No `Math.random()`, no `Date.now()`, no clock/network/storage access in simulation code. Identical plans + state must produce identical battles. If a feature needs randomness, it must be seeded from the match input.
- **Validation is forgiving by design.** Malformed LLM output degrades to `idle` with a warning; it never hard-fails a whole plan. Do not "fix" this into strict rejection.
- **Rules changes must land in every copy of the rules.** Until the ability registry exists, the rules live in three places that drift: `CONFIG` (line ~278), the HTML rules card (line ~181), and the prompt template in `buildBasePrompt` (line ~801). If the LLM prompt disagrees with the engine, every match is silently corrupted — this is the highest-severity class of bug in this project.
- **Event-log wording is the LLMs' sensory input**, and (for now) the tests' only handle. Change wording deliberately, and never make logs claim something the engine didn't do.
- **Timing convention:** effects and cooldowns decrement at the *start* of each tick. An effect meant to last "this tick and next" must be applied with duration `2` (see shield). This is exactly how the snare bug happened (duration `1` decays before it can act — see FINDINGS §5).

## How to verify a change

There is no test suite yet (adding one is roadmap Phase 1 — prefer doing that over manual-only verification if you touch engine logic). Until then, minimum manual verification:

1. Open the HTML file in a browser (or `python -m http.server 8000` from the repo root for working clipboard buttons).
2. Click **Simulate round** with the preloaded samples — must complete with no console errors and no unexpected validation warnings.
3. Step through the replay; confirm positions and HP match the battle log.
4. Exercise the specific mechanic you changed with a minimal hand-written plan (a plan with 2–3 relevant ticks; missing ticks become `idle` automatically).
5. Click **Carry final state into next round** and simulate again — state carry-over is easy to break.
6. If you touched rules: confirm `CONFIG`, the rules card, and the copied base prompt all agree.

## Scope discipline

- Keep structural refactors, behavior fixes, and balance changes in separate commits.
- Fixing a gameplay bug changes match outcomes; say so explicitly in your report.
- Do not put API keys or provider calls into the HTML file. Model integration goes behind the agent adapter described in `docs/TARGET_ARCHITECTURE.md`.
