# ADR 0001 — A brain-agnostic agent runtime

**Status:** Accepted

## Context

Aria's agents need intelligence from somewhere. There are three very different sources we want to
support: a deterministic **simulated** engine (so the project works the instant it's cloned, with
no key and no cost), a **bring-your-own-key** path to hosted models (OpenAI / Anthropic), and a
**local model** running in the browser via WebGPU (no server, fully private). These have wildly
different latency, capability, and failure characteristics.

The naive approach — branching on the provider throughout the orchestrator and the UI — would
spread provider-specific logic everywhere and make adding a fourth source painful.

## Decision

Define a single `Brain` interface (`complete(request) → result`) and write every agent and the
orchestrator against it. Each source — `SimulatedBrain`, `ApiBrain`, `LocalBrain` — is one
implementation. Brain selection happens in exactly one place, driven by `available()` for
graceful fallback (`local → api → simulated`).

## Consequences

- **Positive:** agents are written once and run unchanged on any brain. Adding a new source is a
  single new class. The simulated brain keeps the repo alive for first-time visitors.
- **Positive:** tools are also brain-agnostic, so *real effects* (web search, code execution,
  file writes) happen regardless of which brain is active — the project is never "just theater."
- **Trade-off:** the interface is a lowest-common-denominator. Provider-specific features (e.g.
  native function-calling vs. prompt-based tool use) are normalised behind it, which costs a
  little capability for a lot of simplicity.
