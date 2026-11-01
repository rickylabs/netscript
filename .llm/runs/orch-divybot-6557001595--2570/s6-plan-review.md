**PASS_PLAN**, with seven implementation conditions (C1–C7). There are no blockers: every part of the plan works with what is already in the repo, it touches no foreign resources, and it needs no new config schema.

## Feasibility, checked against the source

- **B1 is enough on its own to turn the false-healthy result into an honest failure.**
  - `define-service.ts` registers a service's database health check, readiness check and startup check only when the client has a `$queryRaw` method (lines 111–115 and 307–341). Adding a rejecting `$queryRaw` to the placeholder therefore brings all three back.
  - The startup check only logs and returns after retrying (`database-connectivity.ts`, lines 184–215), so the service stays up but reports failing. It does not crash-loop.
  - The facade's `healthCheck` already catches errors and returns false (`generate-engine-mod-1.ts.template`, lines 50–56).
  - Services get an Aspire HTTP probe on `/health` by default (`RESOURCE_DEFAULTS.AppHealthCheckPath`), so `aspire wait <svc> --status healthy` becomes a real check once B1 lands.
- **Choosing targets from `deno.json` holds up.**
  - Generated services get an `@database` import only when `hasDatabase` is set (`generate-service-deno-json.ts`, line 72), so memory services are excluded naturally.
  - The root facade re-exports exactly one engine (`generate-db-mod.ts`), so "root facade means primary database only" is correct.
  - The import map is declarative config, not source code, so this is not source-sniffing.
- **The pieces to reuse already exist.**
  - `DbOperationRunner` already finds the resident AppHost with `aspire ps` matched on the exact AppHost path, holds the lifecycle lease for the whole operation, and has the cancellation signal and timeout (`resolveDbCliTimeoutSeconds`).
  - It also has an `aspire wait` wrapper with handling for timeout exit codes.
  - `operation-runner-helpers.ts` already parses `aspire describe` JSON scoped to the AppHost.
  - `generate` goes through the legacy resource path and returns its exit code before the lease is released, which is exactly where the refresh step fits.
- **The runtime gate already covers the start-before-generate order.** `database-gates.ts` (line 80) runs the public `netscript db generate` after `RUNTIME_ASPIRE_START`. The new refresh step will therefore run inside `scaffold.runtime`. The missing piece is the seeded-row DOM assertions, which plan item 4 adds.

## Conditions for implementation and IMPL-EVAL

- **C1 — Match on the logical name only.** Match targets on `displayName` and pass that same name to `aspire resource <name> restart`. Do not reuse `findExecutableStatus`'s rule of matching `displayName` OR `name`: in Aspire, `name` is the unique instance name and can carry a replica suffix.
  - Include only resources that are in the AppHost-scoped snapshot, are of type `Executable`, and are in state `Running`.
  - If one logical name maps to more than one instance, fail with a nonzero exit before any restart.
- **C2 — Map the root facade from config, not from file contents.** Decide "root facade means the primary database" from appsettings `PrimaryDatabase` (falling back to the single configured database). Do not parse `database/mod.ts` to see what it re-exports.
  - Resolve each service `Workdir` and its `@database` target to canonical paths inside the project root. Anything outside the project, or any symlink escape, is not a target.
  - A missing or unreadable `deno.json` excludes that service, with a warning.
- **C3 — Restart each resource at most once per command.** For multi-database or `all` targets, take the union of consumers and restart each one once.
  - If a later database fails to generate, the command returns nonzero even if earlier restarts succeeded, and it says which resources were refreshed.
- **C4 — Restart in sequence, and fail clearly.** For each target, run restart then wait-for-healthy, one after the other, using the existing bounded timeout and the abort signal.
  - Any nonzero exit fails `db generate` and prints the exact manual command: `aspire resource <svc> restart --apphost <path>`.
  - The standalone path (`executeStandalone`) and any operation other than `generate` must make zero restart calls. Unit tests must assert this.
- **C5 — The green proof must show `/health` itself failing before generation.** Before generation, the service's `/health` (the path Aspire probes, not only `/health/ready`) must return a non-200 status and Aspire must report the service Unhealthy. After the restart it must be healthy, and seeded rows must appear in the Overview, Records and `/examples/<service>` pages, with no full AppHost restart.
  - Record the restart and wait receipts in the run directory.
- **C6 — Prove the seeded-row checks fail when they should.** The negative tests for the app probe must fail in two cases: a healthy page shell whose data panel says unavailable, and a page that returns 200 but has no seed row.
- **C7 — Keep honest status reporting.** The full `scaffold.runtime` result stays UNPROVEN until it actually runs. A local isolated Aspire red/green run counts as focused evidence, not as the merge-gate verdict.

## Accepted non-blocking residuals (record in the drift log)

- **Services with `HealthCheckPath: false`.** For these, waiting for "healthy" only waits for the process to be running. Document this.
- **Resources still Starting during generation.** These are skipped. If the process had already loaded the placeholder, it stays stale; the window is small. Optional hardening: wait until such a resource is Running, then include it.
- **Plugins.** Plugin runtimes load the database facade with a dynamic import (`plugins/service-context.ts.template`). They rely on `WatchMode: true`, which is out of scope here.
- **Older database services without an `@database` import.** These are not refreshed. That is safe, since nothing gets restarted, but document it.
- **No fake model delegates.** That choice is accepted. Request-time failures will stay `TypeError`s until generation runs, which the honest health status makes visible.

Not READY: runtime and merge readiness still depend on the red/green receipts, an independent IMPL-EVAL, and green required checks.
