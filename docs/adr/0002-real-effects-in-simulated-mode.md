# ADR 0002 — Real effects, even in simulated mode

**Status:** Accepted

## Context

Most "AI agent" demos emit plausible-looking but fake output. A reviewer spots this immediately
and the credibility evaporates. We want Aria to feel real the moment it's cloned — *without*
requiring an API key.

## Decision

Separate **intelligence** (the brain) from **capability** (the tools). Tools do real work
regardless of which brain is active. Even when the deterministic simulated brain is "thinking,"
the orchestrator invokes real tools:

- `web_search` hits live sources (DuckDuckGo + Wikipedia, keyless) and returns cited results.
- `run_js` actually executes the JavaScript an agent writes, in a sandboxed Worker.
- artifacts written to the Files app are real, downloadable bytes.

## Consequences

- **Positive:** the zero-config demo produces genuinely real research, real computed output, and
  real files. The project is credible without a key.
- **Positive:** swapping in a real brain (BYO-key or local) upgrades the *reasoning* while the
  capability layer is unchanged — clean separation.
- **Trade-off:** tools that call the network can fail or rate-limit. Every tool must degrade
  gracefully and report a clear `ToolResult`, which the simulated narrative falls back on.
