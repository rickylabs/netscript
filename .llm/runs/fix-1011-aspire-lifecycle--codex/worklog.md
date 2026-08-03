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
| 2026-08-03 | S0 | plan publication | Committed/pushed the contract and plan, opened draft PR #1088, and posted research/plan evidence. |
| 2026-08-03 | S0 | PLAN-EVAL | Canonical local Qwen launch was rejected by the isolated Claude/OpenRouter profile with `Not logged in · Please run /login`; no evaluator artifact or verdict exists. Implementation remains stopped. |
| 2026-08-03 | S0 | Plan-Gate waiver | Owner, acting as the opposite-family Claude reviewer, explicitly waived the credential-blocked gate due to #1087 and authorized implementation. No synthetic evaluator verdict recorded. |
| 2026-08-03 | S1 | red proof | New runner and generator contracts failed pre-fix: detached `describe` targeted `aspire/apphost.mts` instead of `db-operation-apphost.mts`, and the DB-operation entry was absent. |
| 2026-08-03 | S1 | implementation | Generated `db-operation-apphost.mts`; detached DB operations exclusively lock/probe/start/poll/log/stop that path with `--isolated`; studio remains on resident `apphost.mts`. Added live resident identity gate. |
| 2026-08-03 | S1 | package/static gates | CLI package suite: 554 passed / 0 failed. Scoped check/lint/fmt: zero findings. `quality:gate`: PASS with pre-existing warnings only. |
| 2026-08-03 | S1 | slice review | Fable alias and routing-id fallback were unavailable; native `claude-opus-4-8` fallback session `d8cc7066-8900-4c1f-a0bd-2bfe264f48b1` found a symlink false-red, fixed via `realPath` fallback, then emitted `REVIEW_PASS`. Live runtime remains honestly deferred. |
| 2026-08-03 | S2 | red proof | Generator, inspector, and doctor tests failed pre-fix: endpoint-bearing task/Tauri resources had no probe, `healthReports` were discarded, and an empty-report resource was certified healthy. The missing-Aspire-binary test passed in the same run. |
| 2026-08-03 | S2 | implementation | All endpoint-bearing app entries receive the configured HTTP probe; `AppHostInspector` preserves raw report evidence; doctor warns instead of certifying Healthy when reports are absent. Added a generator-driven live dead-port fixture and non-healthy/evidence gate to `scaffold.runtime`. |
| 2026-08-03 | S2 | package/static gates | CLI package suite, root check, scoped check/lint/fmt, quality scan, and architecture check passed; only pre-existing catalog/doctrine warnings remain. |

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
| Canonical formal-evaluator profile is unauthenticated | blocking | yes |

## Gate Results

- PLAN-EVAL: `WAIVED` by owner; canonical route remains credential-blocked with no synthetic verdict.
- S1 red proof: `PASS` — both new contracts failed against pre-fix behavior with the expected
  resident-path/absent-file artifacts.
- CLI package test: `PASS` — 554 tests / 479 steps, 0 failed.
- Scoped check/lint/fmt: `PASS` — zero findings after formatting the new E2E gate.
- `quality:gate`: `PASS` — quality scan clean; architecture check has only pre-existing warnings.
- Opposite-family slice review: `REVIEW_PASS` after resolving canonical-path false-red risk.
- S2 red proof: `PASS` — 3 expected failures before implementation; missing-binary coverage stayed
  green in the same run.
- S2 CLI package/root/static gates: `PASS` — package suite and root check completed successfully;
  scoped check/lint/fmt and quality scan reported zero findings; architecture check emitted only
  pre-existing warnings.
- Live `scaffold.runtime`: `NOT_RUN` — deliberately once-only at merge-readiness; no #1011
  or #1012 acceptance box may be ticked yet.

## Handoff Notes

- PLAN-EVAL should challenge whether a second root-level AppHost truly creates an independently
  targetable path and whether the runtime test proves the resident PID/backchannel rather than only
  absence of an explicit stop command.
- IMPL-EVAL should inspect zero-report handling for false-positive healthy and false-positive error
  outcomes, including the missing-Aspire-binary arm.
