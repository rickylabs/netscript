# [aspire-13-5 S6] Listener-readiness health checks for backing services via TS `addHealthCheck`/`withHealthCheck`

> DRAFT TEXT ONLY. Labels: `type:feat`, `epic:aspire-13-5`, `area:aspire`, `area:database`,
> `area:cli`, `priority:p1`, `status:triage`. Milestone: `0.0.7`. Closes #1280 (move from Backlog,
> drop `status:blocked`). Contributes to #863 (closed by S8's bounded wait) and #1366 (comment).
> PLAN-EVAL F1 correction (2026-08-29): the readiness contract below is **locked and executable**;
> credential/authentication correctness is **explicitly deferred** (see "Deferred").

## Summary

Aspire 13.5 adds `builder.addHealthCheck(name, async () => HealthCheckResult)` and
`resource.withHealthCheck(key)` to TypeScript AppHosts (What's New "Custom health checks"; TS API
`addHealthCheck` on `IDistributedApplicationBuilder`, `withHealthCheck(key)` on resources —
`sources/aspiredev-reference_api_typescript_aspire.hosting.md`). Register **listener-readiness**
checks for every scaffolded backing service so `aspire wait <r> --status healthy` and `waitFor(r)`
mean "the service is accepting TCP connections on its Aspire endpoint (and answers a protocol `PING`
where that is one line of RESP)", instead of "the container process exists".

## Locked readiness contract (per backing-service kind)

| Kind (generator emission)                                     | Probe                                                             | Dependency                                                      | Healthy                | Unhealthy                                                                                                                   | Timeout                               |
| ------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Postgres (`addPostgres`)                                      | TCP connect to `getEndpoint('tcp')` host:port                     | Node `node:net` only (already imported by `_aspire-compat.mts`) | socket `connect` event | `ECONNREFUSED`, `EHOSTUNREACH`, `ETIMEDOUT`, or no connect within timeout                                                   | 2000 ms per attempt (Aspire re-polls) |
| MySQL (`addMySql`)                                            | same TCP connect                                                  | `node:net`                                                      | same                   | same                                                                                                                        | 2000 ms                               |
| SQL Server (`addSqlServer`)                                   | same TCP connect                                                  | `node:net`                                                      | same                   | same                                                                                                                        | 2000 ms                               |
| Redis (`addContainer` redis image)                            | TCP connect, write `PING\r\n`, expect `+PONG`                     | `node:net` (RESP inline command, no client library)             | `+PONG` within timeout | connect error, non-`+PONG` reply, or `-NOAUTH` (reported as **Degraded** with description `auth required — readiness only`) | 2000 ms                               |
| Garnet (`addContainer` garnet image / garnet tool executable) | same RESP `PING`                                                  | `node:net`                                                      | `+PONG`                | as Redis                                                                                                                    | 2000 ms                               |
| Deno KV container (`addContainer` denokv)                     | existing `withHttpHealthCheck` on the `http` endpoint (unchanged) | —                                                               | HTTP 200               | non-200 / refused                                                                                                           | Aspire default                        |
| SQLite / `none`                                               | no AppHost health check (file-backed)                             | —                                                               | —                      | —                                                                                                                           | —                                     |

- `HealthCheckResult` mapping:
  `{ status: HealthStatus.Healthy, description: '<kind> listener ready on <host>:<port>' }`,
  `{ status: HealthStatus.Unhealthy, description: '<kind> listener unreachable: <code>' , data: { code, host, port, elapsedMs } }`,
  `Degraded` only for the RESP `-NOAUTH` case.
- Secrets: the probe never reads or sends the database password/user parameters; no credentials
  cross the AppHost boundary. (Redis/Garnet `PING` before `AUTH` is answered `-NOAUTH` on
  password-protected servers, which the contract treats as "listening".)
- Cancellation: each probe creates one socket, sets `socket.setTimeout(2000)`, and destroys the
  socket on `connect`/`data`/`error`/`timeout`; no retry loop inside the check (Aspire's health
  monitor re-invokes it).
- Registration: one `builder.addHealthCheck('<resource>_listener', probe)` per resource plus
  `.withHealthCheck('<resource>_listener')`, emitted by `generate-register-infrastructure.ts`;
  helper `createListenerReadinessCheck({ kind, host, port })` and
  `createRespPingCheck({ host, port })` live in `_aspire-compat.ts.template` (Node `net`, no new
  dependency).
- Endpoint resolution: host/port come from the resource's own endpoint reference
  (`await resource.getEndpoint('tcp').property(EndpointProperty.Host|Port)`, 13.4+ thenable chain)
  at check time, so `--isolated` port randomisation is honoured.

## Deferred (explicitly out of this slice)

- **Credential/authentication readiness** (wrong password, missing role, database not created):
  requires protocol clients (`pg`, `mysql2`, `tedious`) inside the Node AppHost. Deferred to a 0.0.8
  issue "[aspire-13-5 S6b] protocol-level readiness" opened at filing time; the NetScript
  service-side `/health` DB probe (#1259) remains the credential truth in 0.0.7.
- Background-child liveness (#1366 framework half) — comment only.

## Scope (files)

- `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts` (+
  tests): emit registrations per kind above.
- `packages/cli/src/kernel/assets/aspire/helpers/_aspire-compat.ts.template`: the two helpers.
- `packages/cli/src/kernel/assets/generated/aspire/helpers/generate-register-infrastructure-1.ts.template`
  snapshot regenerated; `embedded.generated.ts` via `gen:assets-barrel`.
- `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts`: wait gates assert
  `healthReports['<resource>_listener']` present and `Healthy` for every backing service.
- `packages/aspire`: **no public-surface change** (`HealthCheckSpec` already carries `kind/path`;
  the listener probe is an AppHost helper, not a port) — jsr-audit N/A.

## Failure fixture (what the chosen probe can actually observe)

E2E `runtime.health.listener-unreachable`: with the AppHost running (`--isolated`), stop the
Postgres container (`aspire resource postgres stop`) and assert within 30 s that
`aspire describe postgres --format Json` reports `healthStatus: Unhealthy` with
`healthReports.postgres_listener.description` matching
`/listener unreachable: ECONNREFUSED|ETIMEDOUT/`, and
`aspire wait postgres --status healthy --timeout 10` exits **18**; then
`aspire resource postgres start` and assert recovery to `Healthy`. The same fixture runs for
`redis`/`garnet` (expecting the RESP path).

## Acceptance

- [ ] Every generated backing service shows a `<resource>_listener` (or `_resp`) entry in
      `healthReports` in `aspire describe --format Json` (receipt for postgres+docker and
      sqlite+garnet tiers).
- [ ] `runtime.health.listener-unreachable` fixture passes on both tiers (stop → Unhealthy/exit 18 →
      start → Healthy).
- [ ] Helper unit tests: `createListenerReadinessCheck` against a local `net.createServer`
      (Healthy), a closed port (Unhealthy/ECONNREFUSED), and a black-hole address with 2000 ms
      timeout (Unhealthy/ETIMEDOUT); `createRespPingCheck` against a fake RESP server replying
      `+PONG`, `-NOAUTH`, and garbage.
- [ ] No credential material appears in the emitted helper or in `healthReports` data (grep test on
      generated output for the password parameter name).
- [ ] `Closes #1280`; comment on #1366 naming the registration hook; comment on #863 that the
      indefinite-block half is closed by S8's bounded wait and the listener half here.
- [ ] `scaffold.runtime` green on both tiers; `quickstart` walk green.

## Rollback

Revert the PR and run `deno task gen:assets-barrel`; generated projects regain process-state health
only (the 13.4.6 behaviour). No data or schema impact. Consistent with the acceptance above: the
fixture is removed with the emission.

## Tests / gates

Generator tests; helper unit tests; `runtime.health.listener-unreachable`; `scaffold.runtime`;
scoped wrappers; `quality:scan`; `arch:check`; `check:assets-barrel`.

## Docs / static asset regeneration

`deno task gen:assets-barrel`; `docs/site/reference/aspire/index.md` health section line (S11
prose).

## Related

Part of #<epic>. Depends on S5. Blocks S8. Related: #954, #1012, #1259, #863, #1366.
