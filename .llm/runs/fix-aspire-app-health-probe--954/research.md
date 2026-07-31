# Research — fix-aspire-app-health-probe--954

Issue: rickylabs/netscript#954 — "resource reports Healthy while SSR returns 500 — probe checks the
port, not the app".

## Re-baseline

- Carried-in source: none. The issue body is a symptom report from an external experiment
  (GPT-5.6 Sol, five-service release-rehearsal app, `0.0.1-beta.11`, Aspire 13.4.6).
- Re-derived against `main` @ `8e0bcef39`, 2026-07-31.
- What changed vs the report: nothing material. The generator gap the report implies is present on
  `main` exactly as described.

## Findings

| #  | Finding                                                                                                                                                                                                                                        | How to verify                                                                                                                     |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1  | **Root cause.** The Aspire helper generator emits **no health check of any kind** for any generated resource. Apps get `withHttpEndpoint({ port, env: 'PORT' })` and nothing else.                                                              | `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts:82-86`; `grep -rn "HealthCheck" packages/cli/src` returns zero generator hits |
| 2  | Aspire's documented fallback: *"If no health checks are registered for a resource, the AppHost waits for the resource to be in the `Running` state."* For an `addExecutable` resource, `Running` means the process was spawned — hence "Healthy and 500". | Aspire docs `health-checks` § "Resource readiness with health checks" (via `mcp__aspire__get_doc`)                                 |
| 3  | The Aspire 13.4.6 TypeScript SDK **does** expose the fix on executable resources: `ExecutableResource.withHttpHealthCheck(options?: WithHttpHealthCheckOptions)` where the options are `{ path?, statusCode?, endpointName? }`. | Ran `aspire restore` against a throwaway `apphost.mts` pinned to SDK `13.4.6`; `.aspire/modules/aspire.mts:22278` declares it on `ExecutableResource`, `:1316` declares the options interface |
| 4  | The docs' `withHttpHealthCheck('/health')` string-argument form is **wrong for this SDK version** — the generated TS signature takes an options object. Emitting the doc form would be a runtime type error.                                       | Same generated SDK: `withHttpHealthCheck(options?: WithHttpHealthCheckOptions): ExecutableResourcePromise`                          |
| 5  | Generated Fresh apps **already ship an SSR `/health` route** (`routes/health.tsx`, always written by the scaffold). It renders `HealthView` through `definePage()` → the app shell, and only short-circuits to JSON when the request sends `Accept: application/json` *without* `text/html`. | `packages/cli/src/kernel/assets/app/routes/health.tsx.template`; `packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts:223` |
| 6  | Aspire's HTTP probe sends no `Accept: application/json`-only header, so it takes the **SSR branch** of that route. A broken render pipeline therefore fails the probe — which is exactly the "renders a minimal SSR route" behaviour the issue asks for. | `health.tsx.template` handler condition `accept.includes('application/json') && !accept.includes('text/html')` |
| 7  | **The check that looked past the problem.** The `scaffold.runtime` E2E suite starts the whole AppHost, waits on infra + every plugin, and probes plugin/service `/health` over HTTP — but it never waits on the generated app resource and never issues a single HTTP request to any app route. `behavior.ui-render` only renders AI payload components in-process. | `packages/cli/e2e/suites/scaffold/capability-suites.ts:44-106` (no app resource in `RUNTIME_GATES`); `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts:293-306` (`runtimeResources()` lists infra + plugins only) |
| 8  | Default scaffold app resource is named `dashboard` on port `8000`.                                                                                                                                                                             | `packages/cli/src/kernel/constants/scaffold/scaffold-defaults.ts:8`; `packages/cli/src/kernel/constants/port-ranges.ts:10`; the E2E `init` gate passes no `--app-name` |
| 9  | `AppEntry` (`packages/aspire/config.ts:416-435`) has no health-related field, so there is currently no way for a generated project to declare or opt out of a probe path.                                                                        | `AppEntryZod` field list                                                                                                          |
| 10 | Services / plugins / background processors have the **same** missing-probe gap, but their health paths are heterogeneous across first-party plugins (`/health`, `/health/live`, `/health/ready`), so a single default would be wrong for several. | `runtime-gates.ts:137-231` — workers/sagas/auth probe `/health/live`, triggers probes `/health`             |

## jsr-audit surface scan

- Surface touched: `@netscript/aspire` public surface (`constants.ts`, `config.ts`, `types.ts`) —
  one added constant and one added optional schema field. Both are explicitly typed; no inferred
  slow types are introduced (`AppEntrySchema` is already annotated `AspireSchema<AppEntry>`).
- `packages/cli` is a CLI/tooling package; the generator functions changed are internal to
  `src/kernel/templates/**` and are not part of the published `mod.ts` surface.
- Risks: none identified. The added `AppEntry` field is optional, so existing `appsettings.json`
  files parse unchanged.

## Open questions

- **Closed:** does the TS SDK expose `withHttpHealthCheck` on `addExecutable` resources?
  Yes — verified against a real `aspire restore` (finding 3).
- **Closed:** is `/health` an SSR route in the scaffold, or a JSON short-circuit? SSR by default
  (findings 5–6).
- **Deferred (not this run):** should services, plugins, and background processors get probes too?
  Yes in principle, but the path is per-plugin and must be declared, not defaulted (finding 10).
  Filed as a follow-up rather than guessed at here.
