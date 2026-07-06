# Platform completion status

Completed in version 0.2.0:

- [x] Broader combat scenario tests and 100-run property suite
- [x] Runtime JSON Schema validation with path-aware errors
- [x] Explicit migration helpers for unversioned plans and state
- [x] Match import/export with canonical SHA-256 replay hashes
- [x] Headless simulation CLI
- [x] Ability registry shared by validation and prompt generation
- [x] Manual, fixture, and HTTPS hosted agent adapters
- [x] In-memory credential callback, cancellation, and response validation
- [x] Deterministic round-robin tournament runner
- [x] Standings, points, W/D/L, HP-for, HP-against, and HP differential ranking
- [x] Automated UI flow and WCAG A/AA accessibility checks
- [x] Keyboard focus, live replay status, text grid narration, and reduced-motion support
- [x] Generated self-contained HTML and release ZIP workflow
- [x] Architecture decision records
- [x] Duplicate prototype files moved under `legacy/prototype-v1/`

“Complete” means each requested capability has an implemented, tested baseline. Additional provider-specific adapters and tournament formats can extend the boundaries now in place.

## Commands

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run release
npm.cmd run cli -- plan-a.json plan-b.json state.json
npm.cmd run tournament -- plan-a.json plan-b.json plan-c.json
```

Generated deliverables are in `release/`. The standalone HTML has its scripts and styles inlined and requires no server.
