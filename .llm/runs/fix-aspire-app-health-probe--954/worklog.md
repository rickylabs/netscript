# Worklog: HTTP health probe for generated Fresh apps (#954)

## Run Metadata

| Field          | Value                                |
| -------------- | ------------------------------------ |
| Run ID         | `fix-aspire-app-health-probe--954`   |
| Branch         | `fix/aspire-app-health-probe`        |
| Archetype      | `6 - CLI / Tooling`                  |
| Scope overlays | `service`                            |

## Design

### Public Surface

- `@netscript/aspire` → `RESOURCE_DEFAULTS.AppHealthCheckPath` — the default HTTP path Aspire probes
  on a generated Fresh app.
- `@netscript/aspire` → `AppEntry.HealthCheckPath` (optional) — per-app override; `false` disables
  the probe.
- `packages/cli` internal → `generateRegisterApps(options)` emission shape (unchanged signature,
  extended output).
- `packages/cli/e2e` → `GATE.RUNTIME_WAIT_APP`, `GATE.BEHAVIOR_APP_HOME`,
  `ASPIRE_RESOURCE.APP` — new gate/resource ids in the CLI E2E surface.

### Domain Vocabulary

- `HealthCheckPath: string | false | undefined` — declared probe path for an app resource.
  `undefined` means "use the scaffold default"; `false` means "this app has no HTTP health route".
- `AspireResource.APP` — the generated Fresh app's Aspire resource id (`dashboard` by default),
  joining the existing infra/plugin resource ids waited on by `scaffold.runtime`.

### Ports

- None. Aspire's own `withHttpHealthCheck` is the upstream API being wrapped (A5); introducing a
  port for a single emitted call would be a speculative seam.

### Constants

- `RESOURCE_DEFAULTS.AppHealthCheckPath = '/health'` — beside the existing
  `RESOURCE_DEFAULTS.HttpEndpointName = 'http'`, which the probe reuses as `endpointName`.
- `GATE.RUNTIME_WAIT_APP = 'runtime.wait.app'`, `GATE.BEHAVIOR_APP_HOME = 'behavior.app-home'`,
  `ASPIRE_RESOURCE.APP = 'dashboard'` in `packages/cli/e2e/src/domain/cli-surface.ts`.

### Commit Slices

| # | Slice                                                                                              | Gate                                                                     | Files                                                                                                                                            |
| - | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Declare the probe contract: default path constant + optional `AppEntry.HealthCheckPath`             | `deno test packages/aspire/tests/`                                       | `packages/aspire/constants.ts`, `packages/aspire/config.ts`, `packages/aspire/tests/config_test.ts`                                               |
| 2 | Emit `withHttpHealthCheck` for `app`-type resources; failing-first generator tests                  | `deno test packages/cli/src/kernel/templates/aspire/`                    | `generate-register-apps.ts`, `helpers/tests/generators-background-app_test.ts`                                                                    |
| 3 | Pin the SSR default of the scaffolded `/health` route so the probe keeps exercising the renderer    | `deno test packages/cli/src/kernel/templates/app/`                       | `packages/cli/src/kernel/templates/app/route-templates_test.ts`                                                                                   |
| 4 | Extend `scaffold.runtime`: wait on the app resource, then fetch its home page over HTTP             | `deno test packages/cli/e2e/tests/presentation/suite-registry_test.ts`    | `e2e/src/domain/cli-surface.ts`, `e2e/src/application/gates/scaffold/runtime-gates.ts`, `e2e/suites/scaffold/capability-suites.ts`, `e2e/tests/**` |
| 5 | Run artifacts + gate evidence                                                                       | full gate set                                                            | `.llm/runs/fix-aspire-app-health-probe--954/**`                                                                                                  |

### Deferred Scope

- Probes for services / plugins / background processors — their health paths are per-resource and
  must be declared, not defaulted (research finding 10). Follow-up issue.
- `statusCode` / `endpointName` overrides in `AppEntry` — no scaffolded app needs them today.
- Fixing the SSR failure in #953 — explicitly another issue.

### Contributor path

A contributor adding a probe to another resource kind reads
`generate-register-apps.ts` § "HTTP health probe", copies the four emitted lines into the sibling
`generate-register-<kind>.ts`, adds the default path to `RESOURCE_DEFAULTS`, and extends the matching
`helpers/tests/*_test.ts` case. The E2E counterpart is one `runtimeWaitGate(...)` entry plus one
`httpGate(...)` in `runtime-gates.ts` and the id in `capability-suites.ts`.

## Gate Results

Recorded after implementation — see § Gate Evidence below.
