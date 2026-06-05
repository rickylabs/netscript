# `@netscript/fresh`

[![JSR](https://jsr.io/badges/@netscript/fresh)](https://jsr.io/@netscript/fresh)
[![Deno](https://img.shields.io/badge/runtime-Deno-000000?logo=deno&logoColor=white)](https://deno.com/)
[![Fresh](https://img.shields.io/badge/framework-Fresh-ffdb1e?logo=deno&logoColor=111111)](https://fresh.deno.dev/)
[![License](https://img.shields.io/badge/license-MIT-0f172a)](https://opensource.org/licenses/MIT)

Page builders, route contracts, form helpers, and deferred rendering primitives for Fresh applications in the NetScript ecosystem.

## Features

- **`definePage()` builder** — Composable page definitions with typed route contracts, metadata, and layout layers
- **Route contracts** — Typed route patterns, path parameters, pagination schemas, and typed link generation
- **Form helpers** — Parse form data, normalize validation errors, and resolve form state
- **Deferred rendering** — Suspense-style partial loading with `<Deferred>` and `<DeferPage>` components
- **Error normalization** — Unified error extraction across form submissions and API responses
- **App bootstrapping** — `defineFreshApp()` for server-side Fresh app configuration
- **Vite integration** — Pre-configured Vite setup for NetScript Fresh workspaces
- **Subpath-first** — Import only the framework layer you need

## Install

```ts
// deno.json
{
  "imports": {
    "@netscript/fresh": "jsr:@netscript/fresh@^1.0.0"
  }
}
```

## Quick Start

Define a page with a typed route contract and pagination:

```tsx
import { definePage } from "@netscript/fresh/builders";
import { defineRouteContract, paginationSearchSchema } from "@netscript/fresh/route";

const ordersRoute = defineRouteContract({
  searchSchema: paginationSearchSchema({
    defaultLimit: 20,
    defaultSort: "createdAt",
    defaultOrder: "desc",
  }),
});

export const ordersPage = definePage()
  .withRoute(ordersRoute)
  .withMeta(() => ({
    title: "Orders",
    description: "Browse the current order queue.",
  }))
  .build();
```

## Entry Points

### Root

The root entrypoint re-exports a curated set of commonly used helpers including error handling, defer primitives, and cache-entry utilities.

```ts
import {
  DeferComponent,
  DeferPage,
  extractErrorData,
  hasAllCacheEntries,
  minCachedAt,
} from "@netscript/fresh";
```

### Builders

Page and partial builders for Fresh applications.

```tsx
import { definePage, definePartial, defineStatsPartial } from "@netscript/fresh/builders";
```

### Route

Route contracts, references, typed links, and pagination and search helpers.

```ts
import {
  bindRoutePattern,
  createRouteReference,
  defineRouteContract,
  enumPathParamSchema,
  fallback,
  paginationSearchSchema,
} from "@netscript/fresh/route";
```

### Form

Form state, error normalization, data pipeline helpers, and pagination state.

```ts
import {
  buildPaginationState,
  createEmptyFormErrors,
  firstFieldError,
  formDataToRawValues,
  normalizeFormValues,
  resolveFormState,
  toFormErrors,
} from "@netscript/fresh/form";
```

### Error

Normalized error extraction and shared error display types.

```ts
import { extractErrorData, type ErrorData, type ErrorPrimitives } from "@netscript/fresh/error";
```

### Defer

Deferred rendering and refresh helpers.

```tsx
import { DeferComponent, DeferPage, Deferred } from "@netscript/fresh/defer";
```

### Interactive

Promise utilities for package-owned interactive flows.

```ts
import { resolvedPromise, usePromise } from "@netscript/fresh/interactive";
```

### Server

Fresh app bootstrapping helpers.

```ts
import { defineFreshApp, type App, type FreshConfig } from "@netscript/fresh/server";
```

### Utils

Cache-entry utilities shared by page loaders.

```ts
import {
  hasAllCacheEntries,
  minCachedAt,
  projectCachedItemFromList,
} from "@netscript/fresh/utils";
```

### Vite

NetScript Vite integration.

```ts
import { ... } from "@netscript/fresh/vite";
```

## Usage

### `definePage()` with pagination

Define a page that parses and validates search parameters:

```tsx
import { definePage } from "@netscript/fresh/builders";
import { defineRouteContract, paginationSearchSchema } from "@netscript/fresh/route";

const productsRoute = defineRouteContract({
  searchSchema: paginationSearchSchema({
    defaultLimit: 25,
    defaultSort: "name",
    defaultOrder: "asc",
  }),
});

export const productsPage = definePage()
  .withRoute(productsRoute)
  .withMeta(() => ({ title: "Products" }))
  .build();
```

### Form error normalization

Parse Zod validation errors into a flat form-field error map:

```ts
import { createEmptyFormErrors, toFormErrors } from "@netscript/fresh/form";

// Start with a clean state
const empty = createEmptyFormErrors<{ email: string; password: string }>();

// Convert a Zod error into per-field messages
const errors = toFormErrors(zodError);
// { email: ["Invalid email"], password: ["Too short"] }
```

### Deferred rendering

Render placeholder content while an async operation completes:

```tsx
import { Deferred } from "@netscript/fresh/defer";

export function RecentOrdersPanel() {
  return (
    <Deferred
      promise={fetch("/api/orders/recent").then((r) => r.json())}
      fallback={<p>Loading…</p>}
    >
      {(orders) => (
        <ul>
          {orders.map((o) => <li key={o.id}>{o.reference}</li>)}
        </ul>
      )}
    </Deferred>
  );
}
```

### Route references and typed links

Generate type-safe URLs and link props from route contracts:

```ts
import { createRouteReference, defineRouteContract } from "@netscript/fresh/route";

const userRoute = defineRouteContract({ path: "/users/:id" });
const userRef = createRouteReference(userRoute, "/users/:id");

// Produce a typed href
const href = userRef.href({ id: "usr_1" }); // "/users/usr_1"

// Produce link props for an <a> element
const props = userRef.getLinkProps({ id: "usr_1" });
```

### Bootstrap a Fresh app

```ts
import { defineFreshApp } from "@netscript/fresh/server";

export default defineFreshApp({
  // Fresh app configuration
});
```

## Resources

- [`@netscript/fresh-ui`](https://jsr.io/@netscript/fresh-ui) — Interactive UI primitives and copy-source registry components
- [`@netscript/sdk`](https://jsr.io/@netscript/sdk) — Service clients and cache-backed queries used in page loaders
- [Fresh documentation](https://fresh.deno.dev/docs/)
- [Preact documentation](https://preactjs.com/guide/v10/getting-started)

## License

MIT