# Context Pack: saga send/spawn correction (#1013)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1013-saga-send-spawn--1013` |
| Branch | `fix/1013-saga-send-spawn` |
| Current phase | `impl-eval-blocked` |
| Archetype | `5 - Plugin Package` with sibling runtime rules |
| Scope overlays | `docs` |

## Current State

Research and contract-first design are complete against `origin/main` at `ab0fa13fe`. #1042 already
selected correction; #1075 now recursively dispatches handler effects, exposing the remaining
tutorial sends as loud `SAGA_NOT_FOUND` failures. The owner waived the credential-blocked
PLAN-EVAL on the record. Both implementation slices, aggregate local gates, and issue acceptance
evidence are complete. Formal IMPL-EVAL cannot launch because its credential is deliberately absent.

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
- Slice 2 commit `eccc247c6497796b293235daca3ee7da38971da1` was pushed with PR evidence.
- Root check and all six affected publish dry-runs are green.
- #1013 acceptance boxes are checked with linked evidence; its mutually exclusive alternatives were
  normalized to explicitly record the selected correction route and implementation N/A.

## In Progress

- Formal IMPL-EVAL transport remediation or an explicit owner decision for that separate gate.

## Next Steps

1. Do not self-certify or substitute a paid/closed evaluator.
2. If the owner separately waives IMPL-EVAL, record it and finish review-thread/ready gates.
3. Otherwise resume only when the canonical open-model evaluator route is safe and credentialed.

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
| Formal IMPL-EVAL | BLOCKED | canonical canary: auth required, credential absent, no session launched |

Slice 1 is green: saga-core package `68 passed / 0 failed / 2 ignored`; scoped check/lint/fmt have
zero findings; quality scan is clean; doctrine roots report `FAIL=0`; focused public docs render
`spawn(...): never`; opposite-family slice re-review returned `PASS`.

## Open Questions

- Whether the owner separately waives the now-confirmed IMPL-EVAL environmental block.

## Drift and Debt

- Drift: #1075 changed the failure mode; local evaluator route is credential-blocked; the owner
  waived PLAN-EVAL only.
- Debt: no new entry proposed; existing saga runtime/cardinality and adapter debts are untouched.

## Commits

- See the draft PR's commit list + per-slice PR comments.
