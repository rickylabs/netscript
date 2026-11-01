# S6 IMPL-EVAL verdict: **PASS** for the code

The S6 source edits meet C1–C4 and the code side of C5 and C6. I found no blocking defects. The change adds no new dependency and leaves the watch policy and the AppHost restart policy untouched. The e2e runtime scripts are not in the change set.

This is not READY. C5 and C7 still need runtime evidence: the refresh receipts, the confirmation that shop-web is healthy, and the browser proof are not yet recorded. The full `scaffold.runtime` gate stays UNPROVEN, and I have not certified any remote checks.

## Conditions verified

**B1 — the not-yet-generated client now fails honestly** (`packages/cli/src/kernel/adapters/database/scaffolder.ts`, lines 31–50)
- The placeholder's `$queryRaw` and `$queryRawUnsafe` both reject with a clear message telling the user to run `netscript db generate`. No fake model delegates were added.
- `s6-first-boot-health.json` shows the effect: before generation the service returns `/health` 503, its database check is `healthy:false` with that message, and Aspire reports it `Unhealthy`. This is the first half of C5.

**C1 — exact targeting** (`refresh-generated-client-consumers.ts`)
- Targets are matched on `displayName` only, must be of type `Executable` and in state `Running`.
- The whole target set is checked before anything is changed. If one logical name maps to more than one resource, it fails before any restart; the test confirms only the snapshot call was made.
- Every Aspire call passes `--apphost`, so it is scoped to this project's AppHost.
- Tests cover a stopped resource, a disabled service, a memory service, a service with no `deno.json`, and a similarly named resource (`sibling` vs `sibling-extra`).

**C2 — mapping services to the right database**
- The primary database comes from appsettings `PrimaryDatabase`, or the only configured database if there is one. The facade file is never parsed.
- The facade, the service `Workdir`, the service `deno.json` and the `@database` import target are all resolved to their real paths, and anything outside the project root is excluded.
- `Workdir` defaults match the AppHost generator (`services/<name>`, root-relative). The symlink-escape test passes.

**C3 — each service restarts at most once**
- One shared set of already-restarted services spans every database in a `db generate` run (`operation-runner.ts`, lines 104–113), and services already in it are skipped.
- If a later database fails, the command still returns that nonzero code. The `finally` block prints which services were refreshed.

**C4 — safe lifecycle**
- Refresh runs only when the operation is `generate`, it exited 0, and the AppHost was already running. All of this happens while the database operation's lifecycle lease is still held.
- The standalone path makes no restart calls, and a test confirms this.
- Each target is restarted, then the command waits until Aspire reports it healthy, one at a time. One overall deadline, combined with the caller's cancellation signal, bounds every call. Tests cover both an unresponsive Aspire command and caller cancellation.
- A failed restart or failed health wait makes the command fail, and the error prints the exact `aspire resource <name> restart --apphost <path>` command to run by hand. There is no `start`/`stop` fallback, so the AppHost is never fully restarted.

**C6 — seeded-row checks** (`probe-app-reference.ts`)
- The seed row must appear inside a `td` or `dd` element, after scripts are stripped out.
- Negative tests reject an "unavailable" panel, an empty table, and data that appears only in hydration scripts.
- The check runs on `/`, `/records` and `/examples/users`.
- The `BEHAVIOR_APP_REFERENCE` gate runs after `DATABASE_SEED` (`capability-suites.ts`, lines 131 and 181), so the assertions run against seeded data.

**CRUD link fix**
- `crud-view.tsx.template` no longer contains `/examples/`. Its link now comes from the typed route value `serviceHref` and is shown only when `hasService` is true. Otherwise it points to Records with honest wording.
- `appRoutes.serviceExample` always exists: without a service it falls back to `routes.examples.$route`. So the no-service project still type-checks.
- Both cases are covered in `workspace-pages_test.ts`.

**Runtime evidence so far**
- `s6-aspire-red.json` reproduces the bug: `/health` 200, Records unavailable, `/examples/orders` 500.
- `s6-aspire-recovery.json` shows the fix working on the same fixture: after a public `db generate` with no manual restart, `/records`, `/examples/orders` and `/` all render the seeded row.

## Findings

| # | Severity | Finding |
|---|---|---|
| F1 | Must have before READY (evidence) | C5 asks for the restart and health-wait receipts. `s6-aspire-recovery.json` only records page results. Add the `db generate` exit code and its refresh output lines (`Refreshing…`, `Refreshed … healthy`, `Database consumers refreshed: orders`). |
| F2 | Must have before READY (evidence) | `s6-first-boot-health.json` records shop-web as `Unhealthy` after generation. You report that a later wait confirmed `orders` and `shop-web` Healthy, but no file I was given records it. Save that receipt in the run directory. |
| F3 | Must have before READY (evidence) | The headless-browser DOM proof at both viewports is still pending. Until it lands, the `td`/`dd` seeded-row match has only been unit-tested against fake markup, not the real `ResponsiveTable` output on `/`, `/records` and the example page. |
| F4 | Low | `crud.tsx.template` checks `hasService`, which comes from `includeExampleService` alone. `serviceExampleRouteReference` also requires `serviceName`. If `includeExampleService` were true with no `serviceName`, the link would point to the examples index while saying "generated service resource page". Use the same condition for both. |
| F5 | Low | `migrate` and `seed` never triggering a refresh is only covered implicitly, because the scripted fake executor would fail on extra calls. An explicit "no `describe`/`restart` call" assertion would make it unambiguous. |
| F6 | Low, accepted residual | A resource that is still `Starting`, or is missing from the snapshot, is skipped silently. Services whose config is `deno.jsonc` are skipped with a warning. Plugin runtimes are not refreshed. Record these in `drift.md`, as agreed at PLAN-EVAL. |
| F7 | Info | In `scaffold.runtime`, the post-start `DATABASE_GENERATE` gate will now restart `users` and wait for it to be healthy, even though its client was already generated before start. This is expected, adds some runtime, and also exercises the refresh path in CI. |

## Readiness

- **Code:** PASS. The local wrapper and test results you report (10 files; 416 tests across 55 files) are in line with this, but I did not re-run them.
- **Runtime:** a focused local isolated-Aspire red/green proof only. Full `scaffold.runtime` is still UNPROVEN.
- **Merge:** not READY until F1–F3 are recorded and all required remote checks are green.
