# Worklog: RFC draft: opt-in rolling quotas for protected service reads (#2653)

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `plan-rfc-rolling-service-quotas-2653--rfc` |
| Branch         | `plan/rfc-rolling-service-quotas-2653` |
| Issue          | #2653 — design draft PR; body carries `Refs #2653` only (no closing keyword anywhere, including prose) |
| Classification | design draft awaiting owner |
| Archetype      | RFC document (`rfcs/0000-*.md`); no framework source |
| Scope overlays | `SCOPE-docs.md` |
| Milestone      | `0.0.10` |

## Coordinator bootstrap (2026-11-24)

Baseline `main` = `87965d800b7d61312e8612c82bdb0cb98bdf5b29`; `v0.0.10-canary.4` = `7c51c7efb64cbf65c567232245c13fea69f45fe4`.

### Owner model authorization

> Owner explicitly authorized T3 dispatch, with rationale for Neon: it first found or co-found these gaps. Exact public builder model settings: […] providerInstanceId antigravity, model gemini-4-neon, options {thought_level:'xhigh'} for N2 #2651, […] N5 #2653, #2146 and #451. […] If Antigravity is out of quota or unavailable, report before falling back. No silent switches.
>
> […] For Neon builds Codex Sol independent review is authorized, […]

Quoted verbatim from the owner's batch directive. `[…]` marks elided text that concerns lanes or parties outside this run's public record; nothing that governs this lane is elided.

### Route record

| Role | Requested identity | Transport | Family |
| ---- | ------------------ | --------- | ------ |
| Builder | providerInstanceId `antigravity`, model `gemini-4-neon`, options `{thought_level: 'xhigh'}` | T3 `delegate_task`, isolation `worktree` | Google |
| Design reviewer | providerInstanceId `codex`, model `gpt-6.2-sol`, options `{reasoningEffort: 'xhigh'}`, a separate session (OpenAI vs Google) | separate session | OpenAI |

- Workload tier: `feature`. The privileged `complex`/`architecture` rows are not authorized for
  this lane and are not selected.
- PLAN-EVAL: N/A — design-only deliverable; the independent design review is the gate.
- Design review: one independent design verdict at the exact head; documentation cap of two rounds. The design verdict is not an IMPL-EVAL and does not authorize implementation.
- No implementation lane self-certifies. Automated green gates are evidence, not review.
- Fallback: none without an owner report first. If the builder or reviewer provider is unavailable
  or out of quota, the coordinator reports before any fallback; no silent model or provider switch.

### Scope

- `rfcs/0000-rolling-service-quotas.md` from `rfcs/0000-template.md`.
- Compatible decision semantics for fixed-window (default, unchanged) and opt-in rolling policies in both first-party rate-limit stores (memory and shared KV).
- Compare strict rolling admission, approximate rolling counters, and explicit burst/refill budgets; keeping fixed windows plus reducing duplicate reads stays a listed alternative.
- Specify storage bounds, atomicity under concurrent reservations, memory/KV parity, `resetAt` meaning, and how callers get the next eligible instant for `Retry-After`.
- Reproduce the issue's deterministic alignment example against current `main` source and label it measured; label everything else source-inspected.

### Boundaries and shared seams

- Design only: no edits under `packages/` or `plugins/`.
- No accepted governing RFC exists; this draft does not authorize implementation.
- Ask the coordinator before touching another lane's files.

### Gates

- `deno fmt --check` on the RFC file is not a verdict source for Markdown; keep the file template-shaped and link-clean (`deno task docs:links` if it covers `rfcs/`).
- Any TypeScript snippet that claims to run is run against current `main` and its output recorded in this run dir.

## Design

Builder records this section before creating implementation files (`workflow/run-loop.md` § 3b).

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-11-24 | S0 | bootstrap | Coordinator bootstrap commit: `supervisor.md`, `worklog.md`, `drift.md`. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |

## Drift

See `drift.md`.
