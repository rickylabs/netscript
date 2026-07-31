# Context Pack — fix-aspire-app-health-probe--954

## What this run is

Issue #954: a generated Fresh app is reported `Healthy` by Aspire while every request returns 500.
Root cause: the Aspire helper generator registers no health check at all for generated resources, so
Aspire falls back to "process is Running ⇒ Healthy". Fix: emit an HTTP health probe against the
app's own SSR `/health` route.

## Key files

| File                                                                                  | Why it matters                                            |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts` | Emits the app's Aspire registration; the fix lands here.  |
| `packages/aspire/constants.ts`                                                        | `RESOURCE_DEFAULTS` — default probe path + endpoint name. |
| `packages/aspire/config.ts`                                                           | `AppEntryZod` — the `HealthCheckPath` override.           |
| `packages/cli/src/kernel/assets/app/routes/health.tsx.template`                       | The SSR route the probe hits.                             |
| `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts`                    | Where the new wait + home-page gates live.                |
| `packages/cli/e2e/suites/scaffold/capability-suites.ts`                               | `scaffold.runtime` gate list.                             |

## Verified facts worth not re-deriving

- Aspire 13.4.6 TS SDK:
  `ExecutableResource.withHttpHealthCheck(options?: { path?, statusCode?, endpointName? })`.
  Verified by running `aspire restore` against a throwaway apphost pinned to SDK `13.4.6`.
- Aspire semantics: no registered health check ⇒ `Running` state is treated as ready.
- The scaffold always writes `apps/<app>/routes/health.tsx`, which renders SSR unless the request
  sends `Accept: application/json` without `text/html`.
- Default app resource: name `dashboard`, port **8010** (`SCAFFOLD_APP_PORT` =
  `PORT_RANGES.APP.start + 10`). The offset is deliberate — it keeps the Aspire proxy off Vite's own
  default of 8000. This line previously read `8000`, and that error is exactly what
  `behavior.app-home` shipped with (`drift.md` D-5). Nothing may assume the range start: read
  `NetScript.Apps.<app>.Port` from the generated `appsettings.json`.
- First-party plugin health paths are heterogeneous (`/health`, `/health/live`, `/health/ready`) —
  this is why services/plugins are out of scope here.

## Where to pick up

- A clean-host `scaffold.runtime` is the outstanding verdict for this PR (`drift.md` D-7).
- Follow-up: probes for services / plugins / background processors, with declared per-resource
  paths.
