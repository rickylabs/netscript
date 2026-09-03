# Implementation worklog — #1906 slice 3

## Status

- 2026-09-03 — Activated harness mode at brief head `ea2c912b4`; verified branch
  `test/aspire-event-observation-s3` and pinned base `3149d18e1`.

## Plan-Gate disposition

`PLAN-EVAL: N/A`. The owner-authored brief and issue lock the primitive, S1→S4 order, bounded file
set, RED/GREEN contract, and gates. IMPL-EVAL remains a separate opposite-family session.

## Design

### Public surface

No published surface changes. The internal test seam extends the existing listener-readiness helper
only far enough to inject a resource follower and a single settled snapshot read.

### Domain vocabulary

Resource update, aggregate Healthy event, named listener health report, settled snapshot,
test-failure ceiling, HTTP effect, telemetry convergence, and fixture acknowledgement.

### Ports

`watchResourceUpdates` is the only Aspire resource-transition port. Existing command/fetch/clock
seams remain the ports for non-resource effects.

### Constants

The polling allowlist is exactly empty. Resource waits retain their durations as named failure
ceilings. Non-resource timing constants identify the effect they bound.

### Commit slices

S1 pinned RED; S2 fenced GREEN; S3 Bucket-C disposition; S4 final evidence.

### Deferred scope

Generated AppHost templates, product CLI source, root config/lock, Bucket B, and local Aspire/Docker
runtime.

### Contributor path

For resource transitions, import the shared observer, subscribe before inducing, await the buffered
event, optionally read one post-event snapshot, and close in `finally`. For non-resource retries,
name the effect in the nearby constant comment.

## Gate evidence

### S1 — pinned RED

| Gate | Result | Receipt |
| --- | --- | --- |
| Polling-policy focused test | EXPECTED FAIL — 4 passed, 1 failed | `receipts/s1-red-polling-guard.json` |

With the allowlist empty, the sole failure names
`runtime/verify-listener-readiness.ts:187`. The exact-set allowlist test passes with `[]`; the tree
test fails non-vacuously on the remaining timed `aspire describe` loop.

## Reconcile

- S1: issue #1906 remains open and this partial slice uses `Refs #1906`; the six-file fence is clear
  and the pinned-base RED agrees with the current issue inventory after #1969.
