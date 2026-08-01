# PLAN-EVAL — #1013 saga cascade contract correction

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)
Plan under review: `.llm/runs/fix-1013-sagas-send-contract--1013/plan.md` @ `09d558b35`
Baseline: `3ab64720f`

## Plan-Gate checklist

| # | Row | Verdict | Evidence |
|---|-----|---------|----------|
| 1 | Cause independently verified, not taken from the brief | PASS | Plan's "Verified findings" adds a fact my brief did not contain and I re-verified: `SagaEngine.publish()` → `handle()` records cascades but does not recursively dispatch them; recursion is opt-in via `dispatchCascaded` (`packages/plugin-sagas-core/src/runtime/saga-engine.ts:112-130`). |
| 2 | Route matches the issue's fork, not a half-implementation | PASS | Plan §Route: "correct the documented/public contract; do not add workers dispatch or child-saga runtime behavior." Matches issue acceptance criterion 2, and explicitly excludes criterion 1. |
| 3 | No runtime behaviour change smuggled in | PASS | Plan §Risks: "Preserve the runtime throw site and all dispatch behavior; only error text may change." The throw site is `saga-bus-bridge.ts:136-137`. |
| 4 | Every acceptance box has a named slice | PASS | Box 1 → slice 1 (`public/messages.ts`, `domain/cascaded-message.ts`); box 2 → slices 1+2; box 3 → slice 2 (`04-checkout-saga.md`); box 4 → slice 3 (`tests/runtime/`). |
| 5 | The rewritten tutorial path is one that actually exists | PASS | Plan names the triggers-API `enqueueJob` route, which the repo already documents as supported (`docs/site/tutorials/storefront/05-shipping-webhook.md:202`). No new mechanism invented. |
| 6 | Docs sweep is not limited to the one file the issue named | PASS | Slice 2 lists `04-checkout-saga.md`, `durable-workflows/sagas.md`, `reference/sagas/index.md`, `packages/plugin-sagas-core/README.md`. |
| 7 | Test proves the documented flow, not a tautology | PASS-with-condition | Slice 3 is "runtime contract tests for the rewritten checkout cascade and dispatched `spawn` rejection". Condition below — this is the row I am least willing to accept on the plan text alone. |
| 8 | Validation is scoped, correct, and excludes the expensive lane | PASS | Gates match the brief; scaffold E2E explicitly excluded with a stated reason (no scaffold/publish shape change). No `--unstable-kv` on the check wrapper. |
| 9 | Push/branch safety | PASS | Branch `fix/1013-sagas-send-contract`, no upstream (`git rev-parse @{u}` → "no upstream configured"). |
| 10 | Plan is falsifiable — a reader could tell if it was not followed | PASS | Every slice names concrete files. |

## Where I am reviewing my own framing

The brief I wrote chose the correcting route and pre-selected the files. Two things I pushed on
rather than waved through:

- **My brief was incomplete on the cause.** I framed the defect as "the bridge republishes onto the
  saga engine". The plan found the sharper fact: even the republish does not recursively drive
  handler-returned cascades unless a caller invokes `dispatchCascaded`. The plan is *more* right
  than the brief that produced it. Accepted and endorsed.
- **Row 7 is the one my framing could have made hollow.** I told the slice to "assert the documented
  cascade sequence". A test that asserts a handler *returns* `[send(...)]` proves nothing — that is
  a pure-function assertion over the effect constructor, and it would go green against the broken
  `0.0.2` behaviour too. It is exactly the class of passing-test-over-untested-path that acceptance
  box 4 exists to prevent.

  **Binding condition on row 7:** the checkout test must drive the cascade through
  `createSagaRuntime()` / the bus so that the *delivery* of the `send` message to the next handler is
  what is asserted — the observable being "handler B ran with payload P", not "handler A returned an
  effect object". If the rewritten tutorial's payment step is enqueued through the triggers API
  rather than the saga bus, the test must assert that boundary explicitly (the enqueue was requested
  with the documented job ref) and must not let a saga-bus assertion stand in for it. If neither can
  be driven honestly, say so plainly in the worklog rather than shipping the weaker assertion — a
  partly-evidenced box reported as partly-evidenced is an acceptable outcome; a green tautology is
  not.

This condition is pre-approved: it does not change slices 1-3 or the route, so no re-submission and
no second PLAN-EVAL is required. Implement it as stated.

## Verdict

PASS
