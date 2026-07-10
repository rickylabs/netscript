# Worklog — persisted quota fallback and restoration (#579)

## Design

### Public Surface

- Extend canonical runtime commands/results rather than introduce a second controller.
- Export finite routing phases/reasons/restoration states and value-free state/transition types.
- Export pure policy selection, signal classification, and state transition functions.
- Persist through the existing controller state adapter; expose concise transitions in status/output.

### Domain Vocabulary

- `RoutingPhase`, `RoutingReasonCategory`, `RestorationStatus`, `RoutingCanaryStatus`.
- `RoutingState`, `RoutingTransition`, `RoutingSignal`, `RoutingPolicyContext`, `FallbackCandidate`.
- Route family is explicit policy data used to enforce author/evaluator independence.

### Ports

- Reuse `ClockPort` for deterministic timestamps.
- Add narrow routing-state read/write seams only if existing persisted-state ports cannot carry the
  new schema coherently.
- Reuse bounded process/canary seams; no new raw process-output port.

### Constants

- Finite phases, reasons, restoration/canary states, model families, lane purposes.
- Named maximum fallback depth/history length and backoff policy.
- Exact compatibility classifier version keys.

### Runtime Semantics

- Identity: routing-state id plus affected session identity.
- Lifecycle: desired → degraded → fallback active → probe due/failed → restoration ready → restored,
  with blocked outcomes.
- Supervisor boundary: pure reducer/planner decides; adapters persist and probe; handlers do not
  swallow or reinterpret unexpected errors.
- Cancellation: no new long-running loop; process canary remains bounded by existing request seam.
- Delivery/concurrency: synchronous per-routing-state serial decisions; persistence is last-write
  state plus bounded ordered transition history.
- Diagnostics: structured diagnostic codes first; version-pinned compatibility text only in one
  classifier.

### Commit Slices

1. P0 plan/design artifacts and run identity.
2. S1 contract, policy, classifier, and matrix tests.
3. S2 reducer, persistence, probes/restoration, restart tests.
4. S3 consumer/README and deferred-boundary integration.
5. S4 final gates and coordinator handoff.

### Deferred Scope

#580 sender/daemon work, #581 global/default migration, #582 rollout, notification transport, live
provider login, paid-model execution, and global environment mutation.

### Contributor Path

Read policy → reducer → persisted state → planner. Extend finite constants and a table-driven test
before adding behavior. Policy stays pure; IO stays in adapters.

## Pre-flight Evidence

| Check | Result |
| --- | --- |
| Explicit integration fetch | exit 0; `origin/rickylabs-epic-574-wsl-agentic-runtime` = `c90bc938` |
| Feature fetch | exit 0; remote feature ref found |
| Baseline ancestry | exit 0; HEAD `783e505e` descends from `c90bc938` |
| #577 / #578 presence | provider profiles and Antigravity adapter present |
| Initial status | only untracked coordinator `codex-thread-ids.md` |
| Lock baseline | no `deno.lock` diff |

## Slice Log

| Date | Slice | Status | Evidence |
| --- | --- | --- | --- |
| 2026-07-10 | P0 | ready for coordinator Plan-Gate | Research, locked plan, Design, context, drift, thread identity prepared. |
| 2026-07-10 | S1 | gates green | Pure policy selects explicit candidates only; active/depth/approval/opposite-family guards fail closed; structured diagnostics precede exact pinned text. Focused tests: 7 passed, 0 failed. Scoped check/lint/fmt: exit 0, 0 findings. |

### S1 Reconcile

- PR #588 remains draft and issue #579 remains the sole resolving scope.
- #580 lifecycle/sender work, #581 global/default migration, and #582 rollout remain untouched.
- No plan readjustment or architectural drift was discovered; S2 remains persistence/reducer work.
