# Evaluate — `@netscript/fresh`

> Wave: **5** · Archetype: **A4 — DSL/Builder** · Pattern: **Builder + Function family + Adapters**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__fresh.json` · `audit/dry-run/fresh.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 1 | 3 | — |
| Doctrine | 0 | 10 | 1 |
| Standards | 1 | 60 | 2 |

`deno publish --dry-run`: **❌ FAIL** · slow-type problems: **4**

## 2. Package facts

- **Name:** `@netscript/fresh` @ `1.0.0`
- **Description:** "Fresh runtime extensions, builders, forms, defer primitives, and route contracts for NetScript."
- **Files / LOC:** 59 `.ts` files, 11717 lines
- **Exports:** `.`, `./server`, `./builders`, `./route`, `./defer`, `./form`, `./error`, `./utils`, `./streams`, `./query`, `./interactive`, `./vite`
- **README:** 262 lines
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓, ./server: ✓, ./builders: ✓, ./route: ✓, ./defer: ✓, ./form: ✓, ./error: ✓, ./utils: ✓, ./streams: ✓, ./query: ✓, ./interactive: ✓, ./vite: ✗
- **Test files:** 12
- **Public surface size:** .=14, ./server=4, ./builders=64, ./route=52, ./defer=5, ./form=27, ./error=1, ./utils=5, ./streams=3, ./query=15, ./interactive=2, ./vite=3

## 3. Current folder tree (`packages/fresh/`, depth 4, capped at 80 entries)

```
README.md
server/
  sse.ts
  stream.ts
  stream-error-boundary.tsx
  define-fresh-app.test.ts
  define-fresh-app.ts
streams/
  create-stream-db.ts
  mod.ts
route/
  manifest.ts
  manifest.test.ts
  contract.test.ts
  mod.ts
  contract.ts
error/
  mod.ts
  handler.ts
  primitives.ts
utils/
  cache-entry.ts
  mod.ts
components/
  ErrorDisplay.tsx
builders/
  mod.ts
  define-partial.test.tsx
  define-page/
    README.md
    internal.ts
    types.ts
    mod.ts
    builder.tsx
    navigation.tsx
    runtime.tsx
    search-params.ts
  define-page.test.tsx
  define-partial.tsx
form/
  intent.ts
  runtime-state.test.ts
  csrf.test.ts
  schema-adapter.ts
  enhancement.tsx
  form-region.tsx
  collection.test.ts
  form.tsx
  types.ts
  mod.ts
  handler-context.ts
  errors.ts
  telemetry.ts
  reply.ts
  reply.test.ts
  collection-keys.ts
  error-normalization.test.ts
  idempotency.ts
  csrf.ts
  form.test.tsx
  config.ts
  state.ts
  error-normalization.ts
  pagination.ts
  intent.test.ts
  field-descriptors.ts
  schema-adapter.test.ts
  pipeline.ts
mod.ts
config/
  README.md
  vite.ts
  vite.test.ts
interactive.ts
deno.json
server.ts
query/
  mod.ts
  hydration.ts
  query-island.tsx
```

## 4. `deno publish --dry-run` output (tail)

```
  info: all functions in the public API must have an explicit return type
  docs: https://jsr.io/go/slow-type-missing-explicit-return-type

error[missing-explicit-return-type]: missing explicit return type in the public API
  --> /home/runner/work/netscript-start/netscript-start/packages/fresh/query/query-island.tsx:40:17
   | 
40 | export function QueryIsland({ children, queryClient }: QueryIslandProps) {
   |                 ^^^^^^^^^^^ this function is missing an explicit return type
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

error: Found 4 problems

```

## 5. Top JSR audit findings

- **FAIL** `F-JSR-2 module-tag` — export ./vite (./config/vite.ts) lacks @module JSDoc tag (`./config/vite.ts`)
- **WARN** `F-DOCT-4 vocabulary` — forbidden folder name 'utils' (utils/helpers/common/lib/interfaces) — needs migration plan + debt entry (`utils`)
- **WARN** `F-DOCT-5 cardinality` — directory has 17 immediate children; doctrine cap is 12
- **WARN** `F-DOCT-5 cardinality` — directory has 28 immediate children; doctrine cap is 12 (`form`)

## 6. Top doctrine findings

- **WARN** `AP-7/F-DOCT-4` — forbidden folder name 'utils' — split into domain/, application/, or adapters/ aligned to a real concern (`utils`)
- **WARN** `A8/AP-9` — file is 756 lines (cap 500) — split into smaller single-reason files (`route/mod.ts`)
- **WARN** `A8/AP-9` — file is 601 lines (cap 500) — split into smaller single-reason files (`route/contract.ts`)
- **WARN** `A8/AP-9` — file is 1111 lines (cap 500) — split into smaller single-reason files (`builders/mod.ts`)
- **WARN** `A8/AP-9` — file is 712 lines (cap 300) — split into smaller single-reason files (`builders/define-page/types.ts`)
- **WARN** `A8/AP-9` — file is 577 lines (cap 500) — split into smaller single-reason files (`form/schema-adapter.ts`)
- **WARN** `A8/AP-9` — file is 475 lines (cap 300) — split into smaller single-reason files (`form/types.ts`)
- **WARN** `A8/AP-9` — file is 519 lines (cap 500) — split into smaller single-reason files (`form/field-descriptors.ts`)
- **WARN** `F-DOCT-5` — directory has 17 immediate children; doctrine cap is 12
- **WARN** `F-DOCT-5` — directory has 28 immediate children; doctrine cap is 12 (`form`)
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25

## 7. Top standards findings

- **WARN** `NS-S-1.version` — version is '1.0.0'; alpha cadence requires '0.0.1-alpha.0'
- **FAIL** `NS-S-1.strict` — deno.json compilerOptions.strict must be true
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.barrel-only` — mod.ts has 23 non-export/non-comment lines — barrels must be export-only
- **INFO** `NS-S-3.sections` — mod.ts lacks section comment headers — recommended for navigability
- **WARN** `NS-S-4.fn-prefix` — exported function 'discoverNetScriptRoutes' uses non-standard prefix 'discover' — consult STANDARDS § 4.1 (`route/manifest.ts:327`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'bindRoutePattern' uses non-standard prefix 'bind' — consult STANDARDS § 4.1 (`route/mod.ts:631`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'enumPathParamSchema' uses non-standard prefix 'enum' — consult STANDARDS § 4.1 (`route/mod.ts:675`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'fallback' uses non-standard prefix 'fallback' — consult STANDARDS § 4.1 (`route/mod.ts:721`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'paginationSearchSchema' uses non-standard prefix 'pagination' — consult STANDARDS § 4.1 (`route/mod.ts:737`)
- **WARN** `NS-S-4.types` — type 'RouteHrefArgs' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`route/mod.ts`)
- **WARN** `NS-S-4.types` — type 'PairedRouteHrefArgs' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`route/mod.ts`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'enumPathParamSchema' uses non-standard prefix 'enum' — consult STANDARDS § 4.1 (`route/contract.ts:279`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'pairRouteTargets' uses non-standard prefix 'pair' — consult STANDARDS § 4.1 (`route/contract.ts:444`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'bindRoutePattern' uses non-standard prefix 'bind' — consult STANDARDS § 4.1 (`route/contract.ts:524`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'classifyErrorType' uses non-standard prefix 'classify' — consult STANDARDS § 4.1 (`error/handler.ts:57`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'extractErrorData' uses non-standard prefix 'extract' — consult STANDARDS § 4.1 (`error/handler.ts:139`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'errorHandler' uses non-standard prefix 'error' — consult STANDARDS § 4.1 (`error/handler.ts:228`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'errorHandler' uses non-standard prefix 'error' — consult STANDARDS § 4.1 (`error/handler.ts:236`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'errorHandler' uses non-standard prefix 'error' — consult STANDARDS § 4.1 (`error/handler.ts:243`)

## 8. Code-quality verdict

**Small slow-type refactor (4 problems).** Add explicit return types on the published functions. Some entrypoints lack `@module` JSDoc — required for JSR scoring. Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.task`, `NS-S-3.barrel-only`.

## 9. Test coverage assessment

12 test files today. Audit them for: (a) names use behavioural sentences, (b) no imports from `src/internal/`, (c) no Jest globals, (d) port contracts shared via `./testing` entrypoint. Promote/rewrite as the plan's § 4 dictates.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
