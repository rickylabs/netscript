# Worklog: workers health entrypoint #376

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `beta3-cut-B-workers--impl` |
| Branch | `fix/workers-health-entrypoint-376` |
| Archetype | `5 - Plugin Package` |
| Scope overlays | `none` |

## Design

### Public Surface

- `@netscript/plugin-workers` package contents: no new export key; uses existing published `jobs/**/*.ts` include.
- Worker runtime dynamic import path: existing `sourceUrl` field on `JobDefinition`.
- CLI E2E runtime gate: `BEHAVIOR_WORKERS_EXECUTIONS` validator.

### Domain Vocabulary

- `workers-plugin-health-check` — built-in plugin job id.
- `sourceUrl` — remote/package module specifier used by the core dynamic dispatcher.
- `entrypoint` — package-local fallback/display path for a job module.

### Ports

- `WorkersServiceRuntime.jobRegistry` — consumed to register/update built-in plugin jobs.
- `WorkerPool.executeJob` / core `InProcessJobDispatcher` — consumed to execute Deno jobs via dynamic import.

### Constants

- `WORKERS_PLUGIN_HEALTH_CHECK_JOB_ID` — `workers-plugin-health-check`.
- `WORKERS_PLUGIN_HEALTH_CHECK_ENTRYPOINT` — `./jobs/health-check.ts`.
- `WORKERS_PLUGIN_HEALTH_CHECK_SOURCE_URL` — `jsr:@netscript/plugin-workers/jobs/health-check.ts`.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Built-in health job package source URL + execution coverage | targeted tests, scoped check/lint/fmt | `plugins/workers/services/src/init.ts`, new tests, `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts`, run artifacts |

### Deferred Scope

- Full `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` — supervisor merge-readiness gate.
- Plugin folder refactor — existing doctrine debt, unrelated to #376.

### Contributor Path

To add another built-in workers plugin job, place its handler under `plugins/workers/jobs/`, include a package-local entrypoint plus `jsr:@netscript/plugin-workers/jobs/<name>.ts` `sourceUrl` in `services/src/init.ts`, and add a runtime assertion that the job has completed after trigger.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-05 | 1 | research | Confirmed stale registration path and core `sourceUrl` dynamic import support. |
| 2026-07-05 | 1 | design | Locked option 1 and scoped tests/gates. |
| 2026-07-05 | 1 | implementation | Registered built-in health job with package `sourceUrl`, added registration/dynamic-dispatch tests, and strengthened runtime E2E execution polling. |
| 2026-07-05 | 1 | reconcile | Related issue #376 fully addressed by this branch; PR must carry `Closes #376` and `Refs #172, #191, #372`. No full scaffold runtime smoke run in this implementation lane. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Use JSR package `sourceUrl` | Restores no-copy thin plugin invariant in prod and maintainer modes. | `plan.md` D1 |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| PLAN-EVAL artifact unavailable in implementation lane | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| targeted tests | `deno test --unstable-kv --allow-all plugins/workers/services/src/init_test.ts packages/plugin-workers-core/tests/runtime/job-dispatcher_test.ts` | PASS | 3 passed, 0 failed. |
| scoped check: workers | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/workers --ext ts,tsx` | PASS | 90 files selected, 0 diagnostics. |
| scoped check: workers core | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-workers-core --ext ts,tsx` | PASS | 111 files selected, 0 diagnostics. |
| scoped check: CLI E2E | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts,tsx` | PASS | 76 files selected, 0 diagnostics. |
| scoped lint: workers | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/workers --ext ts,tsx` | PASS | 90 files selected, 0 findings. |
| scoped lint: workers core | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-workers-core --ext ts,tsx` | PASS | 111 files selected, 0 findings. |
| scoped lint: CLI E2E | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli/e2e --ext ts,tsx` | PASS | 76 files selected, 0 findings. |
| scoped fmt: workers | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/workers --ext ts,tsx` | PASS | 90 files selected, 0 findings. |
| scoped fmt: workers core | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-workers-core --ext ts,tsx` | PASS | 111 files selected, 0 findings. |
| scoped fmt: CLI E2E | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts,tsx` | PASS | 76 files selected, 0 findings. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| F-5/F-6 | PASS | `deno publish --dry-run --allow-dirty` in `plugins/workers` | Dry run succeeded; output includes `jobs/health-check.ts`. Existing unanalyzable dynamic-import warnings are unrelated and pre-existing. |
| F-10/F-19 | PASS | Targeted tests and scoped wrappers | Test and wrapper gates passed. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| health job execution | PASS | Unit coverage verifies `sourceUrl` registration and dynamic import source selection. | Full scaffold runtime execution deferred to supervisor; E2E gate source now requires completed `workers-plugin-health-check` execution. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| generated scaffold runtime | NOT_RUN | `runtime-gates.ts` updated | Full `scaffold.runtime` smoke deferred to supervisor per prompt. |

## Handoff Notes

- Inspect `plugins/workers/services/src/init.ts` first, then core dynamic import tests and `runtime-gates.ts`.
