# Worklog: dependency-safe sagas registry resolution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1015-sagas-registry-path--dependency-mode` |
| Branch | `fix/1015-sagas-registry-path` |
| Archetype | `5 — Plugin Package` |
| Scope overlays | `service` |

## Design

### Public Surface

- `registerSagas(options?)` — service composition seam; adds explicit registry/import/env/cwd inputs.
- `startSagaRunner(options?)` — existing runtime seam; retains explicit → env → fallback precedence.
- `SagasAspireContribution.declareEnv(ctx)` — existing Aspire contribution emits the registry URL.

### Domain Vocabulary

- `ProjectRegistryModuleOptions` — injected explicit specifier, env reader, cwd, and project root.
- `RegisterSagasOptions` — service-side registry/importer/test seams.

### Ports

- `SagaRuntimeModuleImporter` — existing dynamic-import boundary reused by service init.
- `SagaRunnerEnvReader` and injected cwd — environment/process test seams.

### Constants

- `SAGAS_REGISTRY_MODULE_ENV` — canonical environment key.
- `DEFAULT_SAGAS_REGISTRY_PATH` — project-relative generated registry path.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Prove shared project-root resolver and service/runner precedence with dependency-shaped non-empty registry tests. | scoped check + sagas tests | runtime resolver, runner, service init, runtime/service tests, run artifacts |
| 2 | Prove Aspire emits the absolute project-owned URL and complete scoped gates. | Aspire tests + requested validation + quality gate | Aspire contribution/test, run artifacts |

### Deferred Scope

- Aspire resource entrypoint strings — separate dependency-mode defect explicitly excluded.
- Generated glue refactor — current text is already correct and changing it requires owner decision.

### Contributor Path

Registry-location policy is owned by the single runtime resolver; entrypoints pass their explicit,
environment, or project-root inputs to it, and tests inject env/cwd/import behavior.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 | plan | research/design | Verified all supplied cause leads against `3ab64720f`; no implementation started. |
| 2026-08-01 | plan-eval | evaluator launch | Canonical Qwen/Claude-OpenRouter session `5e52c824-93f1-49ef-80ae-12fcd8a4c1e8` failed authentication before a model turn; no verdict produced and no implementation started. |
| 2026-08-01 | plan-eval | cycle 1 remediation | Opus 5 returned FAIL with three bounded planning fixes. Owner waived the open-model route and authorized implementation after committing the exact remediation; plan amended without redesign. |
| 2026-08-01 | 1 | shared resolver | Added injected env/cwd/project-root resolution with explicit → env → fallback precedence, Windows/backslash coverage, and absolute specifier preservation. Focused tests passed. |
| 2026-08-01 | 2 | runner dependency shape | Removed package-relative resolution and proved the fallback importer receives the consumer project URL and loads one definition. |
| 2026-08-01 | 3 | API service seam | Routed `registerSagas` through the shared precedence resolver and injected importer/registrar seams; service test registered one loaded definition. |
| 2026-08-01 | 4 | Aspire declaration | Added the absolute project URL to the forward-looking dead `declareEnv` seam and its test; the runtime fallback remains the acceptance mechanism. |
| 2026-08-01 | 1–4 | reconcile | PR #1031 still closes #1015, taxonomy/milestone are correct, no new reviewer comments changed scope, and no plan drift beyond the evaluator-recorded dead seam/cross-plugin duplication. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Keep glue byte-identical | It already passes an absolute project-owned URL; user requires a stop before text churn. | user brief + source |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| none | minor | n/a |

## Gate Results

PLAN-EVAL cycle 1 recorded in `plan-eval.md`. Its complete bounded remediation is committed with
the amended plan under the owner's instruction; implementation is authorized without cycle 2.

| Gate | Result | Evidence |
| --- | --- | --- |
| Resolver focused tests | PASS | 3 resolver tests passed: precedence/fallback, Windows paths, absolute specifiers. |
| Runner dependency-shape test | PASS | `startSagaRunner` loaded one definition from `file:///consumer/project/...`; no JSR install was performed. |
| Service init test | PASS | `registerSagas` imported the consumer-project URL and passed one definition to the registrar seam. |
| `deno run -A .llm/tools/run-deno-check.ts --root plugins/sagas --ext ts` | PASS | Exit 0; 74 files selected, 1 batch, 0 failed batches/diagnostics. |
| `deno fmt --check plugins/sagas` | PASS | `Checked 79 files`. |
| `deno lint plugins/sagas` | PASS | `Checked 74 files`. |
| `deno test -A plugins/sagas/tests/` | PASS | Final committed-tree rerun: 24 passed, 0 failed. |
| `deno test -A plugins/sagas/src/adapter/resources/resources.test.ts` | PASS | 4 passed, 0 failed; emitted glue text remains unchanged. |
| Aspire contribution test | PASS | 1 passed, 0 failed. |
| Scoped fmt/lint wrappers | PASS | 73 files selected; zero failed batches/findings. |
| `deno task quality:gate` | PASS | Code-quality scan: zero findings; doctrine scan: zero FAIL, existing WARN/INFO only. |
| `rg "import\\.meta\\.url" plugins/sagas/` | PASS | No matches; no registry path resolution remains. |
| Lock hygiene | PASS | `deno.lock` has no diff from `origin/main`. |

## Acceptance Evidence

| Criterion | Evidence | Status |
| --- | --- | --- |
| Every saga entrypoint receives an absolute project-owned registry URL. | API init and runner share the tested `NETSCRIPT_PROJECT_ROOT ?? Deno.cwd()` fallback; generated glue remains explicitly project-root-based; Aspire declares the absolute URL forward-looking. | Evidenced, with `declareEnv` explicitly not counted as runtime delivery. |
| No consumer workspace is inferred by walking upward from a package module URL. | `rg "import\\.meta\\.url" plugins/sagas/` returned no matches; runner and service package-relative code was removed. | Evidenced. |
| Runtime starts from published-package shape with non-empty registry. | Injected importer test uses a JSR-shaped package module URL, receives `file:///consumer/project/...`, and supervisor reports `definitionCount: 1`. | Dependency-shaped evidence only; **no published JSR install ran, so the literal published-install box remains unticked**. |

## Review Follow-up Design — comment 3696652319

### Public Surface

- No public-surface change. `isProjectRelativeSpecifier` remains module-private and the internal
  resolver/export map remain unchanged.

### Domain Vocabulary and Ports

- Project-relative specifier: normalized `.`, `..`, `./…`, or `../…` only.
- No new ports; existing injected `projectRoot` and `readEnv` seams make tests host-independent.

### Constants

- None introduced; the change classifies syntax rather than defining finite domain values.

### Commit Slice

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| R1 | Normalize predicate separators and prove Windows parent-relative resolution without widening bare specifiers. | Four exact requested validation commands | resolver, resolver test, plan/worklog/context |

### Deferred Scope and Contributor Path

- All original remaining scope stays deferred. Future specifier classification changes belong in
  the private predicate and must extend seam-level tests before touching `projectFileUrl`.

### Review Follow-up Progress and Evidence

| Time | Step | Result |
| --- | --- | --- |
| 2026-08-01 | implementation | Normalized separators once in the private predicate; `projectFileUrl` and downstream entrypoints unchanged. |
| 2026-08-01 | regression coverage | Added Windows parent-relative, multi-level, mixed-separator, bare-parent, bare-specifier, and absolute-specifier seam assertions. |
| 2026-08-01 | reconcile | PR #1031 remains partial work with its existing Remaining-scope framing; review comment `3696652319` is the only owned follow-up and no issue acceptance scope changed. |

| Exact command | Exit | Real output summary |
| --- | --- | --- |
| `deno run -A .llm/tools/run-deno-check.ts --root plugins/sagas --ext ts` | 0 | 74 files selected, 1 batch, 0 failed batches, 0 diagnostics. |
| `deno lint plugins/sagas` | 0 | `Checked 74 files`. |
| `deno fmt --check plugins/sagas` | 0 | `Checked 79 files`. |
| `deno test -A plugins/sagas/tests/` | 0 | `ok | 25 passed | 0 failed (3s)`. |

Slice review: the diff is limited to predicate classification, seam-level tests, and harness
records. It does not widen bare specifiers, export the predicate, or change `projectFileUrl`, glue,
services, runner, Aspire contribution, entrypoints, or acceptance framing.
