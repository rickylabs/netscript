# Scope-boundary report

The declared product surface is limited to:

- `packages/sdk/src/cache/cache-provider.ts`
- `packages/sdk/src/cache/cache-query.ts`
- `packages/sdk/src/cache/cache-telemetry.ts`
- `packages/sdk/src/ports/cache-store.ts`

No product file outside those four is authorized by this leaf plan. The following additional files
are nevertheless required to satisfy explicit acceptance and proof obligations. Implementation is
blocked until the topic orchestrator rules on them.

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

## Pre-existing doc-lint ruling

The required full-export command is currently red before this slice. The cache entrypoint reports
three `private-type-ref` errors in `packages/sdk/src/cache/kv-cache-store.ts:48,97`; the full SDK map
also reports refs in other query/query-client/streams files. Making `deno doc --lint` globally zero
would therefore require additional product files, at minimum `kv-cache-store.ts` for the cache
subpath and potentially multiple unrelated SDK/plugin-streams files for the full map. Those files
are outside the four declared surfaces and are not silently added here.

Requested ruling:

1. authorize the four acceptance/proof files in the table; and
2. either authorize a separately enumerated doc-lint remediation surface after PLAN-EVAL, or accept
   the exact pre-existing baseline as named debt with a strict no-regression comparison for this
   leaf. The plan does not claim the current red command is a pass.

