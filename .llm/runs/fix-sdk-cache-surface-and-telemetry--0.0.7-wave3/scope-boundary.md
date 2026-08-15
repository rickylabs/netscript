# Scope-boundary report

The declared product surface is limited to:

- `packages/sdk/src/cache/cache-provider.ts`
- `packages/sdk/src/cache/cache-query.ts`
- `packages/sdk/src/cache/cache-telemetry.ts`
- `packages/sdk/src/ports/cache-store.ts`

No product file outside those four is authorized by this leaf plan. The topic orchestrator has
granted exactly the following four additional acceptance/proof files and no others:

| Additional file | Why unavoidable | Published surface | Breaking? |
| --- | --- | --- | --- |
| `packages/sdk/README.md` | #1619 explicitly requires the fail-safe/fail-loud decision documented; #1620 needs the mechanical cardinality behavior documented next to the existing namespace guidance. | Yes, published prose/API contract | No; clarifies behavior and failure guarantees |
| `packages/sdk/src/cache/cache-provider_test.ts` | #1598 explicitly requires a test for the resolved module identity and two-instance hypothesis. | No; excluded test | No |
| `packages/sdk/tests/cache/cache-telemetry_test.ts` | Amend the deliberate fail-loud test, cover lookup/write/invalidation malformed evidence, validate an invalid descriptor inside a span, and prove the cardinality overflow event/collapse. | No; excluded test | No |
| `packages/sdk/tests/cache/cache-query-kv-limit_test.ts` (new) | Required behavioral RED for #1637: preinitialize real in-memory Deno KV, use a real `KvCacheStore`, return a payload over 65,536 bytes, and prove the caller still receives it while the entry remains uncached. A synthetic throwing store is insufficient. | No; excluded test | No |

## Deliberately not requested

- `packages/sdk/src/ports/query-options.ts`: the plan chooses runtime cardinality bounding, so it
  does not brand `QueryParams.operationId` and does not make a breaking published type change.
- A per-action `no-store` option: useful but not needed for failure isolation; it would require
  `query-options.ts` and generated factory changes. It is deferred pending separate scope.
- Provider ownership/globalization: #1598 is diagnostic only; `_provider` remains module-local.

## Pre-existing doc-lint ruling — exact baseline accepted

The coordinator accepted a strict no-regression baseline rather than widening remediation scope.
Raw `deno doc --lint` must run separately across all 12 SDK entrypoints and across
`./src/cache/mod.ts`; both exit 1. The exact six named diagnostics and commands are locked in
`plan.md` validation steps 9a/9b. No count-only wrapper result can satisfy this gate, no new
diagnostic is allowed, and neither red invocation may be reported as a pass. The plugin-streams
diagnostic in the combined run is outside SDK and is not this leaf's regression to repair.

## Named accepted drift outside the grant

`docs/site/web-layer/query-bridge.md:98` quotes the exact current uninitialized-provider error that
D4 will replace. That file is outside the declared surface and the exact grant, so this leaf will
not edit it. Record `FOLLOWUP-DOC-QUERY-BRIDGE-DIAGNOSTIC` as accepted drift: the topic orchestrator
owns a documentation follow-up to synchronize the quoted message after D4 lands. This is a known
stranded published-doc consumer, not a negative-search claim and not permission to widen the leaf.
