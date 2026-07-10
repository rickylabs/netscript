# Plan — persisted quota fallback and restoration (#579)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-epic-574-quota-fallback--pr-3` |
| Branch | `feat/epic-574-quota-fallback` |
| Base | `rickylabs-epic-574-wsl-agentic-runtime` @ `c90bc938` |
| Primary archetype | 6 — CLI / tooling (coordinator bootstrap) |
| Runtime specialization | Archetype 3 — durable state machine, time, failure, restart persistence |
| Overlay | none; README is consumer documentation for the owned tool |

## Goal

Add an auditable, value-free routing state machine for quota/plan/session limits, provider outages,
fallback choice, reset probes, and boundary-safe restoration. Persist live state machine-local and
record concise run transitions without changing global/default routes or executing paid models.

## Current Doctrine Verdict

The doctrine has no package verdict for `.llm/tools/agentic`; new code is bound immediately by A1,
A6-A8, A12-A14, AP-11/AP-12/AP-13/AP-24/AP-25, and the scoped gate discipline. No package/plugin
architecture debt is created.

## Scope

- Extend the canonical runtime contract/state/ports/planner and existing adapters.
- Persist desired/active route, reason, detected/reset/probe times, affected session, fallback depth,
  restoration state, and bounded transition history.
- Select fallbacks from explicit policy data with evaluator-family independence and paid-Fable
  approval guards.
- Normalize structured failures first and recognize exact legacy text only behind version-pinned,
  tested rules.
- Require reset eligibility plus a minimal canary before restoration at a new boundary.
- Add focused state-machine/restart/policy/classifier tests and human README usage.

## Deferred / Forbidden Scope

- #580 sender lock, daemon ownership/repair, live lifecycle execution, or rival sender creation.
- #581 global routing policy/default migration or policy-doc rollout.
- #582 rollout/promotion and production canaries.
- Provider login, credential values, raw output retention, arbitrary prompts, paid-model invocation,
  global environment mutation, or global/default route mutation.
- Rewriting #577 profiles or #578 evidence contracts.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| L1 | Extend canonical `contract.ts`, `state.ts`, `ports.ts`, `planner.ts`, profiles, and adapters; no parallel contracts. | User boundary and A1. |
| L2 | Model routing as finite phases `desired`, `degraded`, `fallback_active`, `probe_due`, `probe_failed`, `restoration_ready`, `restored`, `blocked`. | A12 requires named durable phases and terminal/block outcomes. |
| L3 | State identity is route/session scoped and persists desired route separately from active route. | Prevents opportunistic default mutation and makes restart recovery deterministic. |
| L4 | Persist reason category, detection/reset/probe timestamps, affected session, fallback depth, restoration status, and bounded transition history in controller-owned machine-local state. | Meets audit/restart acceptance while remaining value-free. |
| L5 | Run-level transitions are a concise projection: transition id, from/to, reason, route profile/model family identifiers, session id, and timestamps; no credentials, prompts, raw output, or account data. | Auditability without secret/PII leakage. |
| L6 | Structured `RuntimeDiagnostic` codes/categories are authoritative. A compatibility classifier accepts an exact tool/version key and finite regex table; unsupported versions return unknown/block. | Structured errors first; tested version-pinned fallback only. |
| L7 | Fallback candidates are policy data ordered by approved lane/purpose, not hard-coded branching. Candidate guards validate availability, boundary, family independence, mobile visibility, fallback depth, and approval. | Avoids AP-24 and preserves explicit policy. |
| L8 | Evaluator routes must be opposite-family from the author. No eligible opposite-family route produces a blocking diagnostic; self-evaluation is never selected. | Acceptance invariant. |
| L9 | Paid/on-demand Fable policy is data only: outside-plan use requires explicit approval; on-plan Fable 5 low may be preferred for orchestration; higher effort always requires escalation. | Represents current/future policy without triggering spend. |
| L10 | Fallback/restoration planning refuses `active` session boundaries. No state transition may imply an in-slice route change. | Critical-slice safety. |
| L11 | Restoration requires `now >= resetAt`, a successful minimal route canary recorded at/after reset, and an idle/new boundary. Failed probes record backoff and remain on fallback. | Reset/backoff/canary acceptance. |
| L12 | Mobile visibility differences produce a `notificationRequired` transition field only; sending/repair is deferred. | Auditable notification handoff without #580. |
| L13 | History is bounded deterministically and survives adapter reload/process restart. | Prevents unbounded local state while meeting restart/history acceptance. |
| L14 | Existing #580 lifecycle blocks and #581/#582 absence tests remain regression gates. | Locked issue boundaries. |

## State Schema

```text
RoutingState
  schemaVersion, routingStateId
  phase
  desiredRoute, activeRoute
  reasonCategory
  detectedAt, resetAt, lastProbeAt, nextProbeAt
  affectedSession
  fallbackDepth
  restorationStatus
  canary (not_run | passed | failed, checkedAt?, diagnosticCode?)
  notificationRequired
  transitions[] (bounded concise RoutingTransition)
```

No field may carry a credential value, account identity, raw provider output, prompt/content, or
unbounded stack/message text.

## Open-Decision Sweep

| Decision | Status | Resolution / deferral |
| --- | --- | --- |
| Exact finite fallback lane ordering | must resolve now | Encode from approved agent/purpose/family/profile policy data in S1; tests lock every lane. |
| Maximum fallback depth/history length | must resolve now | Name constants in S1 and test bounds; values are implementation policy, not hidden defaults. |
| Reset timestamp source | must resolve now | Structured signal metadata when supplied; otherwise no inferred reset and restoration remains blocked. |
| Legacy classifier versions/patterns | must resolve now | Only versions already evidenced in fixtures; every rule is exact and tested, unknown versions fail closed. |
| Notification delivery transport | safe to defer | #580/#581; record notification-required data only. |
| Global policy/default migration | safe to defer | Entirely #581. |
| Rollout thresholds | safe to defer | Entirely #582. |

## Files and LOC Budgets

| File | Change | Budget |
| --- | --- | ---: |
| `runtime/contract.ts` | finite routing command/result vocabulary | <= 80 added LOC |
| `runtime/state.ts` | routing state/transition schema and projections | <= 180 added LOC |
| `runtime/ports.ts` | routing state reader/writer and canary seams | <= 90 added LOC |
| `runtime/routing-policy.ts` | explicit lane/family/Fable guard data | <= 260 LOC |
| `runtime/routing-state-machine.ts` | pure transition reducer/selection/probe/restore decisions | <= 360 LOC |
| `runtime/routing-signal-classifier.ts` | structured-first, pinned compatibility classification | <= 220 LOC |
| `runtime/adapters/*state*` | reuse/extend machine-local persistence | <= 160 added LOC total |
| `runtime/planner.ts` | integrate boundary-safe route plans | <= 120 added LOC |
| focused `*_test.ts` | state, policy, restart, classifier, regressions | <= 500 LOC each |
| `.llm/tools/agentic/README.md` | human task invocation + behavior/guarantees | <= 100 added LOC |
| run artifacts | evidence, context, drift | concise |

## Commit Slice Table

| Slice | What it proves | Files | Proving gates |
| --- | --- | --- | --- |
| P0 | Research/design is current, bounded, and reviewable before code. | run `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`, thread identity | Plan-Gate by coordinator; diff/secret/lock checks |
| S1 | Finite routing schema and explicit policy select only approved, independent, approval-safe candidates. | contract/state, new policy + classifier, focused tests, run artifacts | focused `deno test --no-lock`; scoped check/lint/fmt; policy/family/Fable matrix |
| S2 | Pure state-machine transitions honor reset/backoff/canary/boundaries and persist/reload bounded history. | state machine, ports/adapters, planner, focused tests, run artifacts | focused tests including restart and active-boundary refusal; scoped wrappers |
| S3 | Controller/consumer integration exposes concise transitions, preserves #580-#582 blocks, and is human-operable. | controller/output/runner edge as needed, README, regression tests, run artifacts | full agentic/runtime tests; focused CLI invocation; scoped wrappers |
| S4 | Final reconciliation proves DoD without self-certification. | tests/docs/run artifacts only | full agentic/runtime suite, arch/scoped gates, diff/secret/lock checks; coordinator Tier-A review pending |

## Gate Set

- Every slice: focused `deno test --no-lock` with only required permissions; scoped
  `.llm/tools/run-deno-{check,lint,fmt}.ts --root .llm/tools/agentic --ext ts,tsx`; `git diff
  --check`; secret scan; `deno.lock` unchanged.
- Runtime: transition table, restart reload, active-boundary refusal, reset/backoff, minimal canary,
  probe failure, restoration, bounded history, mobile-notification projection.
- Policy: lane order, author/evaluator opposite-family block, paid-Fable approval block, no global
  mutation, unknown route/version fail-closed.
- Consumer: complete `.llm/tools/agentic/runtime/*_test.ts` plus adjacent agentic tests; human task
  invocation and JSON/human output parity if an edge changes.
- Fitness: relevant F-1/F-2/F-3/F-5/F-10-F-16/F-18/F-19 and F-CLI checks; JSR/package publish gates
  N/A because `.llm/tools` is not published.
- Release/scaffold E2E N/A: no scaffold, plugin, DB, Aspire generation, published CLI, or release cut.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Automatic fallback silently becomes a default migration. | Keep desired route immutable; persist active route separately; explicit regression asserting no global/env/default writes. |
| Text classifier overfits provider prose. | Exact version key + tested finite rules; unknown version/text blocks. |
| Restore occurs during active work. | Boundary is a reducer/planner precondition tested for every route-changing transition. |
| Probe loops before reset or hammers provider. | Require resetAt and injected clock; failed probe records nextProbeAt/backoff. No timers in reducer. |
| Evaluator falls back to author family. | Candidate guard excludes same-family routes and blocks empty result. |
| Paid Fable route is selected. | Approval guard in policy data; tests prove missing approval blocks; no execution port is invoked. |
| State leaks values or grows unbounded. | Value-free schema, concise transition projection, named history cap, secret scan, restart round-trip tests. |
| Work crosses #580-#582. | Existing deferred-boundary tests plus new negative tests remain mandatory. |

## Contributor Path

Start with `routing-policy.ts` for approved lanes/guards, `routing-state-machine.ts` for pure
transitions, `state.ts` for persistence shape, and `planner.ts` for command integration. Add a finite
constant and derived union first, then a table-driven test. Adapters only persist/probe through the
named ports; they never choose policy.

## Plan-Gate Stop

No implementation begins until the separate coordinator Plan-Gate records PASS. Do not merge until
the final coordinator Tier-A review and separate evaluation obligations are satisfied.

