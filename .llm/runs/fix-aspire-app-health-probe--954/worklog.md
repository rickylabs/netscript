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

## Slice log

| # | Slice                                                     | Commit      | Gate evidence                                                       |
| - | ----------------------------------------------------------- | ----------- | --------------------------------------------------------------------- |
| 1 | Run artifacts + Design checkpoint                          | `568ffe11d` | n/a                                                                   |
| 2 | Probe path contract in `@netscript/aspire`                 | `d77932249` | `deno check` + doc-lint clean on `packages/aspire`                    |
| 3 | Generator emits `withHttpHealthCheck` for app resources    | `446a47813` | `generators-background-app_test.ts` — 37 steps, 0 failed              |
| 4 | Pin SSR fall-through of the scaffolded health route        | `37c295966` | `route-templates_test.ts` — 19 steps, 0 failed                        |
| 5 | `scaffold.runtime` waits on the app + fetches its home page | `1780ffda7` | `suite-registry_test.ts` — 9 passed, 0 failed                         |

## Gate Evidence

| Gate                                        | Command                                                                     | Result                                                       |
| ------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Format                                      | `deno task fmt:check`                                                       | **PASS** — 1869 files selected, 0 findings                     |
| Lint                                        | `deno task lint`                                                            | **PASS** — 1724 files, 0 occurrences                           |
| Lint (`packages/cli`, excluded from the task) | `deno lint packages/cli/{src/kernel/templates,e2e}`                         | **PASS** — 95 files                                            |
| Typecheck                                   | `deno task check`                                                           | **PASS** — 2457 files, 21 batches, 0 failed batches            |
| Test                                        | `deno task test`                                                            | **PASS** — 2230 passed, 0 failed, 12 ignored (3m22s)           |
| Doctrine fitness                            | `deno task arch:check`                                                      | **PASS** — exit 0, no `FAIL=` rows; pre-existing WARN/INFO only |
| Doc-lint (F-7)                              | `.llm/tools/run-deno-doc-lint.ts --root packages/aspire`                    | **PASS** — 0 errors, 0 missing JSDoc                           |
| Runtime / Aspire (scope overlay `service`)  | `deno task e2e:cli run scaffold.runtime --cleanup`                          | **NOT RUN** — no database containers or full runtime available here; see `drift.md` D-4 |

### Fail-before evidence (regression guard)

With the generator change stashed, the new generator assertions fail:

```
should register an HTTP health probe for app resources ... FAILED
should probe a custom path when HealthCheckPath is configured ... FAILED
FAILED | 1 passed (35 steps) | 1 failed (2 steps)
```

### SDK verification

`aspire restore` was run against a throwaway `apphost.mts` pinned to SDK `13.4.6`. The generated
`.aspire/modules/aspire.mts` declares, on `ExecutableResource`:

```ts
withHttpHealthCheck(options?: WithHttpHealthCheckOptions): ExecutableResourcePromise;
// interface WithHttpHealthCheckOptions { path?; statusCode?; endpointName? }
```

This is what fixed the emitted call shape (see `drift.md` D-2). The probe workspace was scratch only
and is not committed.

## Reconcile notes

- **Slices 1–5.** Issue #954 stays `status:triage` until the PR merges (`Closes #954` in the body
  wires the auto-close). #953 is referenced but deliberately untouched — it is the reproduction, not
  the defect. No other open issue covers the app health probe.
- No new arch-debt entries created or closed.
- Follow-up identified and **not** filed from this session: health probes for generated services,
  plugins, and background processors, with declared per-resource paths. Named in the PR body.
