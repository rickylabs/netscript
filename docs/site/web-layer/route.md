---
layout: layouts/base.vto
title: Routing and route contracts
templateEngine: [vento, md]
order: 3
---

# Routing and route contracts

The route surface of `@netscript/fresh` turns a Fresh route pattern such as
`"/orders/[id]"` into a typed contract. A route contract owns the schemas for
its path and search params, parses raw request input into validated state, and
builds hrefs and link props that match the same pattern. Reach for it whenever a
page reads dynamic segments or query strings and you want one source of truth
that both the page handler and its links share.

Import the surface from `@netscript/fresh/route`.

## Route contracts

A route contract is defined independently of any concrete URL. You describe the
shape of the path and search params once, then bind that contract to one or more
Fresh route patterns. Both schemas are optional: a contract with neither still
produces a usable typed reference for a static route.

Create a contract with `defineRouteContract()`. It accepts a
`DefineRouteContractOptions` object with an optional `pathSchema` (a
`PathParamSchema`) and an optional `searchSchema` (a `SearchParamSchema`), and
returns a `DefineRouteContract`. The returned contract exposes:

- `bind(routePattern)` — bind the contract to a concrete pattern, returning a
  `BoundRouteContract` with parsing and href helpers.
- `createNav(routePattern)` — produce a `RouteNavigation` helper for a pattern.
- `parsePath(input)` / `safeParsePath(input)` — parse raw Fresh path params
  (`PathParamInput`) into typed path state, throwing or returning a
  `SchemaParseResult`.
- `parseSearch(input)` / `safeParseSearch(input)` — parse raw search params
  (`URLSearchParams` or `SearchParamInput`) into typed search state.

A `BoundRouteContract` is a `RouteReference` combined with the contract's
compile-time type carrier, so binding adds href and link generation on top of
the parsing helpers.

## Route references

A `RouteReference` is the stable object that pages, links, and generated route
manifests pass around. It carries the `routePattern` it was built from, the
optional `pathSchema` and `searchSchema`, and a `nav` builder, plus manifest
metadata (`$pattern`, `$href`, `$id`, `$kind`). Its methods cover both
directions of the contract:

- `href(...args)` — build a `ValidatedRouteHref` (a plain string) from optional
  path and search input.
- `Link` — a Fresh link component already bound to the reference.
- `getLinkProps(input)` — materialize `FreshLinkAttributes` plus a generated
  `href` for an anchor.
- `parsePath` / `safeParsePath` / `parseSearch` / `safeParseSearch` — the same
  parsing helpers exposed by the contract.
- `withPartial(partialRoute)` — pair the page route with a Fresh partial route,
  returning a `PairedRouteTarget`.

When you already have a concrete pattern and no custom schemas, build a
reference directly with `createRouteReference(routePattern)`. The path param
types are inferred from the pattern itself through `InferRoutePatternPath`, so
`createRouteReference("/orders/[id]")` yields a reference whose `href` expects
`{ path: { id: string } }`.

```ts
import { createRouteReference } from "@netscript/fresh/route";

const orderRoute = createRouteReference("/orders/[id]");

// "/orders/42"
const href = orderRoute.href({ path: { id: "42" } });
```

To attach explicit schemas, define a contract and bind it:

```ts
import {
  defineRouteContract,
  enumPathParamSchema,
  paginationSearchSchema,
} from "@netscript/fresh/route";

const ordersContract = defineRouteContract({
  pathSchema: enumPathParamSchema("status", ["open", "closed"]),
  searchSchema: paginationSearchSchema({ defaultLimit: 25 }),
});

const ordersRoute = ordersContract.bind("/orders/[status]");

// Parse the request path and query inside a page handler.
const path = ordersRoute.parsePath({ status: "open" });
const search = ordersRoute.parseSearch(new URLSearchParams("page=2"));

// Build a link back to the same route with updated search state.
const next = ordersRoute.href({
  path: { status: path.status },
  search: { page: search.page + 1 },
});
```

## Path params

`bindRoutePattern(contract, routePattern, metadata?)` is the function form of
`contract.bind(...)`; both attach a `DefineRouteContract` to a pattern and
return a `BoundRouteContract`. The optional `metadata` argument is a
`RouteReferenceOptions` carrying a generated `id` and `kind`
(`RouteReferenceKind` is `"page"` or `"partial"`).

For enum-valued segments there are two grounded helpers:

- `enumPathParamSchema(paramName, values)` returns a `PathParamSchema` accepted
  directly as a contract `pathSchema`.
- `defineEnumPathParam(paramName, values)` returns an `EnumPathParamDefinition`
  that exposes both the `schema` and a standalone `parse(value)` that returns
  the typed value or `null` when the segment is invalid.

Raw path input is typed as `PathParamInput` (`Record<string, string |
undefined>`), and every parse returns a `SchemaParseResult` — either a
`SchemaParseSuccess` with `data` or a `SchemaParseFailure` with `success: false`
and an optional `error`.

## Search params and pagination

`paginationSearchSchema(options)` builds a `PaginationSearchSchema` over a
`PaginationSearchBaseShape` (`page`, `limit`, `sortBy`, `sortOrder`). Its
`PaginationSearchSchemaOptions` accept `defaultLimit`, `defaultSort`, and
`defaultOrder`. Parsing a query string produces a `PaginationSearchState` with a
one-based `page`, a `limit`, a derived zero-based `offset`, and the active
`sortBy` / `sortOrder`.

Extend the schema with additional fields through `extend(shape)`, and wrap a field in a default with
`fallback(schema, defaultValue)`, which applies a catch wrapper suitable for use
inside `paginationSearchSchema().extend(...)`. Raw search values are typed as
`SearchParamValue` (`string | string[] | undefined`).

```ts
import {
  fallback,
  paginationSearchSchema,
} from "@netscript/fresh/route";

const listSearch = paginationSearchSchema({ defaultOrder: "desc" });

const state = listSearch.parse({ page: "3", limit: "50" });
// state.page === 3, state.offset === 100, state.sortOrder === "desc"
```

## Paired page and partial routes

`route.withPartial(partialRoute)` returns a `PairedRouteTarget` that builds page
and partial hrefs together. It exposes the underlying `route` and `partialRoute`
references, an `href(...)` for the page, a `partialHref(...)` for the partial,
and `getLinkProps(input)` that materializes `FreshPartialLinkAttributes` with
both `href` and `f-partial` set — the attributes Fresh uses to drive partial
navigation.

## API summary

| Symbol | Description |
| --- | --- |
| `defineRouteContract(options)` | Define a typed route contract around optional path and search schemas. |
| `bindRoutePattern(contract, routePattern, metadata?)` | Bind a route contract to a concrete Fresh route pattern. |
| `createRouteReference(routePattern, metadata?)` | Build a route reference directly from a Fresh route pattern. |
| `enumPathParamSchema(paramName, values)` | Create an enum-backed path schema for a single dynamic segment. |
| `defineEnumPathParam(paramName, values)` | Create a reusable enum-backed path param helper with `schema` and `parse`. |
| `paginationSearchSchema(options)` | Create a pagination-aware search schema with typed defaults. |
| `fallback(schema, defaultValue)` | Apply a fallback value to a search-param field. |
| `DefineRouteContract` | Public route contract with `bind`, `createNav`, and parse helpers. |
| `RouteReference` | Stable route reference with `href`, `Link`, `getLinkProps`, and parsing. |
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
  { title: "The Fresh page model", body: "How pages bind to the server and the request lifecycle.", href: "/web-layer/server/" },
  { title: "Pages and the define-page builder", body: "Compose route contracts into pages.", href: "/web-layer/builders/" },
  { title: "Data loading and the query cache", body: "Load data for the params a route parses.", href: "/web-layer/query/" },
  { title: "Server-validated forms", body: "Validate input alongside route contracts.", href: "/web-layer/form/" },
  { title: "Deferred and streaming UI", body: "Stream a page once its params resolve.", href: "/web-layer/defer-streaming-ui/" },
  { title: "Live dashboard tutorial", body: "Build a routed, data-driven page end to end.", href: "/tutorials/live-dashboard/" }
] }) }}

See the [Web Layer hub](/web-layer/) for the full pillar.
