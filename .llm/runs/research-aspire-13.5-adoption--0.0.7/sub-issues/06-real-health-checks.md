# [aspire-13-5 S6] Real health checks for backing services via TS `addHealthCheck`/`withHealthCheck`

> DRAFT TEXT ONLY. Labels: `type:feat`, `epic:aspire-13-5`, `area:aspire`, `area:database`,
> `area:cli`, `priority:p1`, `status:triage`. Milestone: `0.0.7`. Closes #1280 (move from Backlog,
> drop `status:blocked`). Contributes to #863 (closed together with S8) and #1366 (comment).

## Summary

Aspire 13.5 adds `builder.addHealthCheck(name, async () => HealthCheckResult)` and
`resource.withHealthCheck(key)` to TypeScript AppHosts (What's New "Custom health checks"; TS API
`addHealthCheck` on `IDistributedApplicationBuilder`). Register real readiness checks for the
scaffolded backing services so `aspire wait <db> --status healthy` and `waitFor(db)` mean "accepting
connections", not "container is running".

## Scope

- `generate-register-infrastructure.ts`: for Postgres/MySQL/MSSQL emit an
  `addHealthCheck('<name>_ready', …)` that opens a TCP/protocol probe (no driver dependency in the
  AppHost — use the connection-string endpoint + a minimal handshake or the integration's own
  `withHttpHealthCheck` where an HTTP surface exists), then `.withHealthCheck('<name>_ready')`.
  Redis/Garnet: `PING` over TCP. Deno KV container: existing HTTP endpoint check.
- `_aspire-compat.ts.template`: helper `createTcpReadinessCheck(host, port)` (Node `net`).
- `packages/aspire` domain: `HealthCheckSpec` already exists — extend only if a new field is needed;
  keep ports SDK-neutral.
- E2E: `runtime-gates.ts` wait gates assert `healthReports` non-empty for each backing service
  (`aspire describe --format Json` → `.healthReports | length > 0`).

## Boundaries

Background-child liveness (#1366 framework half) is out of scope; only the Aspire-side registration
point is delivered here. No dashboard/UI work.

## Acceptance

- [ ] Every generated backing service shows ≥1 `healthReports` entry in `aspire describe` (receipt
      in PR for postgres+docker and sqlite+garnet tiers).
- [ ] `aspire wait postgres --status healthy` fails fast (exit 18) when the container is running but
      refusing connections (simulate with a wrong password parameter) — the #863 symptom.
- [ ] `Closes #1280`; comment on #1366 naming the registration hook.
- [ ] `scaffold.runtime` green on both tiers; `quickstart` walk green.

## Tests / gates

Generator tests for the emitted checks; `scaffold.runtime`; scoped wrappers; `quality:scan`;
`arch:check`; `check:assets-barrel`.

## Docs / static asset regeneration

`deno task gen:assets-barrel`; `docs/site/reference/aspire/index.md` health section (S11 owns prose;
this PR adds the reference line).

## Related

Part of #<epic>. Depends on S5. Blocks S8. Related: #954, #1012, #1259, #863, #1366.
