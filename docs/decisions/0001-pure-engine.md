# ADR 0001: Browser-independent deterministic engine

Status: accepted

The engine must remain independent of DOM, storage, networking, clocks, and randomness. Browser, CLI, tournament, and future server consumers call the same `simulate` function. This keeps results reproducible and makes gameplay testable without presentation infrastructure.
