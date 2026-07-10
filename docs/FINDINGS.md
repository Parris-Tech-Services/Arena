# Technical and product findings (v1 prototype audit)

> **Status:** this is the audit of the original single-file prototype, kept for provenance. The v0.2.0 migration resolved findings 1–7, 9, and 10 (see `PLATFORM_STATUS.md` and `RULES.md`). The code map in the appendix describes `legacy/prototype-v1/llm-gladiator-arena.html`.

## Executive assessment

The prototype has a strong kernel: deterministic simultaneous turns, concise JSON input, tolerant validation, state carry-over, replay frames, public/private logs, and no installation burden. Those are unusually good ingredients for AI-driven development because inputs and outputs are structured and results can be reproduced.

Its main constraint is structural. Roughly every responsibility is embedded in one HTML document: CSS, markup, configuration, sample content, state validation, combat resolution, event formatting, prompt generation, rendering, playback, and DOM event wiring. A small change can therefore alter several behaviours accidentally, and there is no automated safety net.

## What already works well

- **Determinism:** no random number source is used. The same plans and initial state produce the same outcome.
- **Pure-ish core:** `simulate(rawA, rawB, rawState)` mostly operates on passed data and returns a result. This is a natural extraction seam.
- **Structured protocol:** plans and match state already use JSON with a `schema` field.
- **Useful result model:** a result includes frames, warnings, public events, private events, final state, winner information, and configuration.
- **Fault tolerance:** malformed actions usually become `idle`, allowing a match to continue.
- **Inspectable gameplay:** every tick generates readable events and a replay frame.
- **Portable delivery:** one file works without a server or package install.

## Current risks and ambiguities

### 1. One file has too many reasons to change

Changing spell balance, JSON validation, wording, display, playback, or prompts all touches the same artifact. This increases merge conflicts, context size, and accidental coupling—three things AI coding tools are especially vulnerable to.

### 2. There are no executable specifications

Combat behaviour is represented by prose and implementation only. There are no tests for collisions, simultaneous damage, cooldown timing, shield duration, snare timing, blink failure, healing, invalid plans, or match carry-over. Refactoring cannot currently prove that behaviour stayed the same.

### 3. Rules are partly data and partly hard-coded

Numbers live in `CONFIG`, but spell names and resolution order are repeated across validation, simulation, prompt text, and help copy. Adding a spell requires edits in several distant places. The `description` fields are not the canonical source for player-facing rules.

### 4. Validation is permissive but not formally defined

The app warns on schema mismatch and continues. Nested state objects such as cooldowns and effects accept arbitrary keys and values. Plan normalization creates a sparse one-based array. This works, but consumers do not have a JSON Schema or TypeScript type describing the contract.

### 5. Timing semantics need a canonical specification

Cooldowns and effects decrement at the beginning of each tick. Shield is then applied with duration `2`, so it protects the cast tick and—after decrement—the next tick. Snare is applied after movement and starts at `1`; it decrements to `0` before the next movement phase, which means the current implementation **does not prevent movement on the following tick** despite the log claiming that it does (confirmed by code trace: `effects.snared = 1` is set in the offense phase, `tickDownEffects` zeroes it at the start of the next tick, and the movement check requires `> 0`, so the "was snared and could not move" branch is unreachable). This should be captured by a failing regression test and then fixed deliberately — either set snare duration to `2` to mirror shield's convention, or move effect decay to end-of-tick and re-verify shield.

### 6. Resolution order contains edge cases

- Setup spells are iterated A then B, so simultaneous blinks can observe already-updated positions and may be side-order dependent.
- Dash only collision-checks its destination square, so a fighter can dash straight *through* the opponent. Possibly intended as a dodge-roll mechanic, but neither the rules card nor the model prompt mentions it, so LLM combatants cannot reason about it. Decide and document.
- A fighter that moves into the other fighter's stationary square causes `sameTarget`; the log says both bounced even though only one moved.
- `lineHits` ignores arena bounds and obstacles. That may be intended, but should be specified.
- Failed blink consumes cooldown, while a repeated heal does not. These policies need to be explicit.
- `Math.ceil` is used for each defensive reduction; stacked block and shield reduce melee damage twice. This should have a test.
- Private logs are produced using name string replacement. Names that overlap with ordinary text or each other can cause surprising redaction.

### 7. Source and artifacts are ambiguous

The workspace contains multiple HTML and ZIP copies. There is no manifest declaring which file is authoritative or a repeatable release process to generate the others. AI tools may edit the wrong copy.

### 8. ~~Text encoding is visibly damaged~~ (withdrawn)

Withdrawn after verification: a byte-level check of every HTML copy found no damaged UTF-8 sequences. The apparent mojibake was an artifact of viewing the file with the wrong decoding.

### 9. Browser state is fragile

Plans and state are not persisted. Reloading loses the current match. There is no import/export bundle containing config, initial state, both plans, engine version, and result hash.

### 10. Accessibility and UI scalability are limited

The grid is visual only, status changes are not announced, controls lack richer keyboard semantics, and combat events are plain strings. Structured events would enable accessible narration, filtering, animation, analytics, and localization without parsing text.

## Highest-value opportunities

1. Extract and test the engine without changing its behaviour.
2. Define versioned TypeScript types and JSON Schemas for plans, state, events, and replays.
3. Make rules/content canonical and derive help and prompts from them.
4. Replace event strings at the engine boundary with structured event objects; format them in adapters.
5. Establish one source tree and generate the single-file release artifact.
6. Add saved match import/export and deterministic replay fixtures.
7. Add an agent adapter interface so clipboard, local mock agents, and remote model providers share one boundary.

## Product usefulness beyond the prototype

With those foundations, the project can become more than a manual duel viewer:

- tournament and round-robin runner;
- model/prompt evaluation harness;
- balance simulation and telemetry tool;
- custom rulesets, maps, and abilities;
- shareable deterministic replay links/files;
- human-vs-agent and agent-vs-agent modes;
- headless command-line simulation for CI and bulk evaluation;
- teaching sandbox for planning, game theory, and prompt design.

## Appendix — code map of the current prototype

Line numbers refer to `legacy/prototype-v1/llm-gladiator-arena.html` as of this audit. This is the fastest way for a human or coding agent to orient before an edit.

| Lines | Section | Role |
|---|---|---|
| 7–162 | `<style>` | All CSS, themed via `:root` custom properties |
| 164–275 | `<body>` markup | Cards: rules, plan inputs, round state, validation, replay grid, battle log, base prompt |
| 278–298 | `CONFIG`, `DIRS` | Game constants: grid size, ticks, HP, melee damage, spell table |
| 300–348 | `SAMPLE_A/B`, `DEFAULT_STATE` | Demo plans and the initial match state |
| 350–381 | globals + helpers | `lastResult`, `currentFrame`, `els` cache; `clone`, `inBounds`, `addDir`, `manhattan`, `lineHits` |
| 383–450 | `parseJson`, `normalisePlan`, `normaliseAction` | Input validation; bad actions degrade to `idle` + warning |
| 452–480 | `normaliseState` | Validates/clamps the carried-over match state |
| 491–497 | `tickDownEffects`, `hasEffect`, `onCooldown` | Effect/cooldown bookkeeping |
| 499–728 | `simulate`, `describeAction`, `frameFromState`, `getResult` | **The engine.** Runs all ticks, produces frames + prose events + final state |
| 730–795 | `renderFrame`, `renderGrid`, `renderResult` | Replay rendering, HP bars, validation display |
| 797–824 | `buildBasePrompt`, `copyText` | LLM prompt generation and clipboard |
| 826–894 | `doSimulate`, `init` | Event wiring, playback timer |

### The tick pipeline inside `simulate` (lines 517–682)

1. **Effect/cooldown decay** — `tickDownEffects` for both fighters (line 525). Runs before anything else; the source of the snare timing bug above.
2. **Movement** — `move`/`dash` compute desired squares; same-target or swap → both bounce back (529–556).
3. **Defence flags** — `block`/`duck` set `fighter.temp` flags (559–566).
4. **Utility spells** — `shield`, `blink`, `heal` resolve, A before B (569–604).
5. **Offense** — melee `attack`, then `firebolt`/`snare`; damage collected into a queue, not applied yet (607–648).
6. **Damage application** — queued damage applied simultaneously; block halves melee, shield halves everything, each reduction uses `Math.ceil` (651–665).
7. **Defeat check** — either fighter at 0 HP ends the round early (671–681).

### Every place a new spell currently touches

Adding one spell today requires coordinated edits at all of these, which is the concrete cost behind finding 3:

1. `CONFIG.spells` (line 284) — numbers and description.
2. The directional-spell whitelist `["firebolt", "blink", "snare"]` in `normaliseAction` (line 439) — otherwise a direction is never parsed.
3. The utility-spell resolution chain (line 569) *or* the offense chain (line 622) — otherwise the spell validates but never fires.
4. The hand-written prompt template in `buildBasePrompt` (line 801) — otherwise the LLMs are never told the spell exists.
5. The HTML rules card (line 188) — otherwise humans are not told either.

