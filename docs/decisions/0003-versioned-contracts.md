# ADR 0003: Version schemas, engine, ruleset, and replay independently

Status: accepted

Saved bundles record their schema, engine version, ruleset identity/version, canonical inputs, result, and SHA-256 hash. Older unversioned plans migrate explicitly; a mismatched hash is rejected instead of being silently replayed.
