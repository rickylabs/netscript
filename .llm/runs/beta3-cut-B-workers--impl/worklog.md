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

- `@netscript/plugin-workers` package contents: explicit `./jobs/health-check.ts` export key maps to `./jobs/health-check.ts`.
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
| 3 | FAIL_FIX local-source import-map response | targeted tests, scoped check/lint/fmt, scaffold.runtime | `plugins/workers/services/src/init.ts`, CLI scaffold import-map resolvers/mutator tests, run artifacts |

### Deferred Scope

- Additional full `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` runs after the required FAIL_FIX response smoke.
- Plugin folder refactor — existing doctrine debt, unrelated to #376.

### Contributor Path

To add another built-in workers plugin job, place its handler under `plugins/workers/jobs/`, include a package-local entrypoint plus a `jsr:@netscript/plugin-workers/jobs/<name>.ts` `sourceUrl` in `services/src/init.ts`, add the exact package subpath to the plugin export map and the exact `jsr:` key to CLI scaffold imports, and add a runtime assertion that the job has completed after trigger.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-05 | 1 | research | Confirmed stale registration path and core `sourceUrl` dynamic import support. |
| 2026-07-05 | 1 | design | Locked option 1 and scoped tests/gates. |
| 2026-07-05 | 1 | implementation | Registered built-in health job with package `sourceUrl`, added registration/dynamic-dispatch tests, and strengthened runtime E2E execution polling. |
| 2026-07-05 | 1 | reconcile | Related issue #376 fully addressed by this branch; PR must carry `Closes #376` and `Refs #172, #191, #372`. No full scaffold runtime smoke run in this implementation lane. |
| 2026-07-05 | 2 | FAIL_FIX response | Added explicit `./jobs/health-check.ts` export map entry, documented the new job subpath, and added an export-map drift regression test. |
| 2026-07-05 | 3 | FAIL_FIX response | Added exact scaffold import-map entries for the stored `jsr:` sourceUrl so local-source mode resolves the workspace file while JSR mode resolves the pinned package export. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Use exact import-map override for the `jsr:` sourceUrl | Restores no-copy thin plugin invariant without local-source scaffolds resolving to the previous registry publish, while preserving the registry sourceUrl schema. | `plan.md` D1/D4 |
| Export the exact health job subpath | JSR/Deno only resolve package subpaths declared in `deno.json` exports; publish include alone is insufficient. | IMPL-EVAL FAIL_FIX finding |
| Generate an exact root import-map key for the health job subpath | The worker dispatch process imports the stored sourceUrl from the consuming app; exact keys keep local and JSR modes deterministic. | Merge-readiness E2E failure |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| PLAN-EVAL artifact unavailable in implementation lane | significant | yes |
| Package file included but not exported | significant | yes |
| Self-referential `jsr:` sourceUrl bypassed local-source import maps | critical | yes |

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
| targeted tests after FAIL_FIX | `deno test --unstable-kv --allow-all plugins/workers/services/src/init_test.ts packages/plugin-workers-core/tests/runtime/job-dispatcher_test.ts` | PASS | 4 passed, 0 failed. |
| targeted tests after local-source FAIL_FIX | `deno test --unstable-kv --allow-all plugins/workers/services/src/init_test.ts packages/plugin-workers-core/tests/runtime/job-dispatcher_test.ts packages/cli/src/kernel/adapters/scaffold/tests/import-resolver_test.ts packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts` | PASS | 15 passed, 0 failed. |
| raw doc-lint: health job export | `deno doc --lint plugins/workers/jobs/health-check.ts` | PASS | New `./jobs/health-check.ts` entrypoint checked cleanly. |
| full export doc-lint wrapper | `deno task doc:lint --root plugins/workers --pretty` | PASS_WITH_EXISTING_FINDINGS | Exit 0; full export set includes `./jobs/health-check.ts` with 0 diagnostics. Wrapper still reports 17 pre-existing private-type refs on other entrypoints. |
| publish dry-run after FAIL_FIX | `deno publish --dry-run --allow-dirty` in `plugins/workers` | PASS | Checks `jobs/health-check.ts`; published file list includes it. Existing unanalyzable dynamic-import warnings remain. |
| export-map read | `deno eval "const cfg=JSON.parse(await Deno.readTextFile('plugins/workers/deno.json')); console.log(cfg.exports['./jobs/health-check.ts']);"` | PASS | Prints `./jobs/health-check.ts`. |
| scoped check after FAIL_FIX | check wrappers on `plugins/workers`, `packages/plugin-workers-core`, `packages/cli/e2e` | PASS | 90/111/76 files selected, 0 diagnostics. |
| scoped check after local-source FAIL_FIX | check wrappers on `plugins/workers`, `packages/plugin-workers-core`, `packages/cli` | PASS | 90/111/589 files selected, 0 diagnostics. |
| scoped lint after FAIL_FIX | lint wrappers on `plugins/workers`, `packages/plugin-workers-core`, `packages/cli/e2e` | PASS | 0 findings. |
| scoped lint after local-source FAIL_FIX | lint wrappers on `plugins/workers`, `packages/plugin-workers-core`, `packages/cli` | PASS_WITH_CLI_TOOLING_BOUNDARY | workers/core PASS with 0 findings. CLI wrapper selected 589 files but exited 1 with 0 findings because root lint config excludes `packages/cli/`; no lint occurrence was reported. |
| scoped fmt after FAIL_FIX | fmt wrappers on `plugins/workers`, `packages/plugin-workers-core`, `packages/cli/e2e` | PASS | 0 findings. |
| scoped fmt after local-source FAIL_FIX | fmt wrappers on `plugins/workers`, `packages/plugin-workers-core`, `packages/cli` | PASS_WITH_CLI_TOOLING_BOUNDARY | workers/core PASS with 0 findings. CLI wrapper selected 589 files but exited 1 with 0 findings because root fmt config excludes `packages/cli/`; no format finding was reported. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| F-5/F-6 | PASS | `deno publish --dry-run --allow-dirty` in `plugins/workers`; `deno doc --lint plugins/workers/jobs/health-check.ts`; `deno task doc:lint --root plugins/workers --pretty` | Dry run succeeded; output checks/includes `jobs/health-check.ts`. New entrypoint doc-lint is clean; full wrapper has existing non-new private-type findings elsewhere. |
| F-10/F-19 | PASS | Targeted tests and scoped wrappers | Test and wrapper gates passed. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| health job execution | PASS | Unit coverage verifies `sourceUrl` registration and dynamic import source selection. Full scaffold runtime smoke exited 0 with `Summary: passed=48 failed=0`; `behavior.workers-trigger-health-job` and `behavior.workers-executions` both passed. | E2E gate source now requires completed `workers-plugin-health-check` execution. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| generated scaffold runtime | PASS | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | Exit 0; `Summary: passed=48 failed=0`. |

## Handoff Notes

- Inspect `plugins/workers/services/src/init.ts` first, then core dynamic import tests and `runtime-gates.ts`.
