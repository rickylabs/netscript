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

### S2 RED

The focused conversion tests failed before GREEN with three type errors: the readiness helper had
no seam for the required one post-transition snapshot. This pinned the confirmed follow-line split:
aggregate `healthStatus` detects the transition, while detailed `healthReports` come from exactly
one settled snapshot. The same test set also requires endpoint followers to close and malformed
NDJSON errors to remain terminal.

### S2 GREEN

- `verify-endpoint-readiness.ts` now observes aggregate `Unhealthy` through the shared scoped
  follower, then takes exactly one snapshot for the undocumented per-check `healthReports` detail.
  The snapshot validates already-observed evidence; it never discovers the transition.
- `verify-producer-reconnect.ts` starts one buffered `streams` subscription before the stop command,
  observes both `Finished` and the later `Running`/`Healthy` recovery, and closes the follower even
  if probe or OTLP cleanup throws. The removed `/health` retry and `aspire wait` cannot miss the
  induced transitions anymore.
- `generated-app-endpoint.ts` observes the scoped endpoint-bearing update. Generic endpoint
  allocation accepts non-HTTP database transports; HTTP callers reject an observed allocation with
  the wrong transport distinctly from a transition that Aspire never emitted. Malformed NDJSON
  remains terminal.
- `capture-db-endpoint-allocation.ts` waits for that endpoint evidence and only then reads one full
  topology snapshot; `runtime-gates.ts` passes the exact database resource name to both captures.

Current-tree classifications for the other brief rows:

| Row | Disposition |
| --- | --- |
| `wait-for-workers-runtime.ts` | Already deleted before the pinned base; no log-marker waiter remains. |
| `service-env/verify-service-env.ts` | Keeps native blocking `aspire wait --status healthy` for first-occurrence readiness, then one settled topology snapshot. This is the issue-approved coarse-arrival path, not a poll loop. |
| `runtime/probe-plugin-resource.ts` | Keeps retries because they assert application HTTP effects (completed worker execution, accepted webhook/event visibility) after endpoint allocation, not Aspire resource state. |
| `runtime-gates.ts` `KV_BACKGROUND_RUNTIME_WAIT_TIMEOUT_SECONDS` | Constant is absent on the pinned base; structured `describe-follow` convergence receipts already replaced it. |
| `quickstart/aspire-walk.ts` | Keeps native blocking `aspire wait postgres --status healthy` for initial Quickstart readiness. It does not observe an induced departure/recovery. |

Focused GREEN: 63 converted-helper tests passed, and the polling guard passed 4/4 with its allowlist
reduced to the six concurrency-fenced files.

### S2 local gates

| Gate | Result |
| --- | --- |
| e2e check wrapper | PASS — 225 files, 2 batches, 0 findings |
| full e2e unit tests | PASS — 309 passed, 0 failed |
| e2e format wrapper | PASS — 225/225, 0 findings |
| `e2e:cli suites` | PASS — registry listed all 10 suites |
| `quality:gate` | PASS — quality scan and architecture check exited 0 |
| e2e lint coverage | PASS via equivalent complete split — 218 ordinary e2e files plus 7 standalone desktop-fixture files, 225/225 processed, 0 findings |

The brief's single root lint invocation itself exits 2 before linting the seven standalone desktop
fixture files: Deno 2.9.5 warns that their nearest config is outside the root workspace, then cannot
resolve an imported `catalog:zod`. The affected config and lint wrapper are byte-unchanged from the
pinned base, and changing either is outside this slice. Running the same wrapper as two config-aware
batches (`--exclude` for 218 root files, then the seven fixture files with `--config deno.json`)
proves complete 225-file lint coverage with zero findings.

## Reconcile

- S1 inventory reconciles with issue #1906: one direct non-fenced `aspire describe` poll remains at
  the pinned baseline. Broader non-`describe` Bucket-A sites remain explicit S2 review targets.
