---
layout: layouts/base.vto
title: Routing and route contracts
templateEngine: [vento, md]
order: 3
---

# Routing and route contracts

A URL is two things at once: an input the server parses, and an output the UI constructs. Bare Fresh
gives you the first as strings and leaves the second to template literals, so the same route pattern
ends up written twice — once as a directory path, once as `` `/orders/${id}?page=${page}` `` — with
nothing checking that the two still agree.

A **route contract** is the schema half of that pair: it owns a route's path and search schemas
independently of any concrete URL. Binding it to a pattern produces a **route reference** — one
object that parses a request *and* builds hrefs, from the same schemas. This page is about what each
piece actually guarantees, and about the third piece that closes the loop: a generated `routes` tree
derived from the filesystem, so a moved route file is a compile error at every call site.

Import the surface from `@netscript/fresh/route`.

## What bare Fresh makes you write

Fresh 2 hands you raw request values. A paginated, filtered list route means:

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

And every link back into that route is a string:

```tsx
<a href={`/orders/${status}?page=${page + 1}&limit=${limit}`}>Next</a>
```

Three costs are worth naming, because they are what the contract removes.

**The parsing is per-handler, so it drifts.** `page`, `limit`, and `offset` are re-derived in every
route that paginates. Two routes clamp `limit` differently and nobody notices until a report is
wrong.

**`string` is not a type.** `ctx.params.status` is typed `string` whether or not the segment is one
of two legal values, so the narrowing has to be re-written by hand in each handler, and the compiler
cannot tell you when you forget.

**Links are unverified.** The template literal has no relationship to the file at
`routes/orders/[status].tsx`. Rename the file, move it into a different URL-bearing directory, or add
a segment, and every link still compiles and still ships — it just 404s. (Moving it under a Fresh
route group alone does not change the URL; `(group)` directories are dropped from the path.)

## The mechanism: contract, reference, generated tree

Three objects, each with a distinct job.

`defineRouteContract({ pathSchema?, searchSchema? })` owns the **schemas** and knows no URL. Both
options are optional; a contract with neither is still a legal contract that parses to `{}`. It
returns `parsePath` / `safeParsePath` / `parseSearch` / `safeParseSearch`, a `createNav(pattern)`
helper, and `bind(pattern)`.

`bind(pattern)` — or the function form `bindRoutePattern(contract, pattern, metadata?)` — attaches
the contract to a concrete Fresh pattern and returns a **route reference**: the schemas, the
`routePattern`, the four parse helpers, plus the construction half — `href()`, `getLinkProps()`, a
bound `Link` component, `nav`, and `withPartial()`. `createRouteReference(pattern)` produces the same
reference shape without a contract, inferring path params from the pattern itself.

The generated `routes` tree binds every route file in the app to one of those references, so the
pattern string appears exactly once in the whole codebase — inside a generated module.

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

One contract can bind to several patterns — that is the point of keeping the two apart. A list route
and its partial share a search schema; binding twice gives two references over one definition.

`bind()` passes no metadata. When a reference needs the manifest fields `$id` and `$kind`, use the
`bindRoutePattern(contract, pattern, { id, kind })` function form — which is exactly what the
generator emits.

## Search params that cannot throw

`paginationSearchSchema()` is not just a shape; it is a **total** parse of four fields. Every base
field is wrapped in a Zod `catch`, so a hostile query string produces defaults rather than an error:

| Field | Parsed as | Falls back to |
| --- | --- | --- |
| `page` | coerced integer, min 1 | `1` |
| `limit` | coerced integer, min 1 | `options.defaultLimit ?? 10` |
| `sortBy` | non-empty string | `options.defaultSort ?? ''` |
| `sortOrder` | `'asc' \| 'desc'` | `options.defaultOrder ?? 'desc'` |

`offset` is then computed and appended: `Math.max(page - 1, 0) * limit`. It is not a field you can
send — it is derived output, which is why a loader can hand it straight to a repository.

```ts
const listSearch = paginationSearchSchema({ defaultLimit: 25 });

listSearch.parse({ page: 'banana', limit: '-4', sortOrder: 'sideways' });
// { page: 1, limit: 25, sortBy: '', sortOrder: 'desc', offset: 0 }

listSearch.parse({ page: '3', limit: '50' });
// { page: 3, limit: 50, sortBy: '', sortOrder: 'desc', offset: 100 }
```

Each field is also preprocessed to take the **first** value when a param repeats, so
`?page=2&page=9` parses as `page: 2` rather than failing on an array.

**This is where `fallback()` earns its place.** `extend(shape)` adds your own fields to the schema,
and those fields are *not* automatically caught — an extended `z.enum([...])` fed a bad value makes
the whole parse fail, which is the one way a pagination schema can throw. `fallback(schema, value)`
is `schema.catch(value)`: it restores the never-throws property to the fields you added.

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

Choose deliberately. A filter that should degrade to a default belongs in `fallback`; a param whose
wrong value should be a 400 belongs in a bare schema with `safeParseSearch` handling the failure.

## Enum segments

Path params get two helpers, and they are not interchangeable.

`enumPathParamSchema(name, values)` is a `pathSchema` for a contract. It validates one segment and
its failure message is searchable:

```text
Expected route param "status" to be one of: open, closed
```

**It also narrows the parsed path to that one key.** Its success data is `{ [name]: value }` and
nothing else, so on `/orders/[status]/[id]` a contract using it alone parses `status` and drops
`id` entirely. For a multi-segment route, write an object schema covering every param rather than
reaching for this helper.

`defineEnumPathParam(name, values)` is the standalone form. It carries `paramName`, `values`, the
same `schema`, and a `parse(value)` that takes the bare segment string and returns the typed value or
`null` — no throw, no contract, no record wrapper:

```ts
const orderStatus = defineEnumPathParam('status', ['open', 'closed']);

orderStatus.parse('open'); // 'open'
orderStatus.parse('archived'); // null
```

Reach for it in a middleware, a guard, or anywhere the segment is checked outside a page's own parse
pass — and reuse `orderStatus.schema` as the contract's `pathSchema` so both paths agree on one list
of values.

## Building hrefs from the same schemas

`href()`, `getLinkProps()`, and the bound `Link` all run the same construction: validate the path
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

The `search` argument accepts an object *or* a function of the base state, which is what makes
relative moves (`page + 1`) expressible without threading the current page into the call.

Two behaviours here surprise people, and both follow from the schema being authoritative:

**The href carries the whole parsed search state, not just the fields you set.** The base is
`searchSchema.safeParse({})` — the schema's defaults — so
`ordersRoute.href({ path: { status: 'open' }, search: { page: 2 } })` produces
`/orders/open?page=2&limit=25&sortBy=&sortOrder=desc&offset=25`. Every declared field is serialized,
including the derived `offset` and an empty `sortBy`. A contract whose schema is small produces
short URLs; that is the lever.

**`preserveSearchParams: true` only preserves inside the matching route.** It substitutes the current
request's parsed search for the defaults, but only when the rendering page's route pattern equals
the target's. Linking to a *different* route with the flag set falls back to that route's defaults —
which is correct, since the two routes' search schemas need not share a single field.

Link props also default `f-client-nav` to `true`, so a reference-built anchor participates in Fresh
client navigation unless you opt out.

## The generated routes tree

The pattern string still lives somewhere. With the `@netscript/fresh/vite` plugin, that somewhere is
generated: the plugin walks `routes/` and writes two modules.

- `.generated/manifest.ts` exports `routePatterns` — a tree of pattern strings, `as const`.
- `.generated/routes.ts` exports `routes` — the same tree, with each leaf a route reference built
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

**This is the rename-safety story, and it is narrow enough to state exactly.** Move
`routes/dashboard/orders/[id].tsx` to `routes/orders/[id].tsx` and the tree is regenerated:
`routes.dashboard.orders.$id` stops existing, and every call site referencing it fails `deno check`.
The guarantee applies only to call sites that go through the generated tree. A hand-written
`createRouteReference('/dashboard/orders/[id]')` holds a string literal and is not rename-tracked —
prefer the generated accessor wherever a route file can move, and keep `createRouteReference` for
patterns outside the generated tree.

## Three authoring forms, one generated binding

A page module and its route contract can be colocated, split into a sidecar, or absent entirely. The
generator recognizes all three and owns the binding call in each:

| Form | You write | The generator inserts |
| --- | --- | --- |
| **A — inline** | `.withRouteContract({ pathSchema, searchSchema })` | `$route: routePatterns.<key>.$route` as the object's first field, plus the `routePatterns` import |
| **B — sidecar** | a sibling `<page>.route.ts` default-exporting the contract | `.withRoute(routes.<key>.$route)` after `definePage()`, plus the `routes` import |
| **C — none** | nothing | `.withRoute(routes.<key>.$route)`, backed by `createRouteReference` |

Form A keeps the schemas next to the page that reads them, where the schema imports are already in
scope; the `routes` leaf for a Form A page stays a plain navigable reference. Form B is the choice
when several modules — a page, its partial, a test — need the same contract object.

The rewrite is idempotent and it edits your source file on disk, so the binding is visible in the
module rather than hidden in a build step. Set `pageModuleRouteBinding: false` in the plugin options
to opt out; only `.generated/*` is written then, and you supply `$route` or `.withRoute(...)`
yourself.

Two conflicts are reported rather than guessed at. A module carrying **both** `.withRoute(...)` and
`.withRouteContract({...})` is a build error:

```text
Page dashboard/orders/index.tsx has both .withRoute and .withRouteContract. Pick one.
```

A module with an inline contract *and* a sibling sidecar is a warning — inline wins, and the sidecar
is left on disk:

```text
Page has both inline .withRouteContract and sibling sidecar. Inline form takes precedence.
Delete the sidecar to silence this warning.
```

## Where the checks actually happen

Two of this surface's guarantees are runtime guards behind typed parameters, and it is worth knowing
which.

**`$route` is optional in the type and required at runtime.** `DefinePageRouteContractInput` declares
`$route?: string`, because the generator normally supplies it. Author Form A by hand with the
rewriter disabled and the page type-checks — then throws the moment the chain runs. Both
`withRoute()` and `withRouteContract()` promote eagerly, so the failure lands at module load rather
than on the first request:

```text
definePage().withRouteContract({...}) requires a $route pattern. The NetScript Vite plugin
inserts it from the page module path; set pageModuleRouteBinding or add
$route: routePatterns.<key>.$route manually.
```

**`withRoute()` verifies the object it was handed.** The parameter type accepts any typed route
target, but the builder checks for a complete reference — `nav`, `href`, `parsePath`, `parseSearch` —
and throws a `TypeError` otherwise:

```text
definePage().withRoute(...) requires a complete route reference with navigation and parsers.
```

Both are the shape of guard you want: the common path is fully typed, and the escape hatches fail
loudly instead of silently producing a page with unparsed params.

## Paired page and partial routes

`route.withPartial(partialRoute)` pairs a page reference with a partial reference and builds both
URLs from one call — `href()` for the page, `partialHref()` for the partial, and `getLinkProps()`
returning both plus the `f-partial` attribute Fresh uses to drive partial navigation. Path and search
params are supplied once and applied to both sides, with `partialPath`, `partialSearch`, and
`partialPreserveSearchParams` for the cases where the partial's params legitimately differ.

The partial on the other end of that link is [Partials](/web-layer/partials/).

## What to watch for

- **A contract-free reference does not validate search.** `createRouteReference(pattern)` infers
  typed *path* params, but its `parseSearch` only converts `URLSearchParams` into a record of
  `string | string[] | undefined`, and `safeParseSearch` always succeeds. Add a `searchSchema`
  through a contract when the query string carries meaning.
- **`$href` exists only for static patterns.** A reference whose pattern contains `[` has
  `$href: undefined`; call `href({ path })` instead.
- **`parsePath` on a contract-free reference throws on a missing segment** —
  `Missing path param "id".`, or `Missing catch-all path param "slug".` for `[...slug]`. Use
  `safeParsePath` where the input is untrusted.
- **Catch-all segments parse to arrays.** `/docs/[...slug]` with `slug: 'a/b/c'` yields
  `{ slug: ['a', 'b', 'c'] }`; the optional form `[[...slug]]` omits the key entirely when empty.
- **`offset` is output, not input.** Adding it to a `search` update is possible but pointless — the
  schema recomputes it from `page` and `limit`.

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

{{ comp callout { type: "note" } }}
Path and search schemas are independent: a contract can carry one, both, or
neither. Define only the schemas a route actually reads, and bind the same
contract to every pattern that shares those params.
{{ /comp }}

## Related

{{ comp.cardsGrid({ columns: 3, cards: [
  { title: "Pages and the define-page builder", body: "Compose route contracts into pages.", href: "/web-layer/builders/" },
  { title: "Request-scoped resources", body: "Where ctx.path and ctx.search are consumed.", href: "/web-layer/resources/" },
  { title: "Partials", body: "Route references, pairing, and typed f-partial props.", href: "/web-layer/partials/" },
  { title: "Data loading and the query cache", body: "Turning parsed search state into a cached read.", href: "/web-layer/query/" },
  { title: "Server-validated forms", body: "Validate input alongside route contracts.", href: "/web-layer/form/" },
  { title: "Live dashboard tutorial", body: "Build a routed, data-driven page end to end.", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" }
] }) }}

See the [Web Layer hub](/web-layer/) for the full pillar.
