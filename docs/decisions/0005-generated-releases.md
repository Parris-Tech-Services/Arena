# ADR 0005: Releases are generated artifacts

Status: accepted

Only `src/` is edited. The release command type-checks, tests/builds, creates a single self-contained HTML file, verifies it has no external script/style assets, and packages it with schemas and README. Historical hand-edited copies live under `legacy/`.
