# Worklog: issue #785 workers health-check execution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-785-workers-healthcheck--codex` |
| Branch | `fix/785-workers-healthcheck` |
| Archetype | `5 — Plugin Package` (runtime subtype; Archetype 6 secondary if generation changes) |
| Scope overlays | `service` |

## Design

### Public Surface

- No new public API. Preserve `RegisterJobInput.entrypoint`, worker runtime startup, and the scaffold CLI surface.

### Domain Vocabulary

- Local job entrypoint — module path interpreted relative to the configured jobs directory unless already project-root-qualified.
- Project root — `NETSCRIPT_PROJECT_ROOT` or the worker process working-directory-derived root.
- Jobs directory — configured root for local job modules.

### Ports

- Existing `WorkerPool` execution port only; no new port is justified.

### Constants

- Existing `NETSCRIPT_PROJECT_ROOT` and configured `jobsDir`; no new finite vocabulary is needed.

### Plugin axes

- Runtime execution composes `@netscript/plugin-workers-core/runtime` definitions and the existing WorkerPool.
- Contracts remain core-owned and imported; the plugin does not redefine them.
- The health-check export and service registration are unchanged.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Harness bootstrap and diagnostic evidence | Aspire worker logs | `.llm/runs/fix-785-workers-healthcheck--codex/*` |
| 2 | Framework path correction and regression | focused Deno test + scoped wrappers | resolver source/test determined by logs |
| 3 | Full evidence and evaluator handoff | `quality:gate`; full `scaffold.runtime` | run artifacts + PR metadata |

### Deferred Scope

- Existing plugin/CLI restructure debt and unrelated task execution paths.

### Contributor Path

Add a local worker job under `workers/jobs`, generate the runtime registry, and verify its entrypoint through the colocated worker execution test before running the scaffold runtime suite.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-16 | 1 | Research | Read issue #785, skills, doctrine, public Deno docs, worker resolver, registry generator, and E2E fixture. |
| 2026-07-16 | 1 | Reproduce | Diagnostic `scaffold.runtime` run started without cleanup so Aspire processor logs remain available. |
| 2026-07-16 | 1 | Diagnose | Reproduced 40 passed / 1 failed and captured the doubled `workers/jobs/workers/jobs/health-check.ts` module path via `aspire logs workers`; stopped the AppHost. |
| 2026-07-16 | 2 | Implement | Normalized local entrypoints already rooted under configured jobsDir; preserved jobs-dir-relative registry behavior. |
| 2026-07-16 | 2 | Reconcile | Issue #785 remains open; draft PR #786 has `Closes #785`, requested taxonomy/milestone, and no new comments requiring readjustment. |
| 2026-07-16 | 3 | Quality | `quality:gate` reached `quality:scan` and failed only on two unchanged baseline findings in streams/triggers; standalone `arch:check` passed with warnings. |
| 2026-07-16 | 3 | Acceptance | Canonical cleanup run reached 42 passed / 1 failed. Correct entrypoint loaded, then the callback received 404 from the configured users URL. |
| 2026-07-16 | 3 | Attribute | Live Aspire evidence showed `services__users__http__0=http://localhost:3001`; that URL was owned by Windows process `sco-web` and returned 404, while the healthy Aspire users target on its assigned port returned 200 for the same RPC path. |
| 2026-07-16 | 3 | Concurrency | A separate workspace actor changed the Flow-B E2E fixture and extended the overlapping resolver test during a port-isolated diagnostic run. Preserved those uncommitted edits; the moving-source run failed generated type-check and is not acceptance evidence. |
| 2026-07-16 | 3 | Contract correction | Replaced the Flow-B fixture's health-check rewrite and one-off registry with `workers add job flow-b-callback`, ordinary runtime-registry generation, and Flow-B-only definition metadata. |
| 2026-07-16 | 3 | Generic regression | Added an arbitrary `sync-catalog` case under configured `./background/inventory-jobs`, proving the resolver has no health-check or default-directory branch. |
| 2026-07-16 | 3 | Acceptance retry 1 | Durable run stopped at `runtime.flow-b-fixture`: the gate grants `--allow-run=deno`, while the helper used an absolute executable path. Switched the wrapper to the granted upstream command name. |
| 2026-07-16 | 3 | Acceptance retry 2 | `behavior.workers-executions` passed on the first poll and all product/runtime gates passed through Flow-B trace validation; final telemetry failed because the callback outcome set inside the async body was absent from exported attributes. Moved the outcome into span creation attributes. |
| 2026-07-16 | 3 | CLI contract | The retained fixture proved `workers add job` emitted handlers but discarded runtime `jobDefinitions`. Extended the generic registry compiler and golden test so every CLI-scaffolded job remains registrable, including nested job paths. |
| 2026-07-16 | 4 | Final acceptance | Canonical one-pass cleanup run passed 60 / 60. `behavior.workers-executions`, Flow-B telemetry, every other behavior gate, and cleanup were green. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Keep handler and behavior assertion unchanged | Delivery succeeds; evidence points to module resolution | issue #785 and source inspection |
| Fix the owning framework layer | Fixture-only changes would not protect consumers | owner task and A14 |
| Resolve project-root-qualified paths only when they are already within jobsDir | Prevent duplicated prefixes without changing normal `./health-check.ts` resolution | processor logs and registry generator contract |
| Scaffold Flow-B as a separate ordinary job | The install default is product sample behavior, not an E2E callback extension point | owner clarification and generic workers CLI contract |
| Have `add job` compile both handlers and runtime definitions | Runtime execution needs both static handlers and `RegisterJobInput` definitions; CLI consumers must not need a second special generator | workers runtime registry contract and compiler golden test |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Parent harness artifacts and concrete Tier-D thread proof unavailable in checkout/session | significant | yes |
| Canonical E2E port `3001` was temporarily occupied by an out-of-scope Windows process | resolved | yes |
| Flow-B diagnostic edits were initially misattributed as concurrent external work | resolved | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Focused regression | `deno test --allow-all plugins/workers/worker/job-execution_test.ts plugins/workers/worker/job-dispatcher_test.ts` | PASS | 6 passed / 0 failed |
| E2E builder tests | `deno test --allow-read --allow-env packages/cli/e2e/tests/application/builders/runtime-gates_test.ts` | PASS | 6 passed / 0 failed |
| Scoped check | `.llm/tools/run-deno-check.ts --root plugins/workers --ext ts,tsx` | PASS | 93 files, zero diagnostics |
| Scoped lint | `.llm/tools/run-deno-lint.ts --root plugins/workers --ext ts,tsx` | PASS | 93 files, zero findings |
| Scoped fmt | `.llm/tools/run-deno-fmt.ts --root plugins/workers --ext ts,tsx` | PASS | 93 files, zero findings |
| Scaffold-gate check/lint/fmt | scoped wrappers over `packages/cli/e2e/src/application/gates/scaffold` | PASS | 17 files, zero diagnostics/findings |
| Registry compiler golden + resolver + gate builder | focused Deno tests | PASS | 10 passed / 0 failed after final compiler refinement |
| Changed-file quality | `scan-code-quality.ts --changed-file ...` | PASS | zero findings, zero allowances |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Quality aggregate | FAIL_BASELINE | `deno task quality:gate` | `quality:scan` reported only unchanged findings in `plugins/streams/services/src/proxy.ts:180` and `plugins/triggers/streams/producer.ts:34` |
| Architecture | PASS | `deno task arch:check` | Exit 0; warnings only |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Diagnostic scaffold runtime | FAIL_REPRODUCED | `.llm/tmp/785-repro*`; `aspire logs workers` | 40 passed / 1 failed; doubled path captured; AppHost stopped |
| Acceptance scaffold runtime | FAIL_ENVIRONMENT | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | 42 passed / 1 failed; correct module loaded, callback hit unrelated `sco-web` on fixture-fixed port 3001 |
| Port-isolated diagnostic | INVALIDATED | temporary uncommitted fixture port 3079, then restored | Concurrent source edits landed mid-run; generated type-check failed before runtime behavior |
| Final acceptance scaffold runtime | PASS | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | 60 passed / 0 failed; cleanup passed |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Scaffolded workers runtime | PASS | canonical full-suite output | `behavior.workers-executions` passed; full Flow-B telemetry and cleanup also passed |

## Handoff Notes

- Evaluator should inspect `resolveLocalJobEntrypoint`, its generic custom-directory test, the handler+definition compiler golden, and the two-job generated fixture first.
- Implementation acceptance is complete; separate opposite-family IMPL-EVAL remains required before merge.
