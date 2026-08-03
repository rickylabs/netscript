# Worklog: Aspire and CLI lifecycle (#1011, #1012)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1011-aspire-lifecycle--codex` |
| Branch | `fix/1011-aspire-lifecycle` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | service intent; referenced overlay file absent |

## Design

### Public Surface

- `netscript db status` behavior changes without changing its command name/options/result contract.
- Generated `aspire/apphost.mts` remains the resident entry; generated
  `aspire/db-operation-apphost.mts` is a tooling entry, not a JSR export.
- `netscript plugin doctor` keeps its output model but adds an unverified/warning health-evidence arm.
- No `mod.ts`, subpath, or package export-map change.

### Domain Vocabulary

- `ResidentAppHost` — operator-owned `aspire/apphost.mts`; inspect-only from detached DB commands.
- `DbOperationAppHost` — invocation-owned distinct path/backchannel for one-shot DB resources.
- `AppHostResourceState.healthReports` — evidence array preserved from Aspire describe output.
- `verified healthy` — Running + Healthy + at least one passing report.
- `unverified` — Healthy label with zero health reports; warning, not success or failure.

### Ports

- `AspireCommandExecutor` — existing DB command/process seam; exact command sequences are testable.
- `AppHostLifecycleLock` — existing cross-process ownership serialization.
- `AppHostInspector` — existing #1076 runtime observation seam; extended with report evidence.
- `ProcessPort` — existing missing-binary-testable Aspire execution seam.

### Constants

- `SCAFFOLD_FILES.DB_OPERATION_APPHOST_MTS` — `db-operation-apphost.mts`.
- Existing `GATE`/`ASPIRE_RESOURCE` constant families receive named resident-lifecycle and
  dead-port-readiness values; no free string IDs in suite registration.
- Existing `RESOURCE_DEFAULTS.HttpEndpointName` and `AppHealthCheckPath` remain readiness defaults.

### Archetype-6 structural inventory

- Five spine abstracts remain unchanged: `CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`,
  `UseCase<Input, Result>`, `Registry<TKey, TValue>`.
- No layer-2 abstract is introduced or modified.
- Vertical feature touched: `public/features/db/operations` only through its existing adapter call;
  implementation remains in `kernel/adapters/database`.
- Extension registries and `kernel/extension-points.ts` remain unchanged.
- Composition roots remain declarative; the new generated entry only invokes the existing
  `createNetScriptAppHost` composition function.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 0 | Lock research/design and open draft PR | separate PLAN-EVAL | run dir only |
| 1 | Prove DB operations own a distinct isolated AppHost and preserve resident PID/backchannel | focused DB/generator tests + live runtime lifecycle gate | DB runner/helpers/tests, scaffold constants/generator/assets, E2E runtime gate, run artifacts |
| 2 | Prove endpoint readiness and preserve zero-report evidence | inspector/doctor/generator tests + live dead-port runtime gate | app generator/tests, inspector/use-case/tests, E2E fixture/gates, run artifacts |
| 3 | Merge-readiness evidence and close-gate reconciliation | static/fitness/JSR gates, one `scaffold.runtime`, IMPL-EVAL | run artifacts and GitHub evidence only unless evaluator finds a fix |

### Deferred Scope

- Upstream Aspire raw status semantics — NetScript records evidence but does not fork Aspire.
- Interactive `db studio` lifecycle — it is deliberately attached and not read-only.
- Repo-wide A6 restructure — governed by existing debt.

### Contributor Path

Add lifecycle behavior in `kernel/adapters/database` behind `AspireCommandExecutor`; add generated
AppHost entries through `HelpersGeneratorPipeline` and named scaffold constants; add resource
readiness through the existing registration generators and `AppHostInspector`; prove live behavior
by adding a named gate to `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-03 | S0 | research/design | Re-baselined #1011/#1012 against #1027/#1033 and read #1076 first. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Distinct path plus `--isolated` | Path is the selector for describe/stop; isolation alone is ambiguous. | Aspire CLI help/docs + plan L1 |
| Extend `AppHostInspector` | Existing tested seam already handles absence and missing binary. | PR #1076 + plan L3 |
| Live gates in `scaffold.runtime` | Required behavior cannot be evidenced by generated strings. | issue acceptance + plan L5 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Harness references a missing `SCOPE-service.md` | minor | yes |
| Runtime-provided Codex session is supervisor rather than canonical Fable primary | minor | yes |

## Gate Results

All implementation/static/runtime/consumer gates are `NOT_RUN` until PLAN-EVAL passes.

## Handoff Notes

- PLAN-EVAL should challenge whether a second root-level AppHost truly creates an independently
  targetable path and whether the runtime test proves the resident PID/backchannel rather than only
  absence of an explicit stop command.
- IMPL-EVAL should inspect zero-report handling for false-positive healthy and false-positive error
  outcomes, including the missing-Aspire-binary arm.

