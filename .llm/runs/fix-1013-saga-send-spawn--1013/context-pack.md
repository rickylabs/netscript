# Context Pack: saga send/spawn correction (#1013)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1013-saga-send-spawn--1013` |
| Branch | `fix/1013-saga-send-spawn` |
| Current phase | `impl` |
| Archetype | `5 - Plugin Package` with sibling runtime rules |
| Scope overlays | `docs` |

## Current State

Research and contract-first design are complete against `origin/main` at `ab0fa13fe`. #1042 already
selected correction; #1075 now recursively dispatches handler effects, exposing the remaining
tutorial sends as loud `SAGA_NOT_FOUND` failures. The owner waived the credential-blocked
PLAN-EVAL on the record. Slice 1 is pushed; slice 2 implementation and local gates are complete.

## Completed

- Required skills, doctrine, harness profiles, issue #1013, PR #1042, and PR #1075 read.
- Real `send`/`spawn`/trigger/worker paths traced.
- JSR/public-surface baseline scanned.
- Design checkpoint and three ordered slices written.
- Local formal evaluator canary attempted and recorded as credential-blocked.
- Planning slice `0fa339144` pushed and draft PR #1091 opened with `Closes #1013`.
- Opposite-family owner reviewer explicitly waived PLAN-EVAL; waiver recorded in `drift.md`.
- Slice 1 regression proved red on baseline product behavior: `assertThrows` failed because
  `spawn()` returned normally.
- Slice 1 commit `06cac832aaaadbea7caa3699ab4acf2cace8e0d6` was pushed with PR evidence.
- Slice 2 regression proved red against the unchanged tutorial: the typechecked integration test
  failed because the storefront still authored `CheckoutPaymentRequested` through saga `send()`.
- Storefront now crosses the real trigger queue, static worker registry, worker handler, and saga
  publisher; the focused round trip reaches `paid`.

## In Progress

- Slice 2 commit and PR evidence handoff.

## Next Steps

1. Commit, push, and comment slice 2 evidence.
2. Run aggregate merge-readiness gates and acceptance mirroring.
3. Request formal IMPL-EVAL; its transport remains credential-blocked and is not waived.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Correct contract, do not implement worker-send/spawn | #1042 + current code | Existing explicit trigger-worker boundary is canonical. |
| `spawn()` throws at construction and returns `never` | user rule + plan D3 | Bridge still rejects injected wire effects. |
| Tutorial integration crosses trigger queue and worker registry | acceptance criterion | Queue-only assertion is insufficient. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1013-saga-send-spawn--1013/*` | modified | Harness evidence and handoff state. |
| `docs/site/**/saga*.md`, storefront tutorial | modified | Corrected public contract and runnable choreography. |
| `.llm/tools/docs/check-accuracy-and-discoverability.ts` | modified | Guards the corrected tutorial and spawn contract. |
| `plugins/sagas/tests/runtime/storefront-checkout-flow_test.ts` | new | Real trigger-worker-saga round-trip regression. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | scoped check/lint/fmt; docs accuracy; emitted-specifier guard |
| Fitness | PASS | quality scan clean; all doctrine roots `FAIL=0` |
| Runtime | PASS locally | focused round trip plus six full affected package suites |
| Consumer | PASS locally | docs links/build/accuracy and tutorial source contract |

Slice 1 is green: saga-core package `68 passed / 0 failed / 2 ignored`; scoped check/lint/fmt have
zero findings; quality scan is clean; doctrine roots report `FAIL=0`; focused public docs render
`spawn(...): never`; opposite-family slice re-review returned `PASS`.

## Open Questions

- None for implementation. IMPL-EVAL transport remains an end-of-run risk and is not waived.

## Drift and Debt

- Drift: #1075 changed the failure mode; local evaluator route is credential-blocked; the owner
  waived PLAN-EVAL only.
- Debt: no new entry proposed; existing saga runtime/cardinality and adapter debts are untouched.

## Commits

- See the draft PR's commit list + per-slice PR comments.
