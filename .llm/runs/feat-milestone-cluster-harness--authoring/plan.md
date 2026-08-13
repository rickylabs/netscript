# Plan — milestone cluster harness

## Goal

Encode the proven four-topic milestone cluster and make repo-native, durable gate receipts the
default for workers and CI.

## Scope

- Add the `milestone-cluster` profile, with mandatory Step 0 inventory cleanup and dependency DAG.
- Refine concise cluster run artifacts and role/state contracts.
- Add a deterministic gate receipt runner/schema using existing toolchain primitives.
- Route CI and worker guidance through it; upload CI JSON receipts.
- Harden evaluator/label workflow only where current contract tests show a concrete gap.

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

