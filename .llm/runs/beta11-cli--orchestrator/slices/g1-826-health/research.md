# Research — issue #826 aggregate health

## Re-baseline

- Carried-in source: GitHub issue #826 and the evidence statement from eis-chat#150; design context
  is PR #822 (`.llm/runs/rfc-single-deployment--orchestrator/plan.md`, rev 10).
- Re-derived against `origin/main` @ `ca72db14fbbfd42aa60e37c7aea730ed9a81585c` on 2026-07-17.
- The branch is exactly at `origin/main` before this run. Issue #826 is open, labelled
  `type:fix`, `area:service`, `wave:v1`, `priority:p1`, `status:plan`, and assigned milestone
  `0.0.1-beta.11`.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `createHealthHandler` executes every supplied check, then computes aggregate status from every result; there is no inclusion predicate. | `packages/service/src/primitives/health.ts:86-127` |
| 2 | An empty participating-check set is healthy. This is the desired aggregate result when every declared adapter is unused/unconfigured. | `packages/service/src/primitives/health.ts:117` and `packages/service/tests/health_test.ts` |
| 3 | The built-in adapter classes are database, Deno KV, external service, and custom. Each returns the same public `HealthCheck` contract. | `packages/service/src/primitives/health.ts:138-212` |
| 4 | Existing tests cover only empty aggregate, liveness, and failed readiness; they do not prove aggregate participation per adapter class. | `packages/service/tests/health_test.ts` |
| 5 | `defineService` already avoids registering a database check when no `$queryRaw`-capable client exists, but aggregate health has no general way to exclude an adapter object that exists yet is not configured/used. | `packages/service/src/presets/define-service.ts:40-61,190-211` |
| 6 | `scaffold.runtime` probes workers `/health`, sagas `/health/live` and `/health/ready`, triggers `/health`, and auth liveness/readiness. The aggregate probes currently assert reachability/status only. | `.llm/tools/e2e/scaffold-e2e-test.ts:1100-1136` |
| 7 | Doctrine classifies `@netscript/service` as Archetype 4 (Public DSL / Builder), verdict Refactor. This change is additive contract behavior in the health primitive and does not deepen the recorded package-shape debt. | `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md` |

## jsr-audit surface scan

- Surface scanned: `packages/service/mod.ts`, `packages/service/src/primitives/health.ts`, and
  `packages/service/deno.json` exports.
- Risk: the participation signal extends the exported `HealthCheck` interface. It must be optional
  so existing consumer object literals compile unchanged; documentation and consumer compilation
  are required. No new entrypoint, dependency, permission, or slow inferred return type is planned.
- Existing published-surface debt remains the recorded service slow-type carve-out; this fix must
  not deepen it.

## Open questions resolved by the plan

- Inclusion is declared on `HealthCheck`, not inferred from adapter names, environment variables,
  or check failures. A health failure from a configured adapter remains aggregate-authoritative.
- Excluded checks are filtered before invocation, proving that an unused adapter cannot create side
  effects or poison aggregate status.
- The existing `checks` response remains the participating result list; excluded checks are absent
  rather than reported as healthy or skipped.
