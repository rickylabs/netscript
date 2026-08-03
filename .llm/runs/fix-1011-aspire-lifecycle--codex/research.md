# Research — fix-1011-aspire-lifecycle--codex

## Re-baseline

- Carried-in source: issues #1011/#1012, merged PRs #1027/#1033, and precedent PR #1076.
- Re-derived against `origin/main` @ `ab0fa13fe5c92129761ebe4dc0246b979733ecaf` on 2026-08-03.
- What changed vs the carried-in reports:
  - #1027 already prevents an explicit `aspire stop` against a resident AppHost, but still calls
    `aspire start` with the resident `apphost.mts` identity and has no live PID/backchannel test.
  - #1033 already adds HTTP probes for normal apps, services, and plugins. Endpoint-bearing
    `tauri`/`task` entries still omit probes, zero-report resources still collapse to `Healthy`, and
    no live dead-port fixture exists.
  - #1076 introduced `AppHostInspector`, including a proven missing-`aspire`-binary arm; it is the
    existing runtime-observation seam and must be extended rather than duplicated.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | Detached DB operations always re-enter the generated AppHost using `NETSCRIPT_PRISMA_OPERATION`. | `packages/cli/src/kernel/adapters/database/operation-runner.ts`; generated `.helpers/db-cli-mode.mts` template |
| 2 | The current runner probes ownership but calls `aspire start --apphost <resident apphost.mts>` even when the resident is running. | `operation-runner.ts` `executeDetached()` |
| 3 | `--isolated` randomizes ports/secrets and permits parallel instances, but `describe` and `stop` still target by AppHost path. A distinct path is required for unambiguous ownership. | `aspire start/describe/stop --help`; `aspire docs get aspire-start-command`; `aspire docs get aspire-stop-command` |
| 4 | A second root-level generated AppHost entry preserves the helper's `appHostDirectory()` assumption while producing a distinct Aspire backchannel identity. | `helpers-generator-pipeline.ts`; generated `index.mts` comment and path calculation |
| 5 | Apps, services, and plugins receive `withHttpHealthCheck`; `tauri` and `task` receive an endpoint when a host port resolves but the probe is gated on `type === 'app'`. | `generate-register-apps.ts`; merged PR #1033 Remaining scope |
| 6 | Aspire documents that no registered resource health check falls back to process `Running`; readiness checks are what gate dependents and dashboard status. | `aspire docs get health-checks` |
| 7 | `AspireAppHostDoctorInspector` currently discards `healthReports`, so doctor treats `Running` + `Healthy` with zero evidence as healthy. | `apphost-doctor-inspector.ts`; `doctor-plugin-use-case.ts` |
| 8 | The runtime suite already starts the generated AppHost with `--isolated` and captures metadata; it is the correct place for both resident-PID preservation and dead-port readiness fixtures. | `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts` |
| 9 | `Deno.Command` throws `Deno.errors.NotFound` when Aspire is absent; #1076 added and tested an explicit `unavailable` result. | `apphost-doctor-inspector.ts` and its test; PR #1076 review evidence |

## Lifecycle ownership contract

- `aspire/apphost.mts` is the resident development AppHost. A read-only CLI command may inspect it
  but never start, restart, retire, or stop it.
- `aspire/db-operation-apphost.mts` is the DB-operation AppHost identity. A detached DB invocation
  starts it with `--isolated`, observes only that path, and stops only the lifecycle it started.
- The inter-process lease remains keyed to the DB-operation AppHost path; ownership is explicit and
  serialized. Interactive `db studio` remains intentionally interactive and outside this detached
  lifecycle contract.

## Readiness contract

- Advertising an HTTP endpoint creates a readiness obligation. Default generated configuration
  registers `withHttpHealthCheck` against that endpoint before Aspire may be trusted as healthy.
- `healthStatus: Healthy` is evidence only when at least one `healthReports` entry exists and all
  reports pass. Zero reports are an explicit `unverified`/warning state in NetScript inspection.
- A process that remains alive but never binds its endpoint must produce a non-healthy live Aspire
  snapshot in the checked-in runtime suite.

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/cli/deno.json`, `packages/cli/mod.ts`, and
  `packages/aspire/deno.json`; no export-map or public symbol change is planned.
- Slow-type / surface risks: none introduced. Existing `HealthCheckPath` config is reused; the new
  lifecycle entry and inspector evidence fields remain internal. Package doc-lint/publishability
  gates remain required because framework package source is touched.

## Open questions

- None that would force implementation rework. Exact runtime gate placement may move within the
  existing `scaffold.runtime` order without changing either contract.

