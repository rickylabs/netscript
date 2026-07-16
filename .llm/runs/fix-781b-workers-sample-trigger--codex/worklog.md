# Worklog: issue #792 workers sample queue trigger

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-781b-workers-sample-trigger--codex` |
| Branch | `fix/781b-workers-sample-trigger` |
| Archetype | `5 — Plugin Package` (runtime subtype) |
| Scope overlays | `none` |

## Design

### Public Surface

- No new public package export. Preserve `WorkerOptions.queueTriggers` as the explicit configuration seam.

### Domain Vocabulary

- Queue trigger — explicit mapping from a queue name to a worker job, optionally with schema and concurrency.
- Sample trigger — the export-notification mapping currently embedded as a reusable default; removed from runtime behavior.

### Ports

- Existing `MessageQueue` and worker runtime ports only; no new port is justified.

### Constants

- No finite domain constant is needed once the sample-domain default is removed.

### Plugin Axes

- Runtime wiring continues to consume `@netscript/plugin-workers-core/runtime` contracts.
- No core or sibling contract is redefined; queue triggers remain plugin-owned composition options.
- Scaffolded jobs and runtime registry generation remain unchanged.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Harness bootstrap and draft PR surface | issue/API + tree evidence | `.llm/runs/fix-781b-workers-sample-trigger--codex/*` |
| 2 | Opt-in trigger resolver and regression | focused test + scoped wrappers | `plugins/workers/worker/worker-options.ts`, `worker.ts`, `worker-options_test.ts`, run artifacts |
| 3 | Acceptance and evaluator handoff | quality/arch/full scaffold runtime | run artifacts + PR metadata |

### Deferred Scope

- Existing workers plugin refactor debt, queue implementation changes, and all other #781 findings.

### Contributor Path

Add a queue-trigger mapping through `WorkerOptions.queueTriggers`, cover its option-resolution behavior in `worker-options_test.ts`, then exercise runtime consumers with the scaffold suite.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-16 | 1 | Bootstrap | Loaded requested skills/harness/doctrine, merged the latest integration base (already current), and read #792/#781 through the GitHub API token resolver. |
| 2026-07-16 | 1 | Research | Confirmed the unconditional prepend and that scaffold defaults do not reference the embedded export-notification sample trigger. |

## Gate Results

All implementation, fitness, runtime, and consumer gates are pending.

## Handoff Notes

- Evaluator should inspect the option resolver, absence/preservation/aliasing regression, and full scaffold runtime evidence first.
