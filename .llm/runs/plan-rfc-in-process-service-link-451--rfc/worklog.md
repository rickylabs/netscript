# Worklog: RFC draft: mounted SDK transport parity for in-process service clients (#451)

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `plan-rfc-in-process-service-link-451--rfc` |
| Branch         | `plan/rfc-in-process-service-link-451` |
| Issue          | #451 — design draft PR; body carries `Refs #451` only (no closing keyword anywhere, including prose) |
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

- `rfcs/0000-in-process-service-link.md` from `rfcs/0000-template.md`: an in-process link that mounts a service and keeps parity with the HTTP link.
- Acceptance cases from the issue comment `issuecomment-7120821765`: one mounted synthetic service, the same typed procedure through HTTP and the in-process link; two caller contexts with separate cache partitions and one denied caller; compare effective RPC path, response or denial, trace propagation, and cache isolation; abort one in-flight caller signal and show the mounted handler observes cancellation as the HTTP handler does; neither transport shares a result between contexts or retains the cancelled request.
- Reconcile with accepted RFC 0001 (typed SDK client contributions: header preparation, cache partitions, transport-owned tracing) and the `ServiceApp` dependency-direction decision in the issue.
- Mark every claim about current behavior source-inspected or measured.

### Boundaries and shared seams

- Design only: no edits under `packages/` or `plugins/`.
- #2611 owns the SDK GET transport/dedup repair: reference it, do not redesign GET transport or dedup.
- #891 (deploy plugin RFC) keeps this orthogonal; #822 closed unmerged; #824 and #850 are superseded — do not build on them.
- No accepted governing RFC covers the in-process link; this draft does not authorize implementation.
- Ask the coordinator before touching another lane's files.

### Gates

- RFC file template-shaped and link-clean; no claim about shipped API that `main` does not contain.

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
