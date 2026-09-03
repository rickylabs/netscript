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

### S2 — fenced Bucket A GREEN

- `runtime/verify-listener-readiness.ts` now starts the scoped buffered follower, waits for aggregate
  Healthy, and reads one snapshot only after that event to validate the named health report and all
  other reports. An absent event and wrong post-event detail have distinct failure text.
- `runtime/listener-readiness-gates.ts` retains 300s default, 30s Garnet, and 600s MSSQL durations,
  but names them as hung-stream failure ceilings and passes milliseconds to the observer. No cap was
  shortened. Slice 2 recorded hosted settled resource waits of 0.257–40.456s; issue #1906 records
  Garnet-specific healthy observations of 0.774–1.554s.
- `runtime/listener-unreachable-fixture.ts` required no observation rewrite: #1909 already leaves one
  buffered subscription open across D-101's induced Unhealthy and Healthy directions, established
  before the close command. Its remaining 5s/50ms loop is the fixture-owned file acknowledgement
  protocol, not Aspire state, and the structured socket failure-code assertion remains intact.
- `runtime/readiness-disagreement.ts` is a pure report/log classifier with no wait or process.
- `runtime/owned-container-log.ts` performs one ownership-filtered Docker inventory and one log read;
  it does not retry or infer Aspire resource state.
- `scaffold/verify-live-db-endpoint.ts` takes one settled live topology snapshot after the event-based
  allocation receipts. Its only retry is eventual dashboard telemetry correlation.

| Gate | Result |
| --- | --- |
| Focused fenced tests + polling policy | PASS — 58 passed, 0 failed |
| Focused runtime check wrapper | PASS — 3 files, 0 findings |

### S3 — Bucket C disposition

All eight sites are retained as legitimately timing-based; none is an Aspire resource-state wait.
The full per-site rationale is in `bucket-c-disposition.md`.

| Boundary | Sites |
| --- | --- |
| Application HTTP/render | `http-gate.ts`, `probe-app-home.ts` |
| Application SSE/domain state | `consume-flow-b-stream.ts`, `select-flow-b-stream-change.ts`, `durable-cli-parity.ts`, `run-documented-stream-example.ts` |
| Direct child process | `probe-project-boundary-dev.ts` |
| In-process MCP fixture | `ui-ai-gates.ts` |

Resource endpoints used by the application probes are already resolved through the shared follower.
Comments beside the remaining bounds now state the actual effect they cap. Focused Bucket-C and
policy tests pass 91/91.

### S4 — final evidence

Evidence source head: `95ae2dfad33fffa94239a6c871a42da741009b06`. PR: #1978.

| Gate | Result | Receipt |
| --- | --- | --- |
| Focused converted/helper tests | PASS — 131 passed, 0 failed | `receipts/s4-focused-tests.json` |
| Empty-allowlist policy | PASS — 5 passed, 0 failed | `receipts/s4-polling-policy.json` |
| `deno task quality:gate` | PASS — exit 0 | `receipts/s4-quality-gate.json` |
| E2E check wrapper | PASS — 236 files, 2 batches, 0 findings | `receipts/s4-e2e-check.json` |
| E2E format wrapper | PASS — 236/236 files, 0 findings | `receipts/s4-e2e-fmt.json` |
| E2E lint coverage | PASS via complete split — 229 + 7 files, 0 findings | `receipts/s4-e2e-lint-main.json`, `receipts/s4-e2e-lint-desktop-native.json` |
| `deno task e2e:cli suites` | PASS — all 11 suite IDs listed | worklog evidence |

The exact single-root lint command was also run and is retained as
`receipts/s4-e2e-lint-root.json`. It exits 2 before linting the seven standalone desktop-native
fixture files because Deno ignores their non-member config and then cannot resolve `catalog:zod`.
This is the same unchanged config-boundary defect documented by slice 2. The two wrapper invocations
above process all 236 selected files under resolvable configs with no lint findings; no fixture or
root config change was taken into this slice.

No Aspire, Docker, full `scaffold.runtime`, or other local runtime lease was started. `ci:full` is
the live transition proof surface.

## Reconcile

- S1: issue #1906 remains open and this partial slice uses `Refs #1906`; the six-file fence is clear
  and the pinned-base RED agrees with the current issue inventory after #1969.
- S2: the polling allowlist is empty and every formerly fenced file now has an explicit disposition.
  No issue/PR comment changed the brief or scope.
- S3: Bucket C contains no newly discovered resource-readiness surrogate. The disposition closes
  the issue's eight-row judgement inventory without expanding into application-effect rewrites.
- S4: issue #1906 and PR #1978 metadata still match the brief. Every current #1906 DoD item is met
  by #1909, #1969, and this head; the supervisor retains the umbrella issue-linkage decision.
