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
| Targeted test | installed runtime registry integration test | NOT_RUN | RED/GREEN slice follows bootstrap commit. |
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

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| Fresh custom-only scaffold | FAIL | issue reproduction | Authoritative RED before fix. |
| Installed workers generator | NOT_RUN | targeted integration | Pending implementation. |

## Handoff Notes

- Inspect D1 and the custom-only integration test first.
- Verify Flow B invokes `generate plugins` and never writes `job-registry.ts`.
- Confirm `deno.lock` remains outside the PR diff.
