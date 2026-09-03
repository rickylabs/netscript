# Implementation worklog — #1906 slice 2

## Status

- 2026-09-03 — Activated the `normal_implementation` harness lane at brief head `9059e2042`,
  re-baselined the issue inventory against pinned base `79adb103b`, and confirmed the worktree is
  clean before implementation.

## Plan-Gate disposition

`PLAN-EVAL: N/A`. Issue #1906 plus the owner-authored implementation brief lock the observation
primitive, accepted scope, concurrency fences, RED→GREEN slices, gate set, and PR metadata. The
remaining per-file classification is an evidence-backed implementation detail, not an architectural
choice. IMPL-EVAL remains mandatory in a fresh opposite-family session and is not performed here.

## Design

### Public surface and vocabulary

- No published surface changes.
- Internal vocabulary: `AspireResourcePollingFinding`, a scoped `ResourceUpdate`, endpoint
  allocation evidence, stopped-resource evidence, and a test-failure ceiling.

### Ports

- Existing `watchResourceUpdates(appHost, resourceName)` is the sole resource-event port.
- Existing injected command/follower seams are used for synthetic tests; no Aspire runtime is
  required locally.

### Constants

- The scanner's final allowlist contains only the brief's concurrency-fenced paths.
- Any retained stream timeout is named and documented as a failure ceiling.
- Application HTTP/telemetry/probe bounds remain only where they do not assert Aspire resource
  state; S3 records their classification and available observed-time evidence.

### Commit slices

1. S1 inventory + guard RED.
2. S2 conversions + unit tests GREEN.
3. S3 cap audit + final focused receipts.

### Deferred scope

Concurrency-fenced files, Bucket B, remaining Bucket C, AppHost templates, product CLI source, and
local scaffold-runtime execution.

### Contributor path

Add resource observation through `runtime/resource-state-stream.ts`, subscribe before an induced
change, and add a synthetic follower test. Run the polling-policy test to prevent deadline-based
`aspire describe` loops from regrowing.

## Gate evidence

### S1 RED

| Gate | Result | Evidence |
| --- | --- | --- |
| Polling-policy focused test | EXPECTED FAIL | Structured test wrapper: 3 passed, 1 failed. The sole real-tree offender is `packages/cli/e2e/src/application/gates/scaffold/verify-endpoint-readiness.ts:8`. |

The initial scanner draft also named service-env because its one settled snapshot followed a loop
over blocking waits. That was a scanner defect, not an implementation defect. The scanner now
requires the `describe` command to be lexically inside the timed loop; its positive, follow-stream,
and single-snapshot unit cases all pass before the intentional tree failure runs.

## Reconcile

- S1 inventory reconciles with issue #1906: one direct non-fenced `aspire describe` poll remains at
  the pinned baseline. Broader non-`describe` Bucket-A sites remain explicit S2 review targets.
