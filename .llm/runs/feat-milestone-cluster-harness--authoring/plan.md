# Plan — milestone cluster harness

## Goal

Encode the proven four-topic milestone cluster and make repo-native, durable gate receipts the
default for workers and CI.

## Scope

- Add the `milestone-cluster` profile, with mandatory Step 0 intake, inventory cleanup, and
  dependency DAG.
- Refine concise cluster run artifacts and role/state contracts.
- Add a deterministic gate receipt runner/schema using existing toolchain primitives.
- Route CI and worker guidance through it; upload CI JSON receipts.
- Harden evaluator/label workflow only for idempotent status entry, fail-closed dispatch, and
  immutable-head terminal verdict consumption.

## Non-Scope

- No product/package public API change.
- No release, milestone, issue, or evaluator dispatch.
- No new distributed lock service; use the existing exact-head claims and one recorded release owner.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | `milestone-cluster` composes `milestone-run`; it does not fork release mechanics. | one source per concern |
| D2 | Step 0 is a hard gate before dispatch. | prevents stale scope and dependency collisions |
| D3 | CI receipts are durable JSON artifacts; workers retain the same schema in run state. | no lost verdicts or repeated long gates |
| D4 | Exact-once phase automation remains the only cloud-eval dispatcher. | prevents duplicate spend |
| D5 | Prefer small deterministic tools and schemas over prose. | owner directive |
| D6 | Existing scoped wrappers and E2E reports run inside one generic receipt envelope. | preserves domain evidence while standardizing lifecycle proof |
| D7 | Milestone clusters are explicitly exempt from generic integration-branch supervisor mechanics. | direct-to-main leaf PRs were the proven shape |
| D8 | Step 0 scans unmilestoned, Backlog, and later-milestone issues before freezing scope. | critical blockers and coherent high-value features must not be silently missed |

## Implementation slices

1. **Cluster contract:** evolve `milestone-run`, role/routing docs, Step 0 intake templates,
   validator, and tests.
2. **Receipt contract:** add one JSON receipt envelope/runner, worker memory index, CI artifact upload,
   and focused negative tests for failure, interruption, SHA mismatch, and `NOT_RUN`.
3. **Evaluator lifecycle:** make status entry idempotent and fail-closed; require final verdict phase
   and evaluated head at PR acceptance; retain the existing atomic claim and model overrides.
4. **Integration:** update skills/tool indexes, sync Claude skills, validate workflows and root gates.

## Validation Plan

| Order | Gate | Expected result |
| --- | --- | --- |
| 1 | focused receipt/profile/workflow contract tests | PASS |
| 2 | skill sync/validation | PASS |
| 3 | root check, lint, fmt:check | PASS |
| 4 | relevant CI workflow contract tests | PASS |

## PLAN-EVAL

Required after the three independent audits are integrated because this changes the repository's
orchestration and CI evidence contract.
