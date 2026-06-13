# 5d2 builders — Design: `definePage` DSL decomposition

> Run: `feat-package-quality-wave5-apps--5d2-builders` · Branch: `feat/package-quality-wave5-apps--5d2-builders` · PR #35  
> Phase: PLAN (Design checkpoint) · Zero implementation.

## Authority

- Umbrella plan: `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` (binding).
- Handover: `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d2-plan.md`.
- Phase-1 research: `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/research.md`.
- Archetype: A3 Runtime/Behavior + SCOPE-frontend + A4-Browser obligation; builder concerns use A4 DSL/Builder vocabulary.

## Status

Design checkpoint complete — all seven required sections populated.

## 1. Decomposition target

### 1.1 Current file topology

```text
packages/fresh/builders/
  mod.ts                         # public barrel (41.4K)
  define-page/
    mod.ts                       # sub-barrel
    builder.tsx                  # 38.4K
    types.ts                     # 22.4K
    navigation.tsx               # 20.6K
    runtime.tsx                  # 18.4K
    search-params.ts             # 4.6K
    internal.ts                  # 3.2K
  define-partial.tsx             # 3.2K
  define-page.test.tsx           # 45.8K
  define-partial.test.tsx        # 5.7K
```

### 1.2 Proposed folder topology

```text
packages/fresh/builders/
  mod.ts                         # thin barrel, same exports (<2K)
  define-page/
    mod.ts                       # re-export barrel (<1K)
    types.ts                     # public type catalog only (<18K)
    builder/
      mod.ts                     # `definePage` overload set (<16K)
      state.ts                   # builder state interfaces + type helpers (<14K)
      factory.ts                 # definition factory / `build()` (<14K)
      validators.ts              # option/runtime validation helpers (<12K)
    runtime/
      mod.ts                     # runtime assembly exports (<1K)
      context.ts                 # runtime context helpers (<10K)
      render.tsx                 # render-to-stream / response assembly (<10K)
      handlers.ts                # GET/POST/loader/action wiring (<10K)
    navigation/
      mod.ts                     # public navigation barrel (<1K)
      hooks.ts                   # useCurrentRoute / usePage* hooks (<12K)
      link.tsx                   # Link, getLinkProps (<10K)
      context.ts                 # wrapWithNavigationContext / route context (<10K)
    search-params.ts             # kept; small, cohesive
    internal.ts                  # non-public helpers, stays internal
  define-partial.tsx             # kept (small enough)
  define-page.test.tsx           # split along seams below
  define-page/
    builder.test.tsx             # builder chain tests (from define-page.test.tsx)
    runtime.test.tsx             # pipeline / handler tests
    navigation.test.tsx          # hook / link tests
    search-params.test.tsx       # pagination schema tests
  define-partial.test.tsx        # kept
```

### 1.3 Public-surface contract

All export specifiers and public type names from `research.md` §3 are retained.  
No new public symbols introduced. No public symbol removed.

The builders barrel (`packages/fresh/builders/mod.ts`) remains the sole public entry point
for consumers; `define-page/mod.ts` remains a sub-barrel used only by the parent barrel and
internal tests.

### 1.4 File-cap targets

Apply F-1 layer cap (≤20K source, aspirational ≤16K):

| Current file | Size | Target file(s) | Target size |
| ------------ | ---- | -------------- | ----------- |
| `mod.ts` | 41.4K | `mod.ts` (thin barrel) | <2K |
| `builder.tsx` | 38.4K | `builder/mod.ts`, `builder/state.ts`, `builder/factory.ts`, `builder/validators.ts` | each <16K |
| `types.ts` | 22.4K | `types.ts` (trimmed to pure types) + move helper logic into `builder/state.ts` | <18K |
| `navigation.tsx` | 20.6K | `navigation/hooks.ts`, `navigation/link.tsx`, `navigation/context.ts` | each <12K |
| `runtime.tsx` | 18.4K | `runtime/context.ts`, `runtime/render.tsx`, `runtime/handlers.ts` | each <10K |
| `define-page.test.tsx` | 45.8K | `builder.test.tsx`, `runtime.test.tsx`, `navigation.test.tsx`, `search-params.test.tsx` | each <18K |

## 2. DSL market bar

### 2.1 TanStack Start

TanStack Start exposes `createRoute`, `getRouteApi`, and `createFileRoute`. Data flows through
`loader`/`routeOptions.loader`; search params are typed via `validateSearch`; pending UI is driven
by `PendingComponent`; errors/redirects use `errorComponent` and `redirect`.

`definePage` matches TanStack Start in typed search params and route-target inference, but currently
lacks:
- a first-class `pending` component slot (workaround: deferred layers + fallback slots),
- a route-api object for non-render consumers (workaround: export the typed `routeNav`),
- automatic stale-while-revalidate revalidation on navigation (deferred today, RFC deferred).

Verdict: in-scope polish adds a typed `pending` fallback to layer config; route-api and SWR are RFC deferred.

### 2.2 Next.js App Router

Next.js App Router uses `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, and `generateMetadata`.
Data fetching is colocated in server components; server actions replace form handlers.

`definePage` matches Next.js in colocated metadata/header resolver and nested layout support, but
differs by keeping data loaders explicit and server actions outside the component tree. The explicit
loader model is a deliberate design choice (A3 — simple over easy), so no gap is treated as a defect.

Verdict: no change required; the explicit loader model is retained.

### 2.3 Remix / React Router data APIs

Remix uses `loader`/`action` exports, `useLoaderData`, `useActionData`, `<Form>`, and `<Meta>` /
`<Links>` functions. Nested routing is directory-based.

`definePage` matches Remix in handler exports, form action integration, and typed navigation, but
Remix's `<Form>` component is replaced by Fresh 2's partial + form primitives. The `Link`/`getLinkProps`
API already covers typed navigation.

Verdict: no DSL change; confirm parity through browser fixtures.

### 2.4 DX gaps and verdicts

| Gap | In-scope for 5d2 | RFC / deferred |
| --- | ---------------- | -------------- |
| Typed search params | Already present | — |
| Typed navigation (`Link`, `getLinkProps`) | Already present | — |
| Pending UI slot | Add `pending` to `DefinePageLayerConfig` | — |
| Error/redirect ergonomics | Use 5d1 taxonomy via `DefinePageRenderContext` | 5d1 binding |
| Route API object for non-render code | Not added | RFC deferred |
| SWR/revalidation policy | Not added | 5d4 streaming / RFC deferred |

## 3. Island / partial bridge

### 3.1 Serialization seam

`runtime/render.tsx` assembles the page response. During SSR it builds a `DefinePageLayoutContext`
that carries:
- resolved path/search params,
- layer data map,
- route navigation helpers,
- slot registry.

This context is passed to the root JSX element via `wrapWithNavigationContext`. Islands below the
navigation context receive serialized props only (per Fresh 2 rules: primitives, plain objects,
JSX elements, signals). The hooks `useCurrentRoute`, `usePagePath`, `usePageSearch`, and
`usePageLayerData` read from the same context on both server and client.

### 3.2 Query bridge hook-in (5d6)

`runtime/context.ts` exposes a stable `DefinePageRuntimeContext` shape. 5d6 will extend this context
with a query-client hydration key without changing the builder API. The seam is:
- `runtime/context.ts` owns the context object,
- `runtime/render.tsx` serializes it into the HTML shell,
- islands call `usePageLayerData()` or a future `usePageQuery()` to hydrate.

No query-client code is added in 5d2; the context shape is sized to accept an optional
`queryClientState?: unknown` field later.

### 3.3 Partial route support

`define-partial.tsx` produces Fresh 2 partial routes. `definePage` layer `partial` and `partialName`
options already emit `f-partial` links. After decomposition, partial wiring stays in
`runtime/handlers.ts`; link generation stays in `navigation/link.tsx`.

## 4. RFC 14 protection seams

RFC 14 (unified mode) anticipates a non-Fresh adapter for `definePage` definitions. The following
builder options would break under a non-Fresh adapter and are therefore wrapped behind adapter-agnostic
contracts:

| Builder option | Fresh-specific assumption | Protection seam |
| -------------- | ------------------------- | --------------- |
| `render(body, init)` callback | Uses Fresh `render` helper | Kept as `DefinePageRenderContext` method; adapter provides equivalent |
| `partial` / `partialName` | Fresh 2 `f-partial` | Option names are generic; adapter ignores or maps them |
| `fallback` JSX | Preact component | JSX type is portable; adapter renders with its own JSX |
| `DeferPage` / `Deferred` injection | Fresh defer primitives | Kept inside `runtime/render.tsx`; adapter replaces this module |
| `useCurrentRoute` etc. | Preact context | Navigation hooks remain Preact-only; a future RFC 14 adapter exposes the same context contract |

Verdict: no RFC 14 implementation in 5d2. The decomposition isolates Fresh-specific code in
`runtime/render.tsx` and `navigation/context.ts` so a future adapter can replace those files without
touching `builder/` or `types.ts`.

## 5. Browser validation strategy

Browser validation uses `apps/playground` fixture routes. The following routes prove the builder
pipeline after decomposition:

| Route | Proves |
| ----- | ------ |
| `/playground/builders/static-page` | SSR render, metadata/header resolver, no path/search params |
| `/playground/builders/routed-page/[id]` | Typed path params, loader invocation, `usePagePath` |
| `/playground/builders/search-page?sort=asc` | Typed search params, `usePageSearch`, pagination schema |
| `/playground/builders/layer-page` | Layer loader + deferred fallback + pending UI |
| `/playground/builders/form-page` | POST handler, form state round-trip, CSRF, error taxonomy (5d1) |
| `/playground/builders/partial-page` | Fresh partial navigation, `Link`, `getLinkProps` |

Each route exercises a single seam; together they cover SSR, navigation, pending states, and error
boundaries. Tests live in `apps/playground/e2e/` if the repo has Playwright, otherwise as manual
verification steps recorded in the slice gate evidence.

## 6. Test decomposition

`define-page.test.tsx` (46K) is split along the same seams as source:

| Source seam | Test file | Contents |
| ----------- | --------- | -------- |
| `builder/` | `define-page/builder.test.tsx` | Builder chain: `withRoute`, `withParams`, `withSearch`, `withLayer`, `withForm`, `build()` |
| `runtime/` | `define-page/runtime.test.tsx` | Pipeline execution, handler wiring, response assembly, deferred layers |
| `navigation/` | `define-page/navigation.test.tsx` | `useCurrentRoute`, `Link`, `getLinkProps`, navigation context |
| `search-params.ts` | `define-page/search-params.test.tsx` | Pagination schema, fallback values |

Original tests are moved, not duplicated. Test names are prefixed by seam (`[builder]`, `[runtime]`,
`[navigation]`, `[search-params]`). Existing `define-partial.test.tsx` is retained unchanged.

## 7. Risk and trade-offs

| Risk | Mitigation |
| ---- | ---------- |
| Public surface accidentally changes during moves | Slice 1 creates a surface snapshot test; every subsequent slice runs it. |
| Private-type-refs reappear after re-export moves | `deno doc --lint` is the proving gate for every barrel-changing slice. |
| Form-package leak fix touches 5d5 scope | 5d2 makes form types public with JSDoc only (no behavior change); drift entry D-5d2-1 records the cross-unit touch. |
| Runtime response assembly breaks during split | `runtime.test.tsx` covers pipeline execution; slice 10 verifies before further decomposition. |
| Fixture browser tests flaky in CI | Routes are deterministic; no external services. If Playwright is unavailable, record manual gate evidence. |
| Merge conflicts with 5d1 support branch | Implementation waits for 5d1 merge; plan states 5d1 dependencies explicitly. |
| Too many files trigger F-16 / F-18 sub-barrel lint | New folders are role-named; each sub-barrel has a single `mod.ts`; cardinality stays within archetype-4 minimum shape. |
