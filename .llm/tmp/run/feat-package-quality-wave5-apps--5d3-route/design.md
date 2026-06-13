# 5d3 route — design (PLAN phase)

Status: PROPOSED. Implementation deferred until PLAN-EVAL passes.

Authority: `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` (binding umbrella),
`AGENTS.md`, `netscript-harness` SKILL, `archetype-gate-matrix.md`, `jsr-audit` SKILL,
`deno-fresh` SKILL, `aspire` SKILL.

Research inputs reused without re-measurement:
`.llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/research.md`,
`deno-doc-lint.txt` (180 combined doc-lint errors),
`deno-doc-lint-raw.txt`,
`deno-doc-route.json`,
`dry-run-raw.txt`.

---

## Measure-first baseline

Measured from committed artifacts in `.llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/`.
No re-measurement was performed.

| Metric | Value | Source |
|--------|-------|--------|
| `route/mod.ts` size | **755 LOC** | `research.md` §1; direct `wc -l` |
| `route/contract.ts` size | **764 LOC** | `research.md` §1; direct `wc -l` |
| `route/manifest.ts` size | **534 LOC** | `research.md` §1; direct `wc -l` |
| Combined `deno doc --lint` errors | **180** | `deno-doc-lint.txt` |
|   · missing-jsdoc | **106** | `deno-doc-lint.txt` |
|   · private-type-ref | **74** | `deno-doc-lint.txt` |
| `deno check --unstable-kv` root | Excludes `packages/fresh`; use scoped check inside `packages/fresh/` | `research.md` §1 |
| `deno publish --dry-run` | 62 problems package-wide; route-specific subset not isolated in artifact; package-level `excluded-module` errors are out of 5d3 scope | `dry-run-raw.txt` |

Design implication: all three route files exceed the F-1 cap (500 LOC, fail over 800). They must be
**decomposed** without changing public export specifiers or type names. The doc-lint baseline of
180 errors must be retired to 0 by the end of implementation.

---

## Decomposition target

Goal: every file in `packages/fresh/route/` ≤ 500 LOC, with a clear role-named decomposition and
no logic change to exported behavior. Public export specifiers from `./route` remain exactly as
the umbrella locked them (`mod.ts`, `contract.ts`, `manifest.ts` re-export the same symbols).

Proposed end-state folder:

```text
packages/fresh/route/
  mod.ts                        # thin public barrel (≤500 LOC)
  contract.ts                   # defineRouteContract + RouteReference + enum schema (≤500 LOC)
  types.ts                      # shared schema types, infer helpers, branded href (≤300 LOC)
  navigation.ts                 # typed Link, getLinkProps, useCurrentPath/Search/Route (≤350 LOC)
  manifest.ts                   # discovery/generation entrypoint (≤500 LOC)
  manifest-types.ts             # manifest options/result interfaces (≤250 LOC)
  _internal/
    path-pattern.ts             # StripLeadingSlash, InferRoutePattern*, segment helpers
    schema-helpers.ts           # SchemaLike, fallback, paginationSearchSchema internals
    constants.ts                # ROUTE_FILE_EXTENSIONS, IGNORED_DIRECTORIES
```

Rationale for decomposition:

- `types.ts` isolates the schema vocabulary (`PathParamSchema`, `SearchParamSchema`,
  `ValidatedRouteHref`, `SchemaParse*`) that both `contract.ts` and `navigation.ts` need. This is
  the single place to clear the majority of the 74 `private-type-ref` errors by making the helper
  types public and JSDoc'd.
- `navigation.ts` takes the link/hook surface that currently lives in
  `builders/define-page/navigation.tsx` but is re-exported through `route/contract.ts`. Moving it
  to a dedicated route file removes a cross-direction builder dependency and makes the public
  surface self-contained.
- `manifest-types.ts` separates the large option/result interfaces from the generator logic in
  `manifest.ts`, mirroring the `ports/` + `application/` vocabulary from package-quality lessons.
- `_internal/` holds non-public type helpers (`StripLeadingSlash`, segment inference, schema-like
  adapters) that public types reference. Public types may reference `_internal` helpers only
  through re-exported public aliases; direct private references are forbidden.

Public-surface verdict: the current `route/mod.ts` exports 49 symbols (deno-doc). The plan keeps
all 49 symbols available, adds a small number of required re-export aliases to clear
`private-type-ref`, and does not introduce new public behavior. The umbrella's F-16 lock (12
entrypoints, unchanged) is respected.

---

## E2E typesafety chain

The route contract is the north-star type artifact for the entire 5d wave. One declaration must
type the server handler, the SDK client, and the island/link surface.

1. **Declaration**

   ```ts
   // routes/blog/[slug].contract.ts
   import { defineRouteContract, enumPathParamSchema } from '@netscript/fresh/route';

   export const blogPostContract = defineRouteContract({
     pattern: '/blog/[slug]',
     pathSchema: { slug: enumPathParamSchema('slug', ['hello', 'world'] as const) },
     searchSchema: { page: z.coerce.number().optional() },
   });
   ```

2. **Server handler**

   ```ts
   // routes/blog/[slug].tsx
   import { define } from '@/utils/state.ts';
   import { blogPostContract } from './[slug].contract.ts';

   export const handler = define.handlers((ctx) => {
     const { slug } = blogPostContract.path.parse(ctx.params);
     const { page } = blogPostContract.search.parse(searchParamsToInput(ctx.url.searchParams));
     return { data: { slug, page } };
   });
   ```

3. **SDK client (5b)**

   The same contract object carries typed `path` and `search` schemas that a future 5b SDK client
   can serialize into `fetch` calls. The route contract is intentionally structurally compatible
   with the `ContractSchema<T>` port in `@netscript/contracts` (`parse` / `safeParse` /
   `optional` / `describe`) so that service and route contracts share vocabulary.

4. **Island / link props (5d2 builders, 5d6 query)**

   ```tsx
   import { Link, href } from '@netscript/fresh/route';
   <Link to={blogPostContract} params={{ slug: 'hello' }} search={{ page: 2 }} />;
   ```

   The `Link` component and `href` helper use the same `$types` carrier that the server handler
   uses, giving a single source of truth for valid path/search shapes.

Design note: the chain depends on a stable `$types` carrier (`RouteContractTypeCarrier`) and the
`InferRouteContractPath` / `InferRouteContractSearch` helpers. These are already exported but lack
JSDoc and leak private helper types. The decomposition makes them first-class public types.

---

## Manifest vs Fresh 2 fsRoutes

Fresh 2 discovers routes at runtime via `fsRoutes(app, { loadRoute, loadIsland })`. NetScript's
`manifest.ts` does **not** replace `fsRoutes`; it adds three capabilities on top:

| Capability | Fresh 2 `fsRoutes` | NetScript `route/manifest.ts` |
|------------|--------------------|-------------------------------|
| File-system route discovery | Yes | Yes (mirrors via `@std/path` walk) |
| Runtime registration | Yes | No — delegates to `fsRoutes` |
| Contract sidecar discovery (`*.contract.ts` sibling) | No | Yes (`routeContractImportPath`) |
| Generated route-key tree for typed navigation | No | Yes (`routeKeyPath`, manifest module) |
| Telemetry route-name metadata | No | Planned: attach `route.name` to Fresh route config |
| Build-time static manifest for codegen / IDE | No | Yes (`renderNetScriptRouteManifest`) |

Design verdict: keep `manifest.ts` as a **thin, opt-in generator** that produces a static module
consumed by `define-fresh-app.ts` and by typed link helpers. The generator must remain wrappable
around `fsRoutes` (umbrella doctrine: "wrap, do not reinvent"). Any future manifest feature that
overlaps with Fresh 2 core must first be evaluated against upstream contribution; NetScript adds
only contract-awareness and telemetry naming.

---

## oRPC / contracts alignment

`@netscript/contracts` exposes a minimal `ContractSchema<TOutput>` port (`parse`, `safeParse`,
`optional`, `describe`) and the `baseContract` oRPC primitive with NetScript's standard error map.
The route contract currently uses Zod directly and an internal `SchemaLike` type from
`builders/define-page/types.ts`.

PLAN verdict (not implementation):

- The route schema vocabulary (`PathParamSchema`, `SearchParamSchema`) should be redefined in
  terms of `ContractSchema<T>` from `@netscript/contracts`. This lets route params be reused in
  oRPC service contracts without a second vocabulary.
- Zod remains the runtime implementation, but the **public type contract** is the NetScript
  `ContractSchema` port. Internal adapters (`schema-helpers.ts`) bridge Zod-specific methods that
  the port does not require.
- No oRPC procedure migration is in scope for 5d3; the alignment is type-level only and paves the
  way for a later unified "service + route" contract layer.

Risk: `ContractSchema<T>` in `@netscript/contracts` is intentionally minimal. Zod 4 features used
by `enumPathParamSchema` and pagination helpers may need thin adapter wrappers. Those adapters live
in `_internal/schema-helpers.ts`, not the public surface.

---

## Runtime validation design

Archetype 3 requires runtime/Aspire validation. 5d3 must prove that the route contract + manifest
work in a real Fresh 2 app.

### Validation target

A fixture route in `apps/playground` (or a dedicated `tests/_fixtures/route-runtime` app):

1. Defines a route contract sidecar.
2. Registers the route through `manifest.ts` / `define-fresh-app.ts`.
3. Boots the app via Aspire (or `deno task dev` smoke when Aspire is unavailable).
4. Asserts:
   - Valid path/search params parse correctly.
   - Invalid path params throw a typed, taxonomy-aligned error (reuse 5d1 error taxonomy).
   - Invalid search params surface as search-schema failures, not 500s.
5. AbortSignal propagation:
   - Long-running handlers respect `ctx.req.signal`.
   - Manifest file watcher respects an `AbortSignal` in dev mode.

### Test placement

- Unit tests: `packages/fresh/route/tests/` for pure functions (`bindRoutePattern`,
  `discoverNetScriptRoutes`, `enumPathParamSchema.safeParse`).
- Runtime/Aspire gate: `packages/fresh/tests/_fixtures/route-runtime/` or extend
  `apps/playground` with a contract-backed route. The choice is deferred until 5d2 lands so we
  reuse the same fixture conventions.

### Lifecycle / cleanup

- Manifest generator must not leak file watchers: `AbortSignal` is threaded through discovery and
  watch helpers.
- Route handler contract violations are **not** caught silently; they throw, and Fresh's `_error.tsx`
  (5d1) normalizes them.

---

## Risks / open questions

| Risk | Severity | Mitigation in plan |
|------|----------|--------------------|
| Decomposition changes relative import paths inside `route/` | Medium | Slice-by-slice moves with `git mv`; `mod.ts` re-exports preserve public surface; consumer-import gate catches breakage |
| 5d2 builders refactor may move `navigation.tsx` / `types.ts` | Medium | Route slice 4 imports from public builder surface only; any 5d2 rename is a dependency to merge before 5d3 implementation begins |
| `private-type-ref` spans `builders/define-page/navigation.tsx` | High | Re-export needed builder types through `route/types.ts` / `route/navigation.ts` public surface, or retire the cross-dependency entirely by moving link helpers into route |
| Manifest codegen touches filesystem | Medium | Runtime tests use temp directories; Aspire fixture uses isolated app root; cleanup is part of the gate |
| Zod 4 adapter surface vs `ContractSchema` port mismatch | Low | Keep adapters internal; public surface exposes only the port shape |
| Package-wide `excluded-module` / slow-type errors outside route | Medium | Out of 5d3 scope; noted in side-effect ledger and deferred to umbrella/5d6 |

Open questions for supervisor / PLAN-EVAL:

1. Should the runtime/Aspire proof live in `apps/playground` or a dedicated test fixture under
   `packages/fresh/tests/_fixtures/`? (Preferred: reuse playground if 5d2 establishes it.)
2. Is moving `Link` / `getLinkProps` from `builders/define-page/navigation.tsx` into
   `route/navigation.ts` acceptable to 5d2? If 5d2 keeps them, route must re-export them and clear
   `private-type-ref` via public type re-exports.
3. Do we align route schemas to `ContractSchema` now (type-only), or keep Zod-only public types
   and align later? (Recommended: type-align now to avoid a second breaking change.)
