# Evaluate — `@netscript/sdk`

> Wave: **5** · Archetype: **A4 — DSL/Builder** · Pattern: **Builder + Function family**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__sdk.json` · `audit/dry-run/sdk.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 0 | 2 | — |
| Doctrine | 0 | 3 | 1 |
| Standards | 2 | 13 | 2 |

`deno publish --dry-run`: **❌ FAIL** · slow-type problems: **2**

## 2. Package facts

- **Name:** `@netscript/sdk` @ `1.0.0`
- **Description:** "Service discovery, oRPC clients, and cache-backed query factories for NetScript."
- **Files / LOC:** 37 `.ts` files, 3117 lines
- **Exports:** `.`, `./adapters`, `./cache`, `./client`, `./collections`, `./discovery`, `./interfaces`, `./openapi`, `./query`, `./query-client`, `./streams`, `./telemetry`
- **README:** 204 lines
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓, ./adapters: ✓, ./cache: ✓, ./client: ✓, ./collections: ✓, ./discovery: ✓, ./interfaces: ✓, ./openapi: ✓, ./query: ✓, ./query-client: ✓, ./streams: ✓, ./telemetry: ✓
- **Test files:** 0
- **Public surface size:** .=8, ./adapters=1, ./cache=10, ./client=3, ./collections=1, ./discovery=11, ./interfaces=4, ./openapi=2, ./query=5, ./query-client=7, ./streams=6, ./telemetry=1

## 3. Current folder tree (`packages/sdk/`, depth 4, capped at 80 entries)

```
README.md
streams.ts
openapi/
  mod.ts
  helpers.ts
query-client/
  create-service-query-utils.ts
  types.ts
  mod.ts
  key-bridge.ts
  kv-cache-persister.ts
  query-client-factory.ts
mod.ts
discovery/
  service-discovery.ts
  mod.ts
core/
  composite-query.ts
  query-factory.ts
  cache-query.ts
  cache-provider.ts
  client-proxy.ts
deno.json
query/
  mod.ts
client/
  mod.ts
  errors.ts
  service-client.ts
adapters/
  mod.ts
  kv-cache-store.ts
collections/
  mod.ts
  create-query-collection.ts
interfaces/
  metadata.ts
  cache-entry.ts
  mod.ts
  query-factory.ts
  query-options.ts
  cache-store.ts
  service-client.ts
  query-key.ts
  transport.ts
telemetry/
  mod.ts
  otel-middleware.ts
cache/
  mod.ts
```

## 4. `deno publish --dry-run` output (tail)

```
  info: all functions in the public API must have an explicit return type
  docs: https://jsr.io/go/slow-type-missing-explicit-return-type

error[missing-explicit-return-type]: missing explicit return type in the public API
  --> /home/runner/work/netscript-start/netscript-start/packages/sdk/query-client/create-service-query-utils.ts:50:17
   | 
50 | export function createServiceQueryUtils<TClient extends Record<string, any>>(
   |                 ^^^^^^^^^^^^^^^^^^^^^^^ this function is missing an explicit return type
   | 
   = hint: add an explicit return type to the function

  info: all functions in the public API must have an explicit return type
  docs: https://jsr.io/go/slow-type-missing-explicit-return-type

This package contains errors for slow types. Fixing these errors will:

  1. Significantly improve your package users' type checking performance.
  2. Improve the automatic documentation generation.
  3. Enable automatic .d.ts generation for Node.js.

Don't want to bother? You can choose to skip this step by
providing the --allow-slow-types flag.

error: Found 2 problems

```

## 5. Top JSR audit findings

- **WARN** `F-DOCT-4 vocabulary` — forbidden folder name 'interfaces' (utils/helpers/common/lib/interfaces) — needs migration plan + debt entry (`interfaces`)
- **WARN** `F-DOCT-5 cardinality` — directory has 15 immediate children; doctrine cap is 12

## 6. Top doctrine findings

- **WARN** `AP-7/F-DOCT-4` — forbidden folder name 'interfaces' — split into domain/, application/, or adapters/ aligned to a real concern (`interfaces`)
- **WARN** `A8/AP-9` — file is 643 lines (cap 500) — split into smaller single-reason files (`discovery/service-discovery.ts`)
- **WARN** `F-DOCT-5` — directory has 15 immediate children; doctrine cap is 12
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25

## 7. Top standards findings

- **WARN** `NS-S-1.version` — version is '1.0.0'; alpha cadence requires '0.0.1-alpha.0'
- **FAIL** `NS-S-1.strict` — deno.json compilerOptions.strict must be true
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.barrel-only` — mod.ts has 8 non-export/non-comment lines — barrels must be export-only
- **INFO** `NS-S-3.sections` — mod.ts lacks section comment headers — recommended for navigability
- **WARN** `NS-S-4.fn-prefix` — exported function 'generateOpenAPISpec' uses non-standard prefix 'generate' — consult STANDARDS § 4.1 (`openapi/helpers.ts:66`)
- **WARN** `NS-S-4.types` — type 'OpenAPIConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`openapi/helpers.ts`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'bridgeInvalidation' uses non-standard prefix 'bridge' — consult STANDARDS § 4.1 (`query-client/key-bridge.ts:32`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'resetCacheProvider' uses non-standard prefix 'reset' — consult STANDARDS § 4.1 (`core/cache-provider.ts:77`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'safe' uses non-standard prefix 'safe' — consult STANDARDS § 4.1 (`client/errors.ts:86`)
- **WARN** `NS-S-4.types` — type 'FactoryConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`interfaces/query-factory.ts`)
- **WARN** `NS-S-4.types` — type 'QueryParams' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`interfaces/query-options.ts`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'otelMiddleware' uses non-standard prefix 'otel' — consult STANDARDS § 4.1 (`telemetry/otel-middleware.ts:36`)
- **WARN** `NS-S-6.sections` — README missing 11/12 mandated sections (Overview, Quickstart, Mental model, API, Recipes, Configuration, Testing, Observability, Architecture, Stability, Compatibility, License)
- **FAIL** `NS-S-8.coverage` — no tests/ directory and no inline *_test.ts files — every package needs meaningful tests
- **WARN** `NS-S-9.logger` — package owns runtime/adapters but does not import @netscript/logger
- **INFO** `NS-S-10` — mod.ts does not export an `inspect<Noun>()` diagnostic — recommended discoverability axis

## 8. Code-quality verdict

**Small slow-type refactor (2 problems).** Add explicit return types on the published functions. No tests today — meaningful test plan needed (see § 9). Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.task`, `NS-S-3.barrel-only`.

## 9. Test coverage assessment

No tests today. **Required at alpha:** doctest of README examples, port contract suite (if package owns ports), one adapter conformance run per shipped adapter, and one application-layer scenario test. See § 4 of this evaluate doc's plan_ pair for the full test plan.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
