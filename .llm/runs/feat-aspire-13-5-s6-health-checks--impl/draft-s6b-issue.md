# Draft issue: [aspire-13-5 S6b] Protocol-level credential readiness for generated backing services

Supervisor posting metadata:

- Milestone: `0.0.8`
- Labels: `type:feat`, `area:cli`, `area:aspire`, `area:database`, `priority:p1`,
  `epic:aspire-13-5`, `status:triage`
- Relationship: follow-up to #1718; related to #1259 and #1280

## Summary

S6 (#1718) makes Aspire health mean that generated Postgres, MySQL, SQL Server, Redis, and Garnet
resources are accepting listener connections. It intentionally does not prove that generated
credentials authenticate, the configured role exists, or the selected database is usable.

Add a separate protocol-level readiness layer for generated backing services. The check must
authenticate with the same generated configuration used by consumers, perform the smallest
read-only protocol operation that proves the selected database/service is usable, and return only
redacted diagnostic data. This is a 0.0.8 concern because it introduces protocol clients into the
Node AppHost and needs an explicit dependency/secret-lifetime design.

## Problem

Listener health and credential health answer different questions:

- S6: “Is the endpoint accepting TCP/RESP traffic?”
- S6b: “Can the generated principal authenticate and use the configured logical service?”

A wrong password, missing role, or absent database can therefore leave the S6 listener check
Healthy while application startup still fails. NetScript's service-side `/health` database probe
(#1259) remains the 0.0.7 credential truth, but Aspire orchestration should eventually expose the
failure before dependent resources are released.

## Required design decisions

1. Choose and document the AppHost dependency boundary for `pg`, `mysql2`, and `tedious` (and a
   Redis-compatible client only if authenticated Redis/Garnet readiness is included). Do not add
   clients to `@netscript/aspire` merely to serve generated AppHost code.
2. Define how generated secret parameters are resolved only inside the health callback and disposed
   after one bounded attempt. Secrets must never appear in callback descriptions, `data`, logs,
   thrown messages, E2E receipts, or `aspire describe` output.
3. Define stable health-check keys distinct from S6 listener keys so operators can distinguish
   endpoint reachability from authentication/database usability.
4. Define one minimal read-only protocol operation per supported engine and its error-code mapping.
5. Keep retry policy in Aspire's health monitor: one connection/operation per callback, one bounded
   timeout, deterministic cleanup, and no internal retry loop.

## Proposed scope

- Postgres: authenticate, select the configured database, and execute a minimal read-only query.
- MySQL: authenticate, select the configured database, and execute a minimal read-only query.
- SQL Server: authenticate, select the configured database, and execute a minimal read-only query.
- Redis/Garnet: research whether authenticated readiness belongs here; preserve S6's unauthenticated
  RESP `PING` listener signal and its `-NOAUTH` → Degraded mapping until a credential contract is
  ratified.
- SQLite/`none`: no AppHost protocol check.
- Deno KV: out of scope unless a credential-bearing deployment mode is demonstrated.

## Acceptance

- [ ] A ratified per-engine table names the client, operation, timeout, cleanup, status mapping,
      and redacted error-code vocabulary.
- [ ] Generated checks resolve current endpoint and secret values inside each callback; no secret is
      captured into generator-time data or crosses into `description`, `data`, logs, or receipts.
- [ ] Correct credentials and an existing logical database report Healthy for Postgres, MySQL, and
      SQL Server fixtures.
- [ ] Wrong password, missing role, and missing database fixtures report Unhealthy with stable,
      non-secret diagnostic codes.
- [ ] Listener health remains separately observable, so an authentication failure does not masquerade
      as endpoint unreachability.
- [ ] Each callback performs one bounded attempt, releases its client/socket on every path, and has
      no retry loop.
- [ ] Generator tests prove exact per-engine registration/attachment and the absence of credential
      names/values from emitted diagnostic payloads.
- [ ] Runtime receipts cover at least one success and one credential failure per supported engine;
      receipts are scanned for generated secret material.
- [ ] `scaffold.runtime` and the relevant installed-consumer/quickstart gates pass after the new
      checks are attached.
- [ ] Dependency placement, publish impact, and rollback are reviewed with doctrine and JSR gates
      appropriate to the packages actually changed.

## Boundaries

- Do not replace or weaken the S6 listener checks; protocol readiness is additive and separately
  named.
- Do not expose credentials through `HealthCheckResult`, Aspire topology, dashboard output, or test
  artifacts.
- Do not broaden `packages/aspire` public surface without a separately reviewed contract need.
- Do not make application/service `/health` the AppHost's only credential signal; #1259 remains a
  consumer and compatibility concern.
- Do not add write-based readiness queries or schema mutations.

## Rollback

Remove the protocol-level registrations and their generated client dependencies while retaining the
S6 listener checks. No data/schema rollback is required because probes are read-only.

