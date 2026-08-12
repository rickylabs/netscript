# Worklog: #1227 Quickstart Aspire restore retry

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1227-quickstart-restore-retry--impl` |
| Branch | `fix/1227-quickstart-restore-retry` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Design

### Public Surface

- No published surface changes. The executable test surface is `createQuickstartWalkSuite()` and
  its command-gate definitions.

### Domain Vocabulary

- `CommandGateRetryPolicy` — existing retry classes and typed retry bound.
- `GateAttempt` — existing per-attempt evidence.
- `GateVerdict` — existing `passed | failed | skipped` outcome.

### Ports

- `CommandExecutor` — existing fakeable subprocess seam; no new port.

### Constants

- Reuse the runtime restore attempt timeout (180,000 ms) and retry budget (`maxRetries: 2`).
- Missing PGDATA state uses one stable explanatory message and a non-success sentinel mapped to
  `skipped` by the command gate.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Harness bootstrap | clean git status + run artifact review | `.llm/runs/fix-1227-quickstart-restore-retry--impl/*` |
| 2 | Retry and honest teardown result | focused E2E unit tests + requested gates | quickstart suite/walk tests, command gate contract/runner tests if needed, PGDATA walk/tests, run artifacts |

### Deferred Scope

- Live `e2e:cli`, canary, publish/release changes, and other gates' retry behavior.

### Contributor Path

Define command retry declaratively on the gate, prove it with a fake `CommandExecutor`, and keep
fixture/setup absence distinct from a product assertion through an explicit `skipped` result.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-12 | 1 | research/design | Re-baselined; centralized retry runner is already functional. |
| 2026-08-12 | 2 | RED | Focused command: 10 passed, 5 failed; each required defect reproduced. |
| 2026-08-12 | 2 | implementation | Wired Quickstart restore to `CommandGate.retry`, preserved restore exit 6/124, and mapped absent PGDATA setup to `skipped`. |
| 2026-08-12 | 2 | GREEN | Focused command: 33 passed, 0 failed. |
| 2026-08-12 | 2 | gate | Static wrappers, `quality:gate`, explicit E2E scan, and root-cwd CLI package test passed. |

## Decisions

- `PLAN-EVAL: N/A` — this is a small mechanical slice with owner-locked contract, mechanism,
  acceptance, scope, and gates.
- No NuGet cache coverage is mirrored because the runtime path has no explicit cache-seeding step.
- The 180-second value remains on each command inside `aspire-walk.ts`; it is not applied to the
  outer combined restore/start/wait command gate, which would incorrectly time out the whole step.
- Exit 124 is classified as the standard timeout class by `CommandGate`. The wrapper preserves
  restore exit 6/124, while start/wait failures remain exit 1 and are not retry candidates.

## RED → GREEN Evidence

Initial focused command exited 1 with:

```text
FAILED | 10 passed | 5 failed (92ms)

quickstart restore retries canceled exit 6 and passes on a later attempt
  Actual 1 / Expected 2 requests
quickstart restore retries timeout exit 124 and passes on a later attempt
  Actual 1 / Expected 2 requests
quickstart restore exhausts exactly maxRetries plus one attempts
  Actual 1 / Expected 3 requests
quickstart PGDATA teardown skips with a message when setup state is absent
  Actual failed / Expected skipped
verifyPgDataAfterTeardown reports setup-not-created without a second failure
  NotFound: readfile '<temp>/.netscript-quickstart-pgdata.json'
```

Final focused command exited 0 with:

```text
ok | 33 passed | 0 failed (2s)
```

Change-to-test mapping:

| Test | RED without |
| --- | --- |
| `quickstart restore retries canceled exit 6 and passes on a later attempt` | Quickstart gate `retry` policy plus wrapper preservation of restore exit 6. |
| `quickstart restore retries timeout exit 124 and passes on a later attempt` | Quickstart gate `retry` policy plus centralized exit-124 timeout classification. |
| `quickstart restore exhausts exactly maxRetries plus one attempts` | `maxRetries: 2` policy wiring and timeout classification; actual proof is requests/attempts `[1, 2, 3]`. |
| `quickstart PGDATA teardown skips with a message when setup state is absent` | Command-gate skip policy and PGDATA gate wiring. |
| `verifyPgDataAfterTeardown reports setup-not-created without a second failure` | Missing-state `NotFound` handling in the teardown script. |

## Gate Results

### Static gates

| Gate | Result | Verbatim summary |
| --- | --- | --- |
| scoped check | PASS (0) | `filesSelected=861 batches=8 failedBatches=0 totalOccurrences=0` |
| scoped lint | PASS (0) | `filesSelected=861 batches=5 totalOccurrences=0` |
| scoped fmt | PASS (0) | `filesSelected=861 batches=5 failedBatches=0 findings=0` |

### Tests and fitness

| Gate | Result | Verbatim summary / notes |
| --- | --- | --- |
| focused retry/teardown/reporter tests | PASS (0) | `ok | 33 passed | 0 failed (2s)` |
| `deno task --cwd packages/cli test` | BASELINE FAIL (1) | `FAILED | 791 passed (531 steps) | 3 failed (1m10s)`; all three are cwd-sensitive root-relative paths, unrelated to this diff. |
| root-cwd package equivalent | PASS (0) | `ok | 794 passed (531 steps) | 0 failed (51s)` |
| `deno task quality:gate` | PASS (0) | quality scan `ok:true`; doctrine roots `FAIL=0` (existing warnings remain). |
| explicit E2E source quality scan | PASS (0) | `"scanned": ["packages/cli/e2e/src"], "findings": [], "allowCount": 0` |

The `quality:scan` half of `quality:gate` scans `packages/cli/src` and `plugins`, not the nested E2E
source. `arch:check` recursively observes E2E through the CLI root, but the explicit scanner command
was still required and run.

### Lock and prohibited gates

- `deno.lock`: unchanged; no dependency added.
- `deno task e2e:cli`: not run, per owner instruction.
- Canary: not run or dispatched, per owner instruction.

## Reconcile Note

- Draft PR #1584 remains draft with `type:fix`, `area:tooling`, `gate:e2e`, `priority:p0`, exactly
  one `status:impl`, and milestone `0.0.6`. Issue #1227 is open at `status:impl`.

## Handoff Notes

- Evaluator should inspect the negative RED evidence, policy wiring, exact attempt count, skip
  message, `deno.lock` diff, and explicit nested-E2E quality coverage first.
- The requested package task itself has three baseline cwd failures; the root-cwd equivalent proves
  all 794 CLI and nested E2E tests green. This slice does not repair unrelated task path assumptions.
