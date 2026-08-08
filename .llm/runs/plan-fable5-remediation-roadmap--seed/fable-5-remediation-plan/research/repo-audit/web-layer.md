# Repo audit — web layer (`@netscript/fresh`, `@netscript/fresh-ui`)

Baseline: `plan/fable5-remediation-roadmap` == `origin/main` `fac9e339042c` (2026-08-08).
Method: `deno doc` on published subpaths + source reads + three executed repros. Every claim below
carries a file:line, a command output, or an issue/PR number.

---

## 0. Verdict summary

| Claim under test | Verdict | Anchor |
| --- | --- | --- |
| #1245.1 `initialDataUpdatedAt` absent from `IslandQueryOptions` | **FIXED** | `query-types.ts:136` (landed in PR #1265, `77c034c33`) |
| #1245.2 `createNetScriptQueryClient()` typed as narrow `QueryClientPort` | **FIXED** | returns `QueryClient` (`query-client-factory.ts:44-46`); `IslandQueryClient = QueryClient` (`query-types.ts:31`) |
| #1245.3 `IslandQueryResult` missing `isRefetching`/`isFetching` | **FIXED** | `query-types.ts:52,54` |
| #1245.4 `getIslandQueryClient()` `@throws` documents a guard that does not exist | **STILL OPEN** | `query-client.ts:26-27` vs body `34-50` — no `throw` |
| #1249.1 `controlProps()` not spreadable onto `<input>` | **CONFIRMED OPEN** | `prop-types.ts:166` + executed `deno check` TS2322 below |
| #1249.2 Zod 4 constraint derivation misses numbers + `.regex()` | **CONFIRMED OPEN** | `zod-constraints.ts:156-188,111-120` + executed repro below |
| #1255 `page.layer.delivery` span reports `blocking` for deferring regions | **CONFIRMED OPEN** | `runtime/mod.tsx:133` (`?? 'blocking'`) vs `:176` (`?? 'defer'`) — same function |
| #1278 `route-support.ts` cast | **CONFIRMED OPEN** | `route-support.ts:96` |
| #1278 `form/_internal/runtime-types.ts` (2 casts) | **STALE / already clean** | grep for `as unknown as`/`as any`/`quality-allow` returns 0 matches |

`#1245` is **~75 % resolved and should be rescoped, not re-implemented**. Its two live remnants are
a JSDoc lie and the `clientKey` asymmetry. `#1249` and `#1255` are fully live and reproduce exactly
as filed.

---

## 1. Package shape (what exists)

### `packages/fresh` — 15 published subpaths (`packages/fresh/deno.json:6-21`)

`.` (cache entries) · `./server` · `./desktop` · `./builders` · `./route` · `./defer` · `./form` ·
`./error` · `./streams` · `./ai` · `./ai/sandbox` · `./query` · `./interactive` · `./vite` ·
`./testing`.

### `packages/fresh-ui` — 6 subpaths (`packages/fresh-ui/deno.json:8-14`)

`.` · `./ai/render-ui` · `./desktop` · `./interactive` · `./primitives` · `./registry`.
Runtime-shipped: `DataGrid`, `Icon`, `Show`, `SrOnly`, `VisuallyHidden`, `cn`, toast helpers, and the
`interactive` compound namespaces (`Accordion`, `ActionMenu`, `Combobox`, `Dialog`, `Drawer`,
`Popover`, `Tabs`, `Tooltip`). Everything visual is **copy-registry**: 66 items in
`freshUiRegistryManifest` across 8 collections (`deno doc packages/fresh-ui/registry.ts`).

---

## 2. `definePage` builder — the canonical slice, EXISTS vs MISSING

Full method set (`builder/state.ts:44-186`), all present and typed:

`withResource` · `withResources` · `withParams` · `withPathParams` · `withSearchParams` ·
`withRoute` · `withRouteContract` · `withPolicy` · `withTelemetry` · `withLayer` · `withForm` ·
`withHandler` · `withLayout` · `withMeta` · `withHeader` (3 overloads) · `withStatus` ·
`withStreaming` · `createNav` · `build` (3 overloads).

`THasConfiguredRoute extends boolean` is threaded through every method so `build()` returns
`DefinePageRoutedDefinitionFor<TTypes>` vs `DefinePageDefinitionFor<TTypes>` conditionally
(`state.ts:178-181`). This is genuinely good phantom-state typing.

### 2.1 What the framework has vs what the scaffold demonstrates

| Builder capability | Framework | Exercised in generated app? |
| --- | --- | --- |
| `withRoute` + `withLayer` + `withLayout` | ✅ | ✅ `routes/examples/service/index.tsx.template:14-41` |
| `withPolicy` / `withTelemetry` | ✅ | ✅ same file `:16-17` |
| `delivery: 'defer'` + `partial` + `staleTime` + `staleReloadMode` | ✅ | ✅ same file `:30-38` |
| `withHandler` | ✅ | ✅ `health.tsx.template:23`, `examples/telemetry/index.tsx.template:13` |
| **`withResource` / `withResources`** | ✅ | ❌ **zero occurrences in `packages/cli/src/kernel/assets/app/`** |
| **`withForm`** | ✅ | ❌ **zero occurrences** — yet `agent-conventions.ts:133` instructs agents *"Use `withForm` for route-bound validated mutations"* with no local example |
| **`withParams` / `withPathParams` / `withSearchParams`** | ✅ | ❌ zero occurrences; no scaffolded route has a dynamic segment at all |
| **`withRouteContract`** (the inline Form-A authoring shape the Vite plugin exists to serve) | ✅ | ❌ zero occurrences |
| **`withStreaming`** | ✅ | ❌ zero occurrences |
| **`definePartial`** | ✅ | ❌ (only `defineStatsPartial`, `partials/examples/service-summary.tsx.template:5`) |

Verification: `rtk grep -rn "withResource\|withForm\|withParams\|withSearchParams\|withPathParams\|withRouteContract\|withStreaming\|definePartial" packages/cli/src/kernel/assets/app packages/cli/src/kernel/templates`
→ only `withHandler` hits.

**Gap class: docs/discovery failure + scaffold/generation failure.** The generated app is the
canonical teaching surface (`agent-conventions.ts:24-40` names it as such for coding agents), and it
demonstrates roughly half the builder. `withResource` — the surface with its own docs page
(`docs/site/web-layer/resources.md`) and 3 doc pages referencing it — has no in-repo generated
example. A user or agent copying the scaffold will never discover it.

### 2.2 Resources resolve **serially**; layers resolve in parallel

`runtime/handlers.ts:52-61` — `for (const descriptor of config.resources) { resourceStore[k] = await … }`.
`runtime/mod.tsx:105` — `await Promise.all(config.layers.map(…))`.

So `withResources({ a, b, c })` is three sequential round-trips, not three concurrent ones, while
three `withLayer` loaders are concurrent. `docs/site/web-layer/resources.md:224-231` documents the
ordering but not the serialization cost, and the asymmetry with layers is undocumented.
**Gap class: API/type-system seam (performance contract) + docs.**

### 2.3 Layer→partial binding is stringly typed

`catalog.ts:114-115`:
```ts
partial?: string | ((ctx: DefinePageLayerContextBase<TTypes, THasRoute>) => string);
partialName?: string | ((ctx: …) => string);
```
Nothing links these to `defineStatsPartial({ name })` or to a generated route reference. The
scaffold proves the hazard — `service/index.tsx.template:33-34` writes the URL
`'/partials/examples/{{serviceName}}/summary'` and the name `'{{serviceName}}-summary'` as raw
template strings that must match `partials/examples/service-summary.tsx.template:6,10` by
convention only. Every other route edge in this framework is contract-typed
(`createRouteReference`, `bindRoutePattern`); this one is not.
**Gap class: API/type-system seam.**

---

## 3. Typed route params + search params

**Exists and is strong.** `packages/fresh/src/application/route/mod.ts` exports a genuine
type-level route-pattern parser:

- `InferRoutePatternSegment` handles `[param]` → `{param: string}`, `[...rest]` →
  `{rest: readonly string[]}`, `[[...opt]]` → optional (`deno doc packages/fresh/src/application/route/mod.ts`).
- `defineRouteContract` / `bindRoutePattern` / `createRouteReference` / `PairedRouteTarget` (primary
  + partial route pairs with `partialSearch`, `partialPreserveSearchParams`).
- `paginationSearchSchema` returns a `PaginationSearchSchema` class that injects a computed
  `offset` on top of the Zod output (`search-params.ts:48-55, 87-90`).
- `fallback(schema, default)`, `enumPathParamSchema`, `defineEnumPathParam`.

Caveat: `PaginationSearchSchema` performs four internal `as` casts to reconcile
`PaginationSearchComputedInput` with `PaginationSearchOutput` (`search-params.ts:88, 89, 95, 96,
112, 113`). Internal, not user-visible, but it is the same conditional-type-equating problem as
`route-support.ts:96`.

---

## 4. Query surface, dehydration, cachedAt

### 4.1 What works

- `QueryIsland`, `getIslandQueryClient`, `resetIslandQueryClient`, `useQuery`/`useIslandQuery` (+
  suspense/infinite/mutation variants), `useLiveQuery`, `dehydrateQueryClient`,
  `hydrateFromDehydrated`, `HydrationBoundary`, `QueryHydrationScript`, `invalidateServerQueryCache`.
- `IslandQueryOptions.initialDataUpdatedAt` (`query-types.ts:136`) — the fix from PR #1265.
- `IslandQueryClient = QueryClient` (`query-types.ts:31`) — the dehydration recipe now type-checks
  with no bridge cast. `docs/site/web-layer/query-bridge.md:258-273` has been rewritten to the sound
  version; `rtk grep "as unknown as IslandQueryClient\|TS2551\|TS2345" docs/site/web-layer/` → 0 matches.
- Server tier: `invalidateServerQueryCache(key)` POSTs to `/_netscript/query-cache/invalidate`
  (`cache-invalidation/mod.ts:8,34-52`); `defineFreshApp` owns the endpoint.
- `cachedAt` helpers on the root subpath: `CacheEntryLike`, `hasAllCacheEntries`, `minCachedAt`,
  `projectCachedItemFromList` (`cache-entries/cache-entry.ts:4-52`).

### 4.2 Gap — the scaffold computes `cachedAt` and throws it away

`routes/examples/(_shared)/service-showcase.ts.template:67,77` computes and returns `cachedAt`.
The island (`(_islands)/ServiceShowcaseLab.tsx.template:44-49`) calls:
```tsx
useQuery<ServiceListData>({ queryKey, queryFn, initialData: props.initialList, staleTime: 15_000 })
```
— **no `initialDataUpdatedAt: props.cachedAt`**. `cachedAt` is used only as a display label at
`:105`. So the exact seam PR #1265 built to preserve server entry age is not exercised by the one
canonical example, and the generated app's first paint tells TanStack the snapshot is fresh-as-of-hydration.
**Gap class: scaffold/generation failure.** (Cheap fix; high symbolic value since it is the
advertised differentiator.)

### 4.3 Gap — `getIslandQueryClient()` JSDoc documents a guard that does not exist

`query-client.ts:26-27` declares `@throws {Error} If called during server-side rendering outside
island hydration.` The body (`:34-50`) is `if (!islandQueryClient) { islandQueryClient = new QueryClient(…) } return`.
There is no throw and no SSR detection. `deno doc` publishes this `@throws` to the reference site.
**Gap class: docs/discovery failure (published-surface lie).** Last live remnant of #1245.

### 4.4 Duplicate `useLiveQuery` with two incompatible result types

`@netscript/fresh/query` exports `useLiveQuery → IslandLiveQueryResult` (`hooks.ts:178`);
`@netscript/fresh/streams` exports `useLiveQuery → NetScriptLiveQueryResult` (`streams/mod.ts:55`).
Same name, same upstream (`@tanstack/react-db`), two package-owned wrapper result types.
`IslandLiveQueryResult` (`query-types.ts:216-225`) is loosely typed: `status?: string`,
`error?: unknown`, `details: Record<string, unknown>`.
**Gap class: API/type-system seam.** An island importing both subpaths gets a name collision, and
`details: Record<string, unknown>` is an escape hatch in a package that sells end-to-end typing.

---

## 5. `withForm` / forms — #1249 reproduced

### 5.1 Defect 1 — `controlProps()` is not element-assignable (CONFIRMED)

`packages/fresh/src/application/form/_internal/prop-types.ts:166` still declares
`readonly role?: string;`. Executed against the shipped `descriptor-types.ts` with the package's own
compiler options (`jsx: precompile`, `jsxImportSource: preact`):

```
TS2322 [ERROR]: Type '{ id: string; name: string; … }' is not assignable to type
'InputHTMLAttributes<HTMLInputElement>'.
  Types of property 'role' are incompatible.
    Type 'string | undefined' is not assignable to type 'Signalish<AriaRole | undefined>'.
  return <input {...field.controlProps({ type: 'email' })} />;
```

`role` is the only incompatible property. The package's own tests never spread `controlProps()`
(they read individual keys), which is why nothing catches it; `@netscript/fresh-ui` works around it
with `registry/components/ui/control-props.ts` re-narrowing helpers.
**Gap class: API/type-system seam.** Fix: narrow `ControlProps['role']` to the ARIA role union.

### 5.2 Defect 2 — Zod 4 constraint derivation (CONFIRMED, byte-identical to the issue)

`zod-constraints.ts` `applyNumberChecks` (`:156-188`) switches on `'min' | 'max' | 'multipleOf'`;
Zod 4.4.3 (`deno.json:248`) emits `greater_than` / `less_than` / `multiple_of`. `applyStringChecks`
handles `string_format` only when `format === 'url'` (`:116-120`), so `.regex()` — which Zod 4 emits
as `string_format` with `format: 'regex'` — produces no `pattern`.

Executed `createZodAdapter(schema).getConstraints()` on the issue's control schema:
```json
{
  "email":    { "required": true,  "minLength": 3, "maxLength": 120 },
  "slug":     { "required": true },
  "homepage": { "required": false, "pattern": "^https?:\\/\\/[^\\s/$.?#].[^\\s]*$" },
  "quantity": { "required": true },
  "tags":     { "required": true,  "minItems": 1, "maxItems": 4 },
  "tags[0]":  { "required": true,  "minLength": 2 }
}
```
`slug` gets no `pattern`; `quantity` gets no `min`/`max`/`step`. Strings/arrays only work because
`applyStringChecks` reads `schema.minLength`/`maxLength` directly (`:73-79`) and arrays happen to
emit `min_length`/`max_length` (which *were* added to the switch at `:88,96,135,143` — so the Zod 4
migration was done for arrays and forgotten for numbers).
Server validation still enforces every rule; the loss is presentational — and `formProps` sets
`noValidate: true`, so a user gets neither the attributes nor native enforcement.
**Gap class: runtime correctness (silent).**

### 5.3 What forms do have

`withForm(id, component, config)` (`state.ts:133-141`) creates layer + method handler + CSRF headers
+ metadata in one call, with `TSchema extends z.ZodTypeAny` and
`ComponentType<RuntimeFormState<z.input<TSchema>>>`. Underneath: a Standard-Schema adapter
(`schema-adapter/standard.ts`), field descriptors with ARIA data, collection descriptors with
add/remove/reorder/duplicate intent buttons, CSRF, idempotency, pagination, error normalization.
This is a genuinely deep surface — the two defects are at its outer boundary, which is exactly the
part users touch.

---

## 6. Defer / partials / streaming

`@netscript/fresh/defer` exports `Deferred`, `DeferPage`, `DeferComponent`,
`decideDeferClientAction`, `resolveDeferPolicy`, plus five telemetry span emitters. Layer delivery
supports `'blocking' | 'defer' | 'stream'` with `staleTime`, `staleReloadMode`, `shouldReload`,
`layerDeps` memoization (`catalog.ts:107-126`), and a real stream slot mechanism
(`runtime/mod.tsx:140-161`).

### #1255 CONFIRMED — with the contradiction inside one function

`runtime/mod.tsx:133` (span attribute):
```ts
'page.layer.delivery': descriptor.config.delivery ?? 'blocking',
```
`runtime/mod.tsx:176` (the actual behavioural decision, 43 lines later):
```ts
const shouldDefer = !shouldStream && !!descriptor.config.partial &&
  (descriptor.config.delivery ?? 'defer') === 'defer';
```
Two different defaults for the same undefined field. Any layer with a `partial` and no explicit
`delivery` **defers** while its span says `blocking`. `Deferred`'s own JSDoc also carries a caveat
worth tracking: *"In the current non-streaming Fresh runtime this behaves like a Suspense-ready
boundary and becomes fully progressive once streaming delivery lands."*
**Gap class: runtime correctness (observability).** Fix is a one-line default alignment plus a test.

---

## 7. `/design` routes and the generated design system

The scaffold emits a `(design)` route group with 12 files, ~2 300 lines
(`packages/cli/src/kernel/assets/app/routes/(design)/design/`): `_layout`, `index`, `tokens`,
`components`, `composition`, plus `(_components)/` views, `(_islands)/{FloatingSurfaceDemo,TokenClipboard}`,
and `(_shared)/{registry,tokens}.ts`. Token pipeline: `packages/fresh-ui/tokens/*.json` →
`scripts/build-tokens.ts` → `registry/theme/{tokens.css,theme-bridge.css,tokens.json}`, gated by
`tokens:check` (`packages/fresh-ui/deno.json:63-64`). `registry.generated.ts` is gated by root
`check:assets-barrel` (`deno.json:108`).

### 7.1 The `/design/components` gallery is drifted by 16 items with no gate

`(_shared)/registry.ts.template:1-4` self-describes as *"App-owned snapshot of the
@netscript/fresh-ui registry catalog … regenerate when the registry changes"* — a manual snapshot.
Executed comparison against the live manifest:

```
live manifest items: 66
snapshot items: 50 (declared total: 50, version '0.1.0')
in live, missing from /design snapshot:
  avatar, citation-chip, code-block, model-selector, tool-call-card, chart-block,
  donut, prompt-input, message, markdown, command-palette, search, dropzone,
  chat-render, mcp-ui-widget, render-ui
```

All 16 missing entries are the `ai` collection plus `donut`/`dropzone`. The generated app's design
gallery — the surface `agent-conventions.ts:36-39` points coding agents at as *"the live L0-L4
ownership and layout guide"* — shows 76 % of the registry and calls itself complete. No task or CI
step compares the two.
**Gap class: scaffold/generation failure (missing gate) + docs/discovery failure.**

---

## 8. `ui:add` — the advertised triad does not produce a data screen

`agent-conventions.ts:136-138` tells every coding agent working in a scaffolded app to use:
`netscript ui:add page <path> --island`, `netscript ui:add island <Name> --query`,
`netscript ui:add data-table`. The command's own help says it scaffolds *"the Fresh page + island +
query-loader triad for a data screen"* (`add-ui-command.ts:27`).

What `scaffoldUiPage(..., island: true)` actually emits (`web-scaffold.ts:27-39`):

1. `routes/<seg>/index.tsx` — `definePage().withRoute(…).withMeta(…).withLayer(name, () => <Island/>, () => ({})).withLayout(…)`. No loader, no resource, no query.
2. `routes/<seg>/(_islands)/<Name>Island.tsx` — `signalIslandTemplate` (`:66-68`): **a `useSignal(0)` counter button.** Not a query island.
3. `routes/<seg>/(_shared)/query-loaders.ts` — literally `export const queryLoaders = {} as const;`

And `scaffoldUiIsland(..., query: true)` (`:50-52`) emits
`<QueryIsland><div>Name</div></QueryIsland>` — a provider around a static div, no `useQuery`, no
query key, no factory.
**Gap class: scaffold/generation failure.** The one command the framework tells agents to reach for
first produces a counter and an empty object where a data screen was promised.

Secondary: `ui:add page --island` writes islands to `routes/<seg>/(_islands)/` while
`ui:add island` writes to top-level `islands/` — two conventions from one command.

Secondary: the declared public input type `UiAddCommandInput` (`add-ui-input.ts:1-7`) omits
`route`, `island`, and `query`; they are inline-typed in the action signature
(`add-ui-command.ts:53`). The exported public type under-describes the public CLI.

---

## 9. Route-local group conventions

Real and consistently used in the scaffold: `(_components)`, `(_islands)`, `(_shared)`, plus the
route group `(design)`. Present at `routes/(_components)/`, `routes/(_shared)/`,
`routes/examples/(_components|_islands|_shared)/`, `routes/(design)/design/(_components|_islands|_shared)/`.
Asserted in `route-templates_test.ts:104,125,144,219,264,288,345,458`. Explained to agents at
`agent-conventions.ts:27` and inside generated prose. This is a genuine, working, documented
convention — one of the stronger parts of the web layer.

---

## 10. Concrete scaffold bug: `appRoutes.crudExample` points at the wrong route

`packages/cli/src/kernel/assets/app/router.ts.template:33-34`:
```ts
serviceExample: routes.examples.serviceExample,
crudExample: routes.examples.serviceExample,   // ← same target
```
Meanwhile `routes/examples/crud.tsx.template:6` binds itself to `routes.examples.crud.$route`, and
the examples index card links via `href: appRoutes.crudExample.href()`
(`embedded.generated.ts:81`). So the generated app's "CRUD" card navigates to
`/examples/<serviceName>`, and `/examples/crud` is unreachable from the UI.

The bug is **enshrined in a test**: `route-templates_test.ts:76` asserts
`'crudExample: routes.examples.serviceExample,'`.
**Gap class: runtime correctness (generated output) — plus a test that locks it in.**

Adjacent product-expectation note: `routes/examples/crud.tsx.template:11-35` is named "CRUD" and
contains three hard-coded literal records with no create, update, or delete. Real CRUD lives in
`ServiceShowcaseLab`, which is reached from a different route.

---

## 11. Type soundness of the public surface (#1276 / #1278 scope)

### 11.1 Actual measured state in the web layer

`rtk grep -rn "as unknown as|quality-allow|deno-lint-ignore no-explicit-any|: any" packages/fresh/src packages/fresh-ui/{src,*.ts,*.tsx}` excluding tests → **exactly one hit**:

`packages/fresh/src/application/builders/define-page/builder/route-support.ts:96`
```ts
route: boundRoute as unknown as RuntimePageConfig<TRouteTypes, true>['route'], // quality-allow: DefinePageWithRouteContract preserves prior path/search output when either optional schema is omitted, but BoundRouteContract maps an omitted schema to EmptyRecord; TypeScript cannot equate those conditional states without presence-specific legacy builder overloads
```
This matches #1278 section B. The rationale is accurate and the fix is real work (presence-specific
overloads or a conditional-preserving `BoundRouteContract`), not a one-liner.

**#1278's claim of 2 casts in `form/_internal/runtime-types.ts` is stale** — that file has zero
matches for `as unknown as`, `as any`, or `quality-allow` today. The #1278 inventory (measured
2026-08-04) needs re-measuring before the epic is scheduled; at least one line item and most of
#1245 have already been fixed underneath it.

So: **the web layer is close to `as`-clean.** The soundness problems that remain are not casts —
they are *imprecise* public types.

### 11.2 The real soundness debt is loose types, not casts

| Symbol | Issue | Location |
| --- | --- | --- |
| `ControlProps['role']: string` | not assignable to Preact `AriaRole` — breaks the canonical spread | `prop-types.ts:166` |
| `IslandLiveQueryResult.details: Record<string, unknown>` | typed escape hatch on a live-query result | `query-types.ts:224` |
| `IslandLiveQueryResult.status?: string` / `error?: unknown` | optional + widened where TanStack has a union | `query-types.ts:220-222` |
| `QueryClientFilters` / `QueryClientSetOptions` `[key: string]: unknown` index signatures | accept anything | `packages/sdk/src/ports/query-client.ts:19,31` |
| `DehydratedState.{mutations,queries}: readonly unknown[]` | opaque | `query-types.ts:36-38` |
| `partial` / `partialName: string` | no link to the partial route it names | `catalog.ts:114-115` |
| `UiAddCommandInput` missing `route`/`island`/`query` | public type under-describes public CLI | `add-ui-input.ts:1-7` |

### 11.3 CI does not type-check or lint `packages/fresh-ui`

Root `deno task check` excludes it (`deno.json:34`, `--exclude "^(packages/(fresh-ui)|…)"`) and root
`deno task lint` excludes it too (`deno.json:143`, `^(packages/(fresh-ui|cli)|…)`).
`rtk grep -rn "fresh-ui" .github/` returns only CODEOWNERS, `labels.yml`, and issue templates — **no
workflow step runs `deno task --cwd packages/fresh-ui check`**. `ci.yml:222` runs the root `check`,
which skips it.

The package's own `check` task does pass today (verified locally, ~80 files incl. registry and
tests). So this is an uncovered surface, not a broken one — but a `deno doc`-published package with
66 registry items and 8 interactive namespaces is outside the type gate.
**Gap class: scaffold/generation failure (gate coverage).**

> Hygiene note: running `deno task --cwd packages/fresh-ui check` **mutates `packages/fresh-ui/deno.lock`**
> (this package carries its own lock). Restored via `git checkout -- packages/fresh-ui/deno.lock`.
> Any remediation slice that turns this gate on must decide the lock policy first.

---

## 12. Gap register (classified)

**runtime correctness**
1. `page.layer.delivery` span default `'blocking'` contradicts behavioural default `'defer'` — `runtime/mod.tsx:133` vs `:176`. (#1255)
2. Zod 4 number constraints (`min`/`max`/`step`) and `.regex()` `pattern` silently dropped — `zod-constraints.ts:156-188,111-120`. (#1249.2)
3. `appRoutes.crudExample` aliases `serviceExample`; `/examples/crud` unreachable, asserted by `route-templates_test.ts:76` — `router.ts.template:34`.

**API / type-system seam**
4. `ControlProps['role']: string` breaks `{...controlProps()}` spread — `prop-types.ts:166`. (#1249.1)
5. `route-support.ts:96` `as unknown as` for conditional route types — the only cast left in `packages/fresh`. (#1278 B)
6. Two `useLiveQuery` exports with two package-owned result types (`/query` vs `/streams`); `IslandLiveQueryResult.details: Record<string, unknown>`.
7. `partial` / `partialName` are bare strings with no link to `definePartial`'s `name` — `catalog.ts:114-115`.
8. `withResources` resolves serially while `withLayer` loaders resolve via `Promise.all` — `handlers.ts:52` vs `mod.tsx:105`; undocumented asymmetry.

**scaffold / generation failure**
9. `ui:add page --island` emits a counter island + `queryLoaders = {}` instead of the advertised data-screen triad — `web-scaffold.ts:27-39,66-68`; `ui:add island --query` emits a provider around a static div — `:50-52`.
10. `/design/components` snapshot lists 50 of 66 registry items (all 16 `ai`-collection items missing) with no sync gate — `(design)/design/(_shared)/registry.ts.template:24-28`.
11. Canonical island never passes `initialDataUpdatedAt: props.cachedAt` despite the loader computing it — `ServiceShowcaseLab.tsx.template:44-49` vs `service-showcase.ts.template:67,77`.
12. `packages/fresh-ui` excluded from root `check` and `lint` and absent from every workflow — `deno.json:34,143`.

**docs / discovery failure**
13. `getIslandQueryClient()` `@throws` documents a guard the body does not implement — `query-client.ts:26-27`. Published via `deno doc`. (#1245 remnant)
14. `withResource`, `withForm`, `withRouteContract`, `withSearchParams`/`withPathParams`, `withStreaming`, `definePartial` have zero examples in the generated app, which is the surface `agent-conventions.ts` designates as canonical for agents.
15. `agent-conventions.ts:133` instructs agents to use `withForm` and lists no local reference for it.

**product-expectation outside framework scope**
16. `routes/examples/crud.tsx` is a static three-record table named "CRUD"; the actual CRUD flow is in `ServiceShowcaseLab` on a different route. Naming/IA, not a framework defect.

---

## 13. Issue-hygiene recommendations for the remediation plan

- **#1245 → rescope to a 2-line issue.** Three of four sub-claims were closed by PR #1265
  (`77c034c33`, merged 2026-08-04, closing #1252). Remaining: the `getIslandQueryClient` `@throws`
  JSDoc, and the `clientKey` falsy-input asymmetry (`packages/sdk/src/query/query-factory.ts:174`,
  `packages/sdk/src/ports/query-factory.ts:98`). Leaving #1245 open at full scope will cause a
  remediation slice to re-implement work already merged.
- **#1249 → keep as-is, split into two slices.** Defect 1 is a one-line type narrowing plus a spread
  regression test. Defect 2 is a `readCheckKind` switch extension for `greater_than` / `less_than` /
  `multiple_of` (with `inclusive`) plus `string_format: 'regex'` → `_zod.def.pattern`, plus one
  constraint-map assertion covering all five cases. Both are `packages/fresh` source → WSL Codex.
- **#1255 → one-line fix, keep.** Align `mod.tsx:133`'s default to the `:176` decision (or compute
  the effective delivery once and use it for both).
- **#1278 → re-measure before scheduling.** Its inventory is 4 days stale: the `query-bridge.md`
  item is already checked, `runtime-types.ts` is clean, and `route-support.ts:96` is now the *only*
  cast left in the entire web layer. Section C (the regression gate) is the durable value; it should
  cover `packages/fresh-ui`, which no gate covers today.
- **New issues worth filing** (none found on the board): the `crudExample` router aliasing bug (#10
  above, with its test), the `ui:add` triad emitting a counter, the `/design` 50-vs-66 registry
  drift + missing gate, and the `packages/fresh-ui` CI check/lint exclusion.

---

## 14. Commands used (reproducible)

```bash
deno doc packages/fresh/src/application/query/mod.ts
deno doc packages/fresh/src/application/route/mod.ts
deno doc packages/fresh-ui/registry.ts
deno doc packages/fresh-ui/{mod.ts,primitives.tsx,interactive.ts}
deno run --allow-all <repro>       # zod constraint map, §5.2
deno check --config <fixture> <spread.tsx>   # controlProps spread, §5.1
deno eval  # live manifest 66 vs /design snapshot 50, §7.1
rtk grep -rn "as unknown as|quality-allow|: any" packages/fresh/src packages/fresh-ui/src
rtk grep -rn "withResource|withForm|withParams|withRouteContract|withStreaming" packages/cli/src/kernel/assets/app
gh issue view 1245 1249 1255 1276 1278 ; gh pr view 1265
```

Repro scratch files were written under `.llm/tmp/` and deleted; `packages/fresh-ui/deno.lock` was
mutated by the package's own `check` task and restored with `git checkout --`. Working tree carries
no source modifications from this audit.
