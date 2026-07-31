# Worklog: HTTP health probe for generated Fresh apps (#954)

## Run Metadata

| Field          | Value                              |
| -------------- | ---------------------------------- |
| Run ID         | `fix-aspire-app-health-probe--954` |
| Branch         | `fix/aspire-app-health-probe`      |
| Archetype      | `6 - CLI / Tooling`                |
| Scope overlays | `service`                          |

## Design

### Public Surface

- `@netscript/aspire` → `RESOURCE_DEFAULTS.AppHealthCheckPath` — the default HTTP path Aspire probes
  on a generated Fresh app.
- `@netscript/aspire` → `AppEntry.HealthCheckPath` (optional) — per-app override; `false` disables
  the probe.
- `packages/cli` internal → `generateRegisterApps(options)` emission shape (unchanged signature,
  extended output).
- `packages/cli/e2e` → `GATE.RUNTIME_WAIT_APP`, `GATE.BEHAVIOR_APP_HOME`, `ASPIRE_RESOURCE.APP` —
  new gate/resource ids in the CLI E2E surface.

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

| # | Slice                                                                                            | Gate                                                                   | Files                                                                                                                                              |
| - | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Declare the probe contract: default path constant + optional `AppEntry.HealthCheckPath`          | `deno test packages/aspire/tests/`                                     | `packages/aspire/constants.ts`, `packages/aspire/config.ts`, `packages/aspire/tests/config_test.ts`                                                |
| 2 | Emit `withHttpHealthCheck` for `app`-type resources; failing-first generator tests               | `deno test packages/cli/src/kernel/templates/aspire/`                  | `generate-register-apps.ts`, `helpers/tests/generators-background-app_test.ts`                                                                     |
| 3 | Pin the SSR default of the scaffolded `/health` route so the probe keeps exercising the renderer | `deno test packages/cli/src/kernel/templates/app/`                     | `packages/cli/src/kernel/templates/app/route-templates_test.ts`                                                                                    |
| 4 | Extend `scaffold.runtime`: wait on the app resource, then fetch its home page over HTTP          | `deno test packages/cli/e2e/tests/presentation/suite-registry_test.ts` | `e2e/src/domain/cli-surface.ts`, `e2e/src/application/gates/scaffold/runtime-gates.ts`, `e2e/suites/scaffold/capability-suites.ts`, `e2e/tests/**` |
| 5 | Run artifacts + gate evidence                                                                    | full gate set                                                          | `.llm/runs/fix-aspire-app-health-probe--954/**`                                                                                                    |

### Deferred Scope

- Probes for services / plugins / background processors — their health paths are per-resource and
  must be declared, not defaulted (research finding 10). Follow-up issue.
- `statusCode` / `endpointName` overrides in `AppEntry` — no scaffolded app needs them today.
- Fixing the SSR failure in #953 — explicitly another issue.

### Contributor path

A contributor adding a probe to another resource kind reads `generate-register-apps.ts` § "HTTP
health probe", copies the four emitted lines into the sibling `generate-register-<kind>.ts`, adds
the default path to `RESOURCE_DEFAULTS`, and extends the matching `helpers/tests/*_test.ts` case.
The E2E counterpart is one `runtimeWaitGate(...)` entry plus one `httpGate(...)` in
`runtime-gates.ts` and the id in `capability-suites.ts`.

## Slice log

| # | Slice                                                       | Commit      | Gate evidence                                            |
| - | ----------------------------------------------------------- | ----------- | -------------------------------------------------------- |
| 1 | Run artifacts + Design checkpoint                           | `568ffe11d` | n/a                                                      |
| 2 | Probe path contract in `@netscript/aspire`                  | `d77932249` | `deno check` + doc-lint clean on `packages/aspire`       |
| 3 | Generator emits `withHttpHealthCheck` for app resources     | `446a47813` | `generators-background-app_test.ts` — 37 steps, 0 failed |
| 4 | Pin SSR fall-through of the scaffolded health route         | `37c295966` | `route-templates_test.ts` — 19 steps, 0 failed           |
| 5 | `scaffold.runtime` waits on the app + fetches its home page | `1780ffda7` | `suite-registry_test.ts` — 9 passed, 0 failed            |

## Gate Evidence

| Gate                                          | Command                                                  | Result                                                                                  |
| --------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Format                                        | `deno task fmt:check`                                    | **PASS** — 1869 files selected, 0 findings                                              |
| Lint                                          | `deno task lint`                                         | **PASS** — 1724 files, 0 occurrences                                                    |
| Lint (`packages/cli`, excluded from the task) | `deno lint packages/cli/{src/kernel/templates,e2e}`      | **PASS** — 95 files                                                                     |
| Typecheck                                     | `deno task check`                                        | **PASS** — 2457 files, 21 batches, 0 failed batches                                     |
| Test                                          | `deno task test`                                         | **PASS** — 2230 passed, 0 failed, 12 ignored (3m22s)                                    |
| Doctrine fitness                              | `deno task arch:check`                                   | **PASS** — exit 0, no `FAIL=` rows; pre-existing WARN/INFO only                         |
| Doc-lint (F-7)                                | `.llm/tools/run-deno-doc-lint.ts --root packages/aspire` | **PASS** — 0 errors, 0 missing JSDoc                                                    |
| Runtime / Aspire (scope overlay `service`)    | `deno task e2e:cli run scaffold.runtime --cleanup`       | **NOT RUN** — no database containers or full runtime available here; see `drift.md` D-4 |

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

---

## Slice S6 — the new `behavior.app-home` gate probed a port the scaffold never uses

`scaffold.runtime` ran for the first time on CI (D-4 said it had not) and failed on exactly one
gate: `behavior.app-home`, 60182 ms. Nothing else regressed — `passed=55 failed=1`.

### Diagnosis

`runtime.wait.dashboard` **PASSED** in 53 s in the same run. The health probe added by S3 went
green, so Aspire had already proven the app server-renders `/health`. An app that could render
`/health` but not `/` in the following 60 s was not a credible story, and the timing said why: 60182
ms is 60 iterations of a 1000 ms sleep plus process start — every `fetch` failed _instantly_. That
is connection-refused, not a 500 and not a slow render.

The gate probed `http://127.0.0.1:8000/`, commented as `PORT_RANGES.APP.start`. The scaffold
publishes the app on `PORT_RANGES.APP.start + 10` — 8010 — and has done so deliberately since the TS
AppHost landed, so the Aspire proxy port does not collide with Vite's own default of 8000
(`plan-init.ts` carries the rationale in a comment). Nothing has ever listened on 8000.

Confirmed against a generated project on this host:

| Evidence                                 | Result                                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| `.helpers/register-apps.mts` (generated) | `await dashboard.withHttpEndpoint({ port: 8010, env: 'PORT' })`         |
| `appsettings.json` (generated)           | `NetScript.Apps.dashboard.Port = 8010`                                  |
| `ss -lntp` while the AppHost ran         | `127.0.0.1:8010` bound by `dcp`; nothing on 8000                        |
| `curl` the running app's own port        | `status=200 type=text/html size=130170` — the home page renders         |
| Probe pointed at port 8000               | `HTTP 0 (): fetch failed` after **1m0.483s** — CI's 60182 ms reproduced |
| Probe pointed at the app's real port     | `app home page rendered: HTTP 200 (130162 bytes)`, 0.4 s                |

The generated app was never broken. #953 does not reach this suite: `scaffold.ui-local-source` maps
every `@netscript/*` specifier to the workspace member, so the unresolvable JSR subpath that issue
describes cannot occur here, and `generated.deno-check` would have failed first if it could.

### Fix

The probe no longer carries a port at all. `behavior.app-home` now runs
`probe-app-home.ts <projectRoot> <appName>`, which resolves the URL from the project's own
`appsettings.json` — the same file the helper generator reads when it emits
`withHttpEndpoint({ port })`. A literal cannot drift from the artifact it is meant to describe if
there is no literal.

Moving the probe from an inline `deno eval` string to a script module also keeps the gate's command
factory pure. An earlier attempt resolved the port inside the factory and broke
`suite runner skips cleanup phase when cleanup is disabled`, which exercises the real
`scaffold.runtime` definition against a faked executor: a gate definition that reads the filesystem
is not constructible without one. The script module has no such coupling.

`SCAFFOLD_APP_PORT` replaces the `PORT_RANGES.APP.start + 10` expression that was written out three
times (`plan-init.ts`, `render-ts-apphost.ts`, `write-app-files.ts`). Generated output is unchanged
— a fresh `netscript init` still writes `Port: 8010` and a `'8010'` fallback in `main.ts`.

### Regression guard

The check that let this through is `scaffold.runtime` itself, which had never been executed (D-4).
The guards make the defect fail at unit speed instead:

- `runtime-gates_test.ts` — the app-home gate's command is asserted whole, and asserted to contain
  no `PORT_RANGES.APP.start` literal. The shipped gate fails this test.
- `generated-app-endpoint_test.ts` — the resolver returns a deliberately unusual declared port
  (9137, proving nothing is hardcoded); it returns `SCAFFOLD_APP_PORT` from an `appsettings.json`
  produced by the CLI's real `generateAppsettings()`, and `SCAFFOLD_APP_PORT` is asserted to differ
  from `PORT_RANGES.APP.start`; and it names the file and the app when the port is missing,
  unreadable, or unparseable rather than falling back to a guess.

### Gate evidence

| Gate                                      | Command                                                       | Result                                                         |
| ----------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| Format                                    | `deno task fmt:check`                                         | **PASS** — 1869 files, 0 findings                              |
| Format (cli, excluded from the root task) | `deno fmt --check --ext ts packages/cli/{e2e,src/kernel/...}` | **PASS** — 94 files                                            |
| Lint                                      | `deno task lint`                                              | **PASS** — 1724 files, 0 occurrences                           |
| Lint (cli)                                | `deno lint packages/cli/e2e …`                                | **PASS** — 107 files                                           |
| Type-check                                | `deno task check`                                             | **PASS** — 2460 files, 0 failed batches                        |
| Tests                                     | `deno task test`                                              | **PASS** — 2235 passed, 0 failed, 12 ignored (3m35s)           |
| Doctrine fitness                          | `deno task arch:check`                                        | **PASS** — exit 0, no `FAIL=` rows                             |
| Code quality                              | `deno task quality:scan`                                      | **PASS** — `ok:true`, findings `[]`, 7 pre-existing allowances |
| E2E (cli-e2e package)                     | `deno test --allow-all packages/cli/e2e/tests/`               | **PASS** — 53 passed                                           |
| Runtime / Aspire                          | `deno task e2e:cli run scaffold.runtime`                      | **PARTIAL** — see below                                        |

`scaffold.runtime` reached `runtime.wait.dashboard` and failed there after 300 s for an
**environmental** reason: two unrelated Aspire AppHosts from other projects on this host already
held `127.0.0.1:8010`, so this run's app proxy could never bind. Those are not this repository's
processes and were left alone. The suite aborts on the first critical failure, so
`behavior.app-home` was not reached in-suite; it was verified directly against the running generated
app instead (table above). A clean-host `scaffold.runtime` on CI is the remaining verdict.

## Reconcile notes — S6

- #954 unchanged (`Closes #954` still wires the auto-close). #953 / #957 are **not** prerequisites
  for this PR; the two are independent and #957's own `scaffold-runtime` failure is a cancelled
  runner, not a gate failure.
- New drift entries `D-5`, `D-6`, `D-7`.
- No arch-debt entries created or closed.
