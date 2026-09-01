# Worklog

## Design

- Public surface: none. One pure exported test seam inside the internal E2E executable module.
- Domain vocabulary: mandatory scheduler marker; named runner-mode marker collection; runtime startup evidence predicate.
- Ports: none.
- Constants: `schedulerReadyMarker` and `runnerReadyMarkers` encode the finite marker vocabulary.
- Commit slices: RED focused test, then GREEN predicate/diagnostic implementation and gate evidence.
- Deferred scope: runtime execution, producer edits, sibling defects, and architectural debt remediation.
- Contributor path: add a future runner mode by appending one substring to `runnerReadyMarkers`; add a matching passing fixture.

## Plan gate

- PLAN-EVAL: N/A before implementation. The issue is a small mechanical repair and the supplied brief fully locks contract, acceptance cases, fixture shape, scope, commit sequence, and gates.

## Evidence

### RED

- Commit: `581d9fef0e25d9c82e6853c8daa35182b2384fe6` (tests only; zero product files).
- Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests/application/gates`
- Exit: 1.
- Observed counts: 0 passed / 0 failed / 0 total results; one process failure before execution.
- Discriminating failure: TS2305, missing export `hasWorkersRuntimeStartupEvidence`.

### GREEN

- Commit: `f8073e7e3246b77f7b07a759b9877ac021a91a78`.
- Predicate: scheduler marker AND any marker from the named runner-mode collection.
- Diagnostic: separately names a missing scheduler marker and absence of any runner-mode marker.
- Producer anchor: the in-process passing case reads `plugins/workers/worker/worker.ts` and asserts the exact emitted template before exercising the predicate, so a future producer rename fails this focused suite.
- Required gates at the final formatted tree:

| Gate | Exit | Evidence |
| --- | ---: | --- |
| focused structured tests | 0 | 111 passed, 0 failed, 0 ignored |
| scoped structured check | 0 | 188 files, 2 batches, 0 diagnostics |
| scoped structured format | 0 | 188 processed, 0 findings, 0 refusals |

- Formatting correction loop: the first scoped format check exited 1 with one line-wrap finding in the new test; `deno fmt` was applied only to the two owned TypeScript files, then all required gates were rerun to the results above.
- Lint: not run; the three gates explicitly required by the leaf brief passed, so the known conditional root-lint refusal path was not encountered.
- Full `e2e:cli`: not run by instruction; no runtime lease was requested.
- `deno.lock`: unchanged.

## Reconcile

- Slice RED: issue #1877 remained open; draft PR #1878 carried `Closes #1877`, `status:impl`, and the required taxonomy. RED evidence was posted to the PR before GREEN began.
- Slice GREEN: scope remains exactly one product module, one focused test, and this run directory. No producer change, related-issue scope, doctrine debt, or runtime lease was introduced.

## Supervisor verification at the integrated head (2026-09-01)

Measured independently of the implementation session.

### Main integrated

`origin/main` `82a2527e2` merged at `4fa6257b3`, zero conflicts. `deno.lock` blob **byte-identical**
to main. Non-run-artifact ceiling is exactly the two intended paths:

```
packages/cli/e2e/src/application/gates/scaffold/wait-for-workers-runtime.ts
packages/cli/e2e/tests/application/gates/wait-for-workers-runtime_test.ts
```

No `plugins/workers/**` change — the producer was correct and was left alone.

### Gates at `4fa6257b3`

| Gate | Result |
| --- | --- |
| `run-deno-test.ts` on `packages/cli/e2e/tests/application/gates` | **111 passed / 0 failed**, exit 0 |
| `run-deno-check.ts --root packages/cli/e2e --ext ts` | 188 files, 2 batches, **0 diagnostics** |
| `run-deno-fmt.ts --root packages/cli/e2e --ext ts` | 188 processed, **0 findings, 0 refusals** |

### RED: recorded honestly, then strengthened

Re-executing the committed RED `581d9fef0` in an extracted tree gives exit 1 — but via **TS2305
`no exported member 'hasWorkersRuntimeStartupEvidence'`**, i.e. a *compile-shape* RED. It proves the
symbol did not exist, **not** that the old predicate rejects real logs. That is an inherent limit of
this change: the pre-fix predicate was inline and unexported, so no behavioural RED was expressible
without first extracting it. Recorded rather than presented as a behavioural reproduction.

**Behavioural RED supplied by the supervisor instead.** The pre-#1878 predicate was reconstructed
verbatim from `origin/main`'s inline shape (`readyMarkers.every(...)` over
`['[Scheduler] Started with', 'Starting with Web Worker pool']`) and run against both log shapes:

| Input | Old predicate |
| --- | --- |
| scheduler + `Starting in-process job runner (queue concurrency: 1)...` (**real current logs**) | **false** |
| scheduler + `Starting with Web Worker pool (1 workers)...` (legacy) | true |

That is the defect demonstrated behaviourally: the gate could only ever accept a log line the
producer stopped emitting at #1864. The production witness is run `33531189254`, which failed
`runtime.wait.workers` in **both** tiers at 207 s / 208 s with
`workers process became healthy without runtime startup evidence`.

### Why the fix is not a second hardcode

`runnerReadyMarkers` is a named collection consumed with `.some()`, so both modes are accepted and a
third is a one-line addition. The in-process test reads
`plugins/workers/worker/worker.ts` and asserts the exact template literal, so the **next** rename
fails a fast unit test rather than a 3.5-minute hosted timeout — which is the failure mode that made
this defect and its two siblings (#1863, #1870) expensive to find.
