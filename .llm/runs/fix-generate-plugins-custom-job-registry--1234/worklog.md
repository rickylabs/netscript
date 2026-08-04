# Worklog: custom workers job registry generation (#1234)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-generate-plugins-custom-job-registry--1234` |
| Branch | `fix/generate-plugins-custom-job-registry` |
| Archetype | `5 - Plugin Package` + `6 - CLI and Tooling` |
| Scope overlays | `docs` |

## Design

This section was recorded before any implementation source was changed.

### Public Surface

- `netscript generate plugins` — authoritative public regeneration command.
- `plugins/workers/scaffold.runtime.json` — published discovery and generator invocation contract.
- `.netscript/generated/plugin-workers/job-registry.ts` — generated artifact; consumers regenerate
  it and do not hand-edit it.

### Domain Vocabulary

- Runtime registry target — manifest declaration identifying the source directory, eligible
  suffixes, exclusions, generated path, and registry value shape.
- Scaffold profile — generator execution context that may add sample configuration but must not
  restrict the project-authored job extension axis.
- Project-authored job — eligible top-level TypeScript handler under `workers/jobs/` that is not an
  explicitly excluded helper module.

### Ports

- Installed runtime registry process port — resolves and invokes each installed plugin's published
  generator through the CLI boundary.
- E2E command executor — invokes the runner-selected local or published CLI from a generated
  project.

### Constants

- `runtimeRegistryGenerator.args` — retains `--profile scaffold`.
- `runtimeRegistries[0].exclude` — `_registry.ts`, `job-tools.ts`, `mod.ts`, `types.ts`.
- `WORKERS_REGISTRY_PATH` — `.netscript/generated/plugin-workers/job-registry.ts`.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 0 | Harness bootstrap and locked plan | Plan-Gate checklist | `.llm/runs/fix-generate-plugins-custom-job-registry--1234/*` |
| 1 | Custom-only RED test and manifest contract fix | targeted installed-registry test RED then GREEN | `plugins/workers/scaffold.runtime.json`, installed registry integration test, run artifacts |
| 2 | Public-regeneration E2E fixture and docs | focused checks plus fixture assertions | Flow B fixture/runtime gate, command reference, ERP tutorial, run artifacts |
| 3 | Merge-readiness evidence | full gate set and composed evaluation | run artifacts and PR metadata only unless a gate finds a scoped fix |

### Deferred Scope

- Empty workers directory semantics — not needed to register a custom job.
- Recursive job directories — not part of the current manifest contract.
- General per-job metadata configuration — not required once the E2E import graph is project
  configuration.

### Contributor Path

Add a top-level job module under `workers/jobs/`, then run `netscript generate plugins`; the
generated workers registry imports it unless its filename is one of the manifest's explicit helper
exclusions.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-08-04 15:30 CEST | research | live issue | Read #1234 first among task evidence and accepted the verifier transcripts. |
| 2026-08-04 15:42 CEST | research | RED | Fresh custom-only scaffold failed exit 1 on missing declared workers registry. |
| 2026-08-04 15:50 CEST | research | re-baseline | Fast-forwarded to `origin/main` `681fc94a`; the same RED remained. |
| 2026-08-04 16:06 CEST | 0 | design lock | Chose structural discovery by removing the entire scaffold include overlay; planned public E2E regeneration. |
| 2026-08-04 16:18 CEST | 1 | test RED | Custom-only installed-registry test failed as designed: 0 passed, 1 failed; missing declared workers registry. |
| 2026-08-04 16:20 CEST | 1 | contract GREEN | Removed the scaffold include overlay; targeted test passed 1/1 and the full integration file passed 9/9. |
| 2026-08-04 16:27 CEST | 2 | public regeneration | The original fresh custom-only scaffold regenerated successfully: 1 registry written containing `custom-claim-job`. |
| 2026-08-04 16:30 CEST | 2 | workaround removal | Flow B now merges aliases into `deno.json`, invokes the selected public CLI, and only reads/asserts the registry. |
| 2026-08-04 17:59 CEST | 3 | runtime gate fix | First full smoke passed 27 gates, then exposed an omitted local `.netscript/e2e` directory creation before warmup; made that prerequisite explicit. |
| 2026-08-04 18:14 CEST | 3 | runtime contract drift | Second full smoke passed Flow B, then workers startup exposed named-export incompatibility in the public manifest generator; logged significant drift and strengthened RED coverage. |
| 2026-08-04 18:22 CEST | 3 | named-export RED/GREEN | Real scaffold-shaped custom test failed 0/1 on default import, then passed 1/1 after generator handler resolution; full installed-registry file passed 9/9. |
| 2026-08-04 18:43 CEST | 3 | filename-ID RED/GREEN | Removed the test-only handler `id`; reproduced `toJobName(undefined)`, then derived local IDs from filenames like the established compiler. Targeted 1/1 and full 9/9 passed. |
| 2026-08-04 18:44 CEST | 3 | service diagnostic | Regenerated the failed suite project through the public CLI; workers service loaded 2 generated jobs and reached `Service listening`. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Widen the existing scaffold path by deleting its include overlay | Keeps sample configuration while reopening the user-job extension axis | `plan.md` D1; doctrine A1/A2/A11 |
| Keep explicit helpers excluded | Avoids importing support modules as jobs | manifest contract; doctrine A1/A8 |
| Move Flow B aliases into project config | Removes generated-file mutation without inventing job metadata scope | `plan.md` D4; E2E fixture behavior |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Composed evaluation replaces standalone evaluator sessions by explicit milestone D6 waiver | minor | yes |
| Pre-existing `deno.lock` modification is foreign to this run | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| Plan-Gate | `plan-eval.md` checklist | PASS | Composed per milestone waiver; plan locked before source changes. |
| Targeted test RED | `deno test --unstable-kv -A ...installed-runtime-registry-integration_test.ts --filter "custom-only job"` | FAIL | Expected RED: generator wrote no declared workers registry. |
| Targeted test GREEN | same command after manifest fix | PASS | 1 passed, 0 failed. |
| Installed registry integration | full integration test file | PASS | 9 passed, 0 failed. |
| Scaffold-shaped named export RED | targeted custom-only integration test | FAIL | Expected second RED: generated default import rejected the named handler export. |
| Scaffold-shaped named export GREEN | same targeted test after generator fix | PASS | 1 passed, 0 failed; full file again 9/9. |
| Scaffold-shaped filename ID RED | plain named handler without synthetic `id` | FAIL | Expected RED: `toJobName(undefined)` exposed handler-ID assumption. |
| Scaffold-shaped filename ID GREEN | local IDs derived from discovered filenames | PASS | 1 passed, 0 failed; full file again 9/9. |
| E2E fixture check | `deno check --unstable-kv` on Flow B and runtime gates | PASS | Both modules checked. |
| Focused lint/fmt | direct lint and fmt check on touched source/docs | PASS | No new ignore; touched files formatted. |
| Scoped check/lint/fmt | repo wrappers | NOT_RUN | Pending implementation. |
| Quality and architecture | `quality:gate`, `arch:check` | NOT_RUN | Pending implementation. |
| Docs/publish | doc-lint, JSR audit, publish dry-run | NOT_RUN | Pending implementation. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| A5 universal set | PENDING_SCRIPT | Plan gate selection | Evidence after implementation. |
| A6 universal + F-CLI-1…31 | PENDING_SCRIPT | Plan gate selection | Production CLI structure is not changed; manual plus `arch:check` evidence required. |
| Docs overlay | PENDING_SCRIPT | Plan gate selection | Source alignment and links checked with docs gates. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| `scaffold.runtime` | NOT_RUN | planned one-pass command | Run only after targeted/static green. |
| `scaffold.runtime` attempt 1 | FAIL | 27 passed, 1 failed | Flow B public regeneration succeeded; fixture warmup failed because its directory no longer had an implicit creator. Scoped fix applied; full rerun required. |
| `scaffold.runtime` attempt 2 | FAIL | 33 passed, 1 failed | Flow B gate passed; `workers-api` exposed the generated default-import/named-export mismatch. Contract fix applied; full rerun required. |
| `scaffold.runtime` attempt 3 | FAIL | 33 passed, 1 failed | Named import succeeded; `workers-api` exposed that scaffold handlers have no runtime `id`. Filename-ID fix applied; full rerun required. |
| Failed-project workers service diagnostic | PASS | Public regeneration + direct service command | Loaded 2 generated jobs and reached `Service listening`; missing stream env was expected outside Aspire. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| Fresh custom-only scaffold | FAIL | issue reproduction | Authoritative RED before fix. |
| Installed workers generator | PASS | targeted + full integration test | Custom-only job registered; helper excluded. |
| Fresh custom-only scaffold after fix | PASS | public `netscript-dev generate plugins --verbose` | 1 registry written; generated import and definition reference `custom-claim-job.ts`. |

## Handoff Notes

- Inspect D1 and the custom-only integration test first.
- Verify Flow B invokes `generate plugins` and never writes `job-registry.ts`.
- Confirm `deno.lock` remains outside the PR diff.
