---
layout: layouts/base.vto
title: Routing and route contracts
templateEngine: [vento, md]
order: 6
---

# Routing and route contracts

This page covers the routing surface of `@netscript/fresh/route`. A **route contract** owns a
route's path and search schemas, independent of any URL. Binding it to a pattern produces a
**route reference**: one object that parses a request *and* builds hrefs from the same schemas. With
the Vite plugin, a generated `routes` tree derived from the filesystem lets a moved route file
invalidate the call sites that use that tree.

A route contract is distinct from a service's versioned API contract. In a database-backed product,
the API shape begins at the [generated `@database/zod` step](/data-persistence/database/#generated-schemas-feed-public-contracts),
is narrowed into the [public contract](/explanation/contracts/#where-the-public-shape-begins), and
only then reaches a page whose route contract parses path and search values.

## Compared with bare Fresh

Fresh 2 hands you raw request values. A paginated, filtered list route looks like this:

```tsx
// routes/orders/[status].tsx — bare Fresh
export const handler = define.handlers({
  async GET(ctx) {
    const status = ctx.params.status; // string — any string
    if (status !== 'open' && status !== 'closed') return new Response('Not found', { status: 404 });

    const rawPage = ctx.url.searchParams.get('page'); // string | null
    const page = Math.max(Number.parseInt(rawPage ?? '1', 10) || 1, 1);
    const rawLimit = ctx.url.searchParams.get('limit');
    const limit = Math.min(Math.max(Number.parseInt(rawLimit ?? '25', 10) || 25, 1), 100);
    const offset = (page - 1) * limit;

    return { data: await listOrders({ status, limit, offset }) };
  },
});
```

Every link back into that route is a string:

```tsx
<a href={`/orders/${status}?page=${page + 1}&limit=${limit}`}>Next</a>
```

The contract removes three costs:

- **Parsing drifts.** `page`, `limit` and `offset` are re-derived in every route that paginates, and
  two routes can clamp `limit` differently.
- **`string` is not a type.** `ctx.params.status` is a `string` whether or not the segment is one of
  two legal values, so each handler narrows it by hand.
- **Links are unverified.** The template literal has no relationship to
  `routes/orders/[status].tsx`. Rename the file, move it into a different URL-bearing directory or add
  a segment, and every link still compiles and then 404s. (A Fresh route group alone does not change
  the URL; `(group)` directories are dropped from the path.)

## The mechanism: contract, reference, generated tree

Three objects, each with one job.

`defineRouteContract({ pathSchema?, searchSchema? })` owns the **schemas** and knows no URL. Both
options are optional; a contract with neither parses to `{}`. Define only the schemas a route reads.
The contract returns `parsePath` / `safeParsePath` / `parseSearch` / `safeParseSearch`, a
`createNav(pattern)` helper, and `bind(pattern)`.

`bind(pattern)`, or the function form `bindRoutePattern(contract, pattern, metadata?)`, attaches the
contract to a concrete Fresh pattern and returns a **route reference**: the schemas, the
`routePattern` and the four parse helpers, plus `href()`, `getLinkProps()`, a bound `Link` component,
`nav` and `withPartial()`. `createRouteReference(pattern)` produces the same reference shape without
a contract, inferring path params from the pattern.

The generated `routes` tree binds discovered route files to those references. Call sites that use the
tree share generated patterns; separately authored string-literal references still need manual
updates.

```ts
import { defineRouteContract, enumPathParamSchema, paginationSearchSchema } from '@netscript/fresh/route';

const ordersContract = defineRouteContract({
  pathSchema: enumPathParamSchema('status', ['open', 'closed']),
  searchSchema: paginationSearchSchema({ defaultLimit: 25 }),
});

const ordersRoute = ordersContract.bind('/orders/[status]');

const state = ordersRoute.parseSearch(new URLSearchParams('page=2'));
// state.page === 2, state.limit === 25, state.offset === 25
```

One contract can bind to several patterns. A list route and its partial share a search schema;
binding twice gives two references over one definition.

`bind()` passes no metadata. When a reference needs the manifest fields `$id` and `$kind`, use the
`bindRoutePattern(contract, pattern, { id, kind })` function form, which is what the generator
emits.

## Pagination search schema

`paginationSearchSchema()` is a **total** parse of four fields. Every base field is wrapped in a Zod
`catch`, so a hostile query string produces defaults instead of an error:

| Field | Parsed as | Falls back to |
| --- | --- | --- |
| `page` | coerced integer, min 1 | `1` |
| `limit` | coerced integer, min 1 | `options.defaultLimit ?? 10` |
| `sortBy` | non-empty string | `options.defaultSort ?? ''` |
| `sortOrder` | `'asc' \| 'desc'` | `options.defaultOrder ?? 'desc'` |

`offset` is then computed and appended: `Math.max(page - 1, 0) * limit`. It is derived output, not
a field you can send, so a loader can hand it straight to a repository.

```ts
const listSearch = paginationSearchSchema({ defaultLimit: 25 });

listSearch.parse({ page: 'banana', limit: '-4', sortOrder: 'sideways' });
// { page: 1, limit: 25, sortBy: '', sortOrder: 'desc', offset: 0 }

listSearch.parse({ page: '3', limit: '50' });
// { page: 3, limit: 50, sortBy: '', sortOrder: 'desc', offset: 100 }
```

Each field takes the **first** value when a param repeats, so `?page=2&page=9` parses as `page: 2`
instead of failing on an array.

`extend(shape)` adds your own fields, and those are *not* caught automatically: an extended
`z.enum([...])` fed a bad value fails the whole parse. `fallback(schema, value)` is
`schema.catch(value)`; it restores the never-throws property to the fields you added.

```ts
import { fallback, paginationSearchSchema } from '@netscript/fresh/route';
import { z } from 'zod';

// Fails on ?status=nope — safeParse returns { success: false }.
const brittle = paginationSearchSchema().extend({ status: z.enum(['open', 'closed']) });

// Parses ?status=nope as status: 'open'.
const total = paginationSearchSchema().extend({
  status: fallback(z.enum(['open', 'closed']), 'open'),
});
```

A filter that should degrade to a default belongs in `fallback`. A param whose wrong value should
be a 400 belongs in a bare schema, with `safeParseSearch` handling the failure.

## Enum segments

Path params get two helpers, and they are not interchangeable.

`enumPathParamSchema(name, values)` is a `pathSchema` for a contract. It validates one segment, with
this failure message:

```text
Expected route param "status" to be one of: open, closed
```

**It also narrows the parsed path to that one key.** Its success data is `{ [name]: value }` and
nothing else, so on `/orders/[status]/[id]` a contract using it alone parses `status` and drops
`id`. For a multi-segment route, write an object schema covering every param.

`defineEnumPathParam(name, values)` is the standalone form. It carries `paramName`, `values`, the
same `schema`, and a `parse(value)` that takes the bare segment string and returns the typed value or
`null`, without throwing:

```ts
const orderStatus = defineEnumPathParam('status', ['open', 'closed']);

orderStatus.parse('open'); // 'open'
orderStatus.parse('archived'); // null
```

Use it in a middleware, a guard, or anywhere the segment is checked outside a page's own parse, and
reuse `orderStatus.schema` as the contract's `pathSchema` so both agree on one list of values.

## Building hrefs from the same schemas

`href()`, `getLinkProps()` and the bound `Link` run the same construction: validate the path
against `pathSchema`, resolve a base search, merge your update over it, validate the result, and
serialize.

```tsx
const nextPage = ordersRoute.href({
  path: { status: 'open' },
  search: (current) => ({ page: current.page + 1 }),
});

const openOrders = { status: 'open' } as const;
const secondPage = { page: 2 };

<ordersRoute.Link path={openOrders} search={secondPage}>Page 2</ordersRoute.Link>;
```

`href()` and `getLinkProps()` are hook-free and use arguments plus schema defaults. For current
search, call the page hook at the component's top level and pass its result:

```tsx
const current = ordersPage.hooks.useSearch();
const nextPage = ordersRoute.href({
  path: { status: 'open' },
  search: { ...current, page: current.page + 1 },
});
```

Two behaviours follow from the schema being authoritative:

- **The href carries the whole parsed search state.** The base is `searchSchema.safeParse({})`, the
  schema's defaults, so `ordersRoute.href({ path: { status: 'open' }, search: { page: 2 } })` produces
  `/orders/open?page=2&limit=25&sortBy=&sortOrder=desc&offset=25`. Every declared field is
  serialized, including the derived `offset` and an empty `sortBy`. A smaller schema produces
  shorter URLs.
- **Preservation requires a hook or component.** Only the bound `Link` and
  `page.hooks.useRoute().getLinkProps` honor `preserveSearchParams`; a different route uses its
  defaults. Pure helpers accept the flag but ignore it, so pass the current `search` as above.

Link props default `f-client-nav` to `true`, so a reference-built anchor uses Fresh client
navigation unless you opt out.

## The generated routes tree

With the `@netscript/fresh/vite` plugin, the pattern strings are generated: the plugin walks
`routes/` and writes two modules.

- `.generated/manifest.ts` exports `routePatterns`, a tree of pattern strings, `as const`.
- `.generated/routes.ts` exports `routes`, the same tree with each leaf a route reference built
  from the matching `routePatterns` entry.

The key path is derived from the file path. Dynamic segments become `$`-prefixed camelCase keys,
`index` / `_app` / `_layout` and `(group)` directories are dropped, and every leaf ends in `$route`:

| Route file | Pattern | Accessor |
| --- | --- | --- |
| `routes/orders/index.tsx` | `/orders` | `routes.orders.$route` |
| `routes/dashboard/orders/[id].tsx` | `/dashboard/orders/[id]` | `routes.dashboard.orders.$id.$route` |
| `routes/docs/[...slug].tsx` | `/docs/[...slug]` | `routes.docs.$slugAll.$route` |
| `routes/files/[[...path]].tsx` | `/files/[[...path]]` | `routes.files.$pathOptional.$route` |
| `routes/partials/orders/list.tsx` | `/partials/orders/list` | `routes.partials.orders.list.$route` |

Each leaf is `createRouteReference(routePatterns.<key>, { id, kind })`, or
`bindRoutePattern(contract, routePatterns.<key>, { id, kind })` when the route has a contract
sidecar. `kind` is `'partial'` for anything under `partials/` and `'page'` otherwise; `id` is the
dotted key path without the trailing `$route`.

After regeneration, moving `routes/dashboard/orders/[id].tsx` to `routes/orders/[id].tsx`
removes `routes.dashboard.orders.$id`, and consumers of that accessor fail `deno check`.
The guarantee covers only generated-tree consumers. A literal
`createRouteReference('/dashboard/orders/[id]')` is not rename-tracked, so prefer generated accessors
for filesystem routes.

## Renaming or moving a route

`ui:add page` binds `appRoutes['catalog']` to a string literal in `router.ts`:
`createRouteReference('/catalog', ...)`. Moving files can leave stale URLs while `deno check` passes.

1. Move page, owned `query-loaders.ts`/`CatalogIsland.tsx`, and contract sidecar; repair imports.
2. Reconcile `router.ts` pattern/key/metadata `id`, page binding, and consumers.
3. Update navigation links, literals, redirects, partials, tests, and path schemas.
4. Refresh `.generated/manifest.ts` and `.generated/routes.ts` via Vite build/dev; never hand-edit.
5. Type-check after regeneration.
6. Visit `/inventory`, test navigation/loader/island/partials, and check the old `/catalog` URL.

[Generated web surface](/web-layer/generated-surface/) explains file ownership. Route renames remain
manual. Use `netscript ui:remove page catalog --dry-run` to preview removal of an unchanged
`ui:add page` scaffold. Run without `--dry-run` to delete its page and optional colocated
loader/island, prune only its generated `router.ts` registration, and rebuild the derived route
modules using the same writer as `netscript generate routes`. Use `--app <name>` or an explicit app
`--project-root` to select the application; `--client <service>` selects the original client when
ambiguous.

Formatting with the scaffold’s `deno task fmt` is accepted, including wrapped router entries.
Removal compares scaffold files after Deno formatting; code or comment edits, missing scaffold parts
and customized registrations are refused before writing. There is no force override: reconcile
edited pages manually. Authored siblings, contract sidecars, other pages and unrelated router
entries remain intact. Repeating a successful removal is safe and reconstructs missing derived
modules. An absent page reports “Nothing to remove”; empty route parents are pruned up to the routes
root while authored siblings remain. The router is written before files are deleted, so an
interruption cannot leave a registration pointing at a deleted page. Update navigation and consumers
yourself, then type-check and verify the old URL. `ui:remove <name>` continues to remove copied
registry items.

## Three authoring forms, one generated binding

A page module and its route contract can be colocated, split into a sidecar, or absent. The
generator recognizes all three and owns the binding call in each:

| Form | You write | The generator inserts |
| --- | --- | --- |
| **A: inline** | `.withRouteContract({ pathSchema, searchSchema })` | `$route: routePatterns.<key>.$route` as the object's first field, plus the `routePatterns` import |
| **B: sidecar** | a sibling `<page>.route.ts` default-exporting the contract | `.withRoute(routes.<key>.$route)` after `definePage()`, plus the `routes` import |
| **C: none** | nothing | `.withRoute(routes.<key>.$route)`, backed by `createRouteReference` |

Form A keeps the schemas next to the page that reads them; the `routes` leaf for a Form A page stays
a plain navigable reference. Choose Form B when several modules (a page, its partial, a test) need
the same contract object.

The rewrite is idempotent and edits your source file on disk, so the binding is visible in the
module. Set `pageModuleRouteBinding: false` in the plugin options to opt out; the plugin then writes
only `.generated/*`, and you supply `$route` or `.withRoute(...)` yourself.

Two conflicts are reported. A module carrying **both** `.withRoute(...)` and
`.withRouteContract({...})` is a build error:

```text
Page dashboard/orders/index.tsx has both .withRoute and .withRouteContract. Pick one.
```

A module with an inline contract *and* a sibling sidecar is a warning; inline wins, and the sidecar
stays on disk:

```text
Page has both inline .withRouteContract and sibling sidecar. Inline form takes precedence.
Delete the sidecar to silence this warning.
```

## Runtime guards

Two guarantees are runtime guards behind typed parameters.

**`$route` is optional in the type and required at runtime.** `DefinePageRouteContractInput` declares
`$route?: string` because the generator normally supplies it. Author Form A by hand with the rewriter
disabled and the page type-checks, then throws when the chain runs. Both `withRoute()` and
`withRouteContract()` promote eagerly, so the failure lands at module load, not on the first
request:

```text
definePage().withRouteContract({...}) requires a $route pattern. The NetScript Vite plugin
inserts it from the page module path; set pageModuleRouteBinding or add
$route: routePatterns.<key>.$route manually.
```

**`withRoute()` verifies the object it receives.** The parameter type accepts any typed route
target, but the builder checks for a complete reference (`nav`, `href`, `parsePath`, `parseSearch`)
and throws a `TypeError` otherwise:

```text
definePage().withRoute(...) requires a complete route reference with navigation and parsers.
```

## Paired page and partial routes

`route.withPartial(partialRoute)` pairs a page reference with a partial reference and builds both
URLs from one call; [Partials](/web-layer/partials/) covers it with the receiving route. Paired
helpers ignore preservation flags, so pass `search` and `partialSearch` explicitly.

## What to watch for

- **A contract-free reference does not validate search.** `createRouteReference(pattern)` infers
  typed *path* params, but its `parseSearch` only converts `URLSearchParams` into a record of
  `string | string[] | undefined`, and `safeParseSearch` always succeeds. Add a `searchSchema`
  through a contract when the query string carries meaning.
- **`$href` exists only for static patterns.** A reference whose pattern contains `[` has
  `$href: undefined`; call `href({ path })` instead.
- **`parsePath` on a contract-free reference throws on a missing segment:**
  `Missing path param "id".`, or `Missing catch-all path param "slug".` for `[...slug]`. Use
  `safeParsePath` where the input is untrusted.
- **Catch-all segments parse to arrays.** `/docs/[...slug]` with `slug: 'a/b/c'` yields
  `{ slug: ['a', 'b', 'c'] }`; the optional form `[[...slug]]` omits the key when empty.
- **`offset` is output, not input.** The schema recomputes it from `page` and `limit`, so setting it
  in a `search` update has no effect.

## API summary

| Symbol | Description |
| --- | --- |
| `defineRouteContract(options)` | Define a typed route contract around optional path and search schemas. |
| `bindRoutePattern(contract, routePattern, metadata?)` | Bind a route contract to a concrete Fresh route pattern, with optional manifest metadata. |
| `createRouteReference(routePattern, metadata?)` | Build a route reference directly from a Fresh route pattern. |
| `enumPathParamSchema(paramName, values)` | Create an enum-backed path schema for a single dynamic segment. |
| `defineEnumPathParam(paramName, values)` | Create a reusable enum-backed path param helper with `schema` and a non-throwing `parse`. |
| `paginationSearchSchema(options)` | Create a pagination-aware search schema with typed defaults and a derived `offset`. |
| `fallback(schema, defaultValue)` | Wrap a search-param field so a bad value falls back instead of failing the parse. |
| `DefineRouteContract` | Public route contract with `bind`, `createNav`, and parse helpers. |
| `RouteReference` | Stable route reference with `href`, `Link`, `getLinkProps`, `withPartial`, and parsing. |
| `BoundRouteContract` | A `RouteReference` produced by binding a contract to a pattern. |
| `RouteNavigation` | Minimal typed navigation API exposing `makeHref`. |
| `PairedRouteTarget` | Combined page/partial helper returned by `withPartial`. |
| `PaginationSearchState` | Parsed pagination output (`page`, `limit`, `offset`, `sortBy`, `sortOrder`). |
| `SchemaParseResult` | Success or failure result returned by route schemas. |
| `InferRoutePatternPath` | Infer typed path params directly from a route pattern. |

## Next steps

Continue with [Generated web surface](/web-layer/generated-surface/) to see which route files you own
and which the generator rewrites. See also [Partials](/web-layer/partials/) for the routes that
render one region of a page.
