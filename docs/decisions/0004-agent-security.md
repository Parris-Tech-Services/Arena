# ADR 0004: Agent providers live behind adapters

Status: accepted

The combat engine never knows about model vendors. `FighterAgent` is the provider boundary. Hosted adapters require HTTPS, request credentials only at call time, retain no plaintext key, validate returned plans, accept cancellation, and should use a server-side proxy for long-lived production credentials.
