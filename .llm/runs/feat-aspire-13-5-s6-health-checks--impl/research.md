# Research — feat-aspire-13-5-s6-health-checks--impl

## Re-baseline

- Carried-in source: issue #1718 and
  `origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/`.
- Re-derived against stacked S5 head `0bd8ba832625655aa42d1a803a8b5b1aca021c37` on 2026-08-30.
- What changed vs the carried-in version:
  - `_aspire-compat.ts.template` does not currently import `node:net`; S6 must add it.
  - The Deno KV container arm does not currently call `withHttpHealthCheck`, despite #1718 calling
    that check “existing.” The owner-locked S6 boundary says Deno KV is unchanged.
  - `runtime-gates.ts` is now 812 lines, but debt `scaffold-runtime-a8-f16-1333` still bars another
    sibling gate/probe without the owed role-named split.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | Aspire 13.5 TypeScript exposes `addHealthCheck(name, check)` and resource `withHealthCheck(key)`. | [addHealthCheck](https://aspire.dev/reference/api/typescript/aspire.hosting/addhealthcheck), [withHealthCheck](https://aspire.dev/reference/api/typescript/aspire.hosting/withhealthcheck), and the saved 13.5 source index. |
| 2 | The custom callback result carries status, optional description, and optional data; the 13.5 What's New sample uses lower-case `status`, `description`, and `data` with `HealthStatus.Healthy`. | [HealthCheckResult](https://aspire.dev/reference/api/typescript/aspire.hosting/healthcheckresult) and [Aspire 13.5 custom health checks](https://aspire.dev/whats-new/aspire-13-5/#custom-health-checks). The API renderer's capitalized field projection conflicts with the official emitted TypeScript sample; the ratified issue locks the lower-case runtime shape. |
| 3 | `EndpointProperty.Host` and `.Port` are stable endpoint selectors; endpoint values must be resolved inside each callback so isolated-start allocation remains current. | [EndpointProperty](https://aspire.dev/reference/api/typescript/aspire.hosting/endpointproperty) and #1718 locked contract. |
| 4 | 13.5.3 `aspire describe --format Json` emits object-valued `healthReports` and resource `healthStatus`. | `origin/test/aspire-13-5-s2-runtime-verification:.../02-v5-aspire-describe-final.json`. |
| 5 | Database servers are emitted by one generator; Redis/Garnet container and Garnet executable arms share setup helpers. SQLite/local/external arms have no listener owned by the generated AppHost. | `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts`. |
| 6 | Runtime wait gates are assembled in `runtime-gates.ts`; suite membership is locked in `packages/cli/e2e/suites/scaffold/capability-suites.ts`. | `createRuntimeGates`, `runtimeResources`, and `RUNTIME_GATES`. |
| 7 | The helper is justified by A6/A7: it encodes the NetScript two-second, one-socket readiness policy and provides a focused test seam; socket I/O remains in the emitted runtime edge, never the pure generator. | Doctrine 01/04 and #1718. |

## Exact emitted-member sources

| Member | Exact API page | S6 use |
| ------ | -------------- | ------ |
| `addHealthCheck` | https://aspire.dev/reference/api/typescript/aspire.hosting/addhealthcheck | builder registration |
| `withHealthCheck` | https://aspire.dev/reference/api/typescript/aspire.hosting/withhealthcheck | resource attachment |
| `HealthCheckResult` | https://aspire.dev/reference/api/typescript/aspire.hosting/healthcheckresult | helper callback result |
| `HealthStatus` | https://aspire.dev/whats-new/aspire-13-5/#custom-health-checks | `Healthy`, `Unhealthy`, `Degraded` values used by the official TS sample/contract |
| `EndpointProperty` | https://aspire.dev/reference/api/typescript/aspire.hosting/endpointproperty | live host/port resolution |
| `withHttpHealthCheck` | https://aspire.dev/reference/api/typescript/aspire.hosting/withhttphealthcheck | revalidated but unchanged in S6 |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: N/A.
- Slow-type / surface risks: N/A — S6 changes generated AppHost implementation assets and CLI E2E
  gates, not `packages/aspire`, `packages/cli` exports, `mod.ts`, `deno.json`, or JSDoc surface.

## Open questions

- None that force implementation rework. Deno KV's missing pre-existing health check is explicit
  drift and remains outside the owner-locked S6 scope.

## Plan-Gate selection

`PLAN-EVAL: N/A`. Issue #1718 is a ratified, executable contract with locked probe semantics,
result mapping, timeout/cancellation rules, exact file scope, acceptance gates, and explicit
deferrals. No architecture or sequencing choice remains for a separate plan evaluator; mandatory
IMPL-EVAL remains assigned to the separate Fable supervisor session.
