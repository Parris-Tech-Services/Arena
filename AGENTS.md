# Agent instructions

- Canonical source is `src/`; `dist/`, ZIP files, and the legacy standalone HTML are artifacts.
- The engine must not import browser, storage, timer, clipboard, network, or model-provider modules.
- Gameplay changes require scenario tests and an explicit ruleset-version decision.
- Run `npm.cmd test`, `npm.cmd run typecheck`, and `npm.cmd run build` before completion.
- Preserve deterministic output; never use ambient randomness or time in the engine.
- Update types, schemas, examples, generated help, and rules documentation when a contract changes.
- Never place API keys or other secrets in client code.
