# S6 diagnosis: service started before the database client is generated

**Recommendation (still needs a terminal plan review):** two small fixes plus one runtime proof.

1. **Make the init placeholder client honest**, so the service reports unhealthy instead of falsely healthy.
2. **After a successful `db generate` against a running AppHost**, restart only the database-consuming service resources, then wait until they're healthy.
3. **Prove a seeded row through the real app** in `scaffold.runtime`.

Separately, make the CRUD-view copy conditional on a service existing.

## Root cause, confirmed in source

- **The placeholder has no delegate and no health hook.** `generatePlaceholderPrismaClient` in `packages/cli/src/kernel/adapters/database/scaffolder.ts` (lines 31–46) defines only `$disconnect` and a no-op `$queryRawUnsafe`. It has no model delegate and no `$queryRaw`.
- **The service binds once and never reloads.** `packages/cli/src/kernel/assets/service/main.ts.template` (lines 13–15) awaits `db.getClient()` at module load and passes it to `createPrismaRepository(database)`. In `adapters/prisma-entity-repository.ts.template` (line 20), `database.<model>` is captured immediately; with the placeholder it is `undefined`, so every list/get call throws. That is the "Records unavailable" result.
- **Why the service looks healthy.** `packages/service/src/presets/define-service.ts` (`findDatabaseHealthCandidates`, around lines 75 and 114) only treats a db object as health-checkable if it has `$queryRaw`. The placeholder doesn't, so no health check, readiness check or startup connectivity hook is registered. `/health` stays green while the service can never serve data. The false green comes from that missing `$queryRaw`, not from any database probe.
- **Why `scaffold.runtime` didn't catch it.** In `packages/cli/e2e/suites/scaffold/capability-suites.ts`, `DATABASE_CODEGEN` runs before Aspire starts (line 84), so the real client already exists when services boot. After start, migrate and seed only change data, and Prisma picks that up lazily, so `verify-live-db-endpoint.ts` sees "Seed User" without any restart. Your red order (start Aspire, then run db init/generate/seed) is a user flow the suite never exercises.
- **The existing restart precedent excludes services.** `ASPIRE_TYPED_DB_COMMAND_OR_RESTART_SCRIPT` in `packages/cli/e2e/src/application/gates/scaffold/runtime/runtime-scripts.ts` (lines 64–113) restarts only the KV background runtimes, using `aspire resource <name> restart`. Generated services are never restarted.

## Candidate fix boundaries

### B1 — honest placeholder (required; one template function)

**Change:** in `scaffolder.ts`, give the placeholder a `$queryRaw` that rejects with a named error, e.g. "Prisma client not generated — run `netscript db generate`, then `aspire resource <service> restart`".

**What follows automatically:**
- `define-service` now finds a health candidate, so `/health` and `/health/ready` report the database unhealthy.
- The startup connectivity hook (`packages/service/src/diagnostics/database-connectivity.ts`, lines 184–215) logs `QUERY_FAILED` with that message. It logs and returns; it does not crash-loop.
- The Aspire dashboard shows the true state.

**Optional:** since the scaffolder already knows `modelName` (it uses it for the Zod placeholder), the placeholder could expose a typed `<model>` delegate whose methods reject with the same error. That would replace the `TypeError` with an actionable 503-class error.

**Tradeoffs:**
- No runtime behaviour changes once the client is generated: Prisma replaces the placeholder file and `clear-seeded-artifacts` removes it.
- The startup hook's retry/delay loop may make a pre-generate service report not-ready for a little longer. That is the honest state.
- Not a "lazy module hack": the service is still bound once at startup.

### B2 — targeted service restart after generate (recovery; one runner)

**Where:** `DbOperationRunner` in `packages/cli/src/kernel/adapters/database/operations/operation-runner.ts`. It already detects a running AppHost through `aspire ps` (`findProjectAppHost`), holds the AppHost lifecycle lock, and runs `aspire resource …` and `aspire wait …`.

**Rule:** a change to the generated client's module graph requires a process restart; data-only changes don't. So:
- Only `generate`, and `init` if init produces the client, triggers restarts.
- `migrate`, `seed` and `reset` never do.
- Only when the operation ran on a resident AppHost. In the standalone path (`executeStandalone`), the AppHost is torn down anyway.

**Action:** for each target, run `aspire resource <service> restart --apphost …`, then `aspire wait <service> --status healthy`, reusing `waitForDatabase`'s timeout and exit-code handling. With B1 in place, "healthy" now actually means the real client is loaded.

**Choosing targets (from config, not source):**
- **Phase 1 (smallest):** every enabled `NetScript.Services` entry in the database workspace being generated. Downside: memory services that happen to live in a database workspace get restarted too, and their seeded in-memory data resets. Document that.
- **Cleaner:** have init and service-add record a declarative database binding on each service entry. That touches the `packages/aspire/config.ts` schema contract, so treat it as a follow-up.
- Exclude apps (they reach data through SDK clients) and plugins/background resources (already covered by the migrate restart path).

**On failure:** keep `generate` exit 0 (the generation itself succeeded), but warn with the exact manual `aspire resource … restart` command. Or exit non-zero if you want strictness; that's a judgement call.

**Tests:** `operation-runner_test.ts` already asserts `aspire` argument lists. Add cases:
- resident `generate` issues restart then wait for each target, in order;
- standalone `generate` issues no restarts;
- `migrate` and `seed` issue no restarts;
- a failed restart produces a warning containing the manual command.

### Options I don't recommend

| Option | Why not |
| --- | --- |
| Flip `WatchMode` to true for services | `packages/aspire/config.ts` defaults it to false (lines 462, 474) to keep process lifecycle deterministic for health and crash-loop accounting and to avoid restarts on unrelated writes. Prisma generate writes many files, so watch mode would restart several times, possibly mid-write. It also does nothing for users who keep the default. Plugin entries already default to `WatchMode: true` (`appsettings-entry-builders.ts`, line 96); worth noting as an inconsistency, but out of scope. |
| Restart the whole AppHost | The existing e2e fallback (`ASPIRE_RESTART_SCRIPT`) does this. Too broad: it reallocates endpoints and resets every resource. |
| Re-resolve the client lazily on each request | Changes generated service semantics, hides the misconfiguration, and is the dynamic-module hack you want to avoid. |
| Restart services after migrate/seed | Not needed, as `scaffold.runtime` itself proves. |

## Runtime proof needed in `scaffold.runtime`

1. **Live seeded-row gate through the app (new).** After `RUNTIME_WAIT_APP`, resolve the generated app's endpoint from Aspire. Fetch `/records` and `/examples/<service>` server-rendered pages and assert the seeded row name appears ("Seed User" for this fixture's `users` service). This proves app → SDK discovery → service → database. Today only `verify-live-db-endpoint.ts` checks the service API directly.
2. **Exercise B2 inside the existing order.**
   - If `GATE.DATABASE_GENERATE` (capability-suites line 130, after `RUNTIME_ASPIRE_START`) runs the public `netscript db generate`, B2 will restart `users` within the suite. Record a restart receipt, and check that `RUNTIME_ASPIRE_DESCRIBE` and the waits converge afterwards.
   - If that gate calls a lower-level task instead, add a small post-start gate that runs the public `db generate` and asserts the restart, the healthy wait, and that the seeded row survives.
3. **Don't move `DATABASE_CODEGEN` out of the pre-start phase.** The generated type-check, lint and production-exclusion gates depend on it. Cover the true "never generated" order with B1 and B2 unit tests, plus the coordinator's exact-order reproduction kept as manual evidence.
4. **Leave the e2e background-restart script and the runtime/static tier policy unchanged.**

## CRUD-view copy fix

`packages/cli/src/kernel/assets/app/routes/examples/(_components)/crud-view.tsx.template` line 92 always says "The live service-backed CRUD route is generated under /examples/{{serviceName}}", even when no service was generated.

**Fix:** render that sentence only when `{{hasService}}` is true. Use the same pattern already used in `routes/records/index.tsx.template` and `examples/index.tsx.template`, either by passing a `hasService` prop from `routes/examples/crud.tsx.template` or with an inline conditional. In the no-service case, point to `/records` and its add-service empty state instead.

**Test:** extend the no-service assertion in `workspace-pages_test.ts`: the rendered no-service CRUD view must not contain `/examples/`, and the service variant must still contain it.

Also note: `agent-conventions.ts` (line 90) is already gated on `includeExampleService`, and the static "New account" button on that pattern page is presentation-only. Neither needs changing.

## Open risks for the plan evaluation

- The B2 target set over-restarts memory services in database workspaces until a declarative binding exists.
- The restart-then-wait adds latency to `db generate` on a resident AppHost. Bound it with the existing `resolveDbCliTimeoutSeconds`.
- B1 changes what the very first boot reports (unhealthy until `db generate` runs). That needs one line in the README and init's next steps.
- The second exact-order red reproduction should confirm two things: services report unhealthy under B1, and seeded rows render after `db generate` under B2, with no full AppHost restart.
