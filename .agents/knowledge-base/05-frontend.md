# Frontend Architecture

> Doctrine reference: package/plugin architecture is governed by `docs/architecture/doctrine/` and
> `.llm/harness/debt/arch-debt.md`. This file describes current repo state; doctrine defines the
> target state.

> Fresh 2 + Preact + Vite application built on a three-package model (`@netscript/fresh`,
> `@netscript/fresh-ui`), with composable page builders, cache-first DeferPage pattern, islands
> architecture, and real-time SSE monitoring.

## Technology Stack

- **Fresh 2.2.0** — Deno SSR framework with file-based routing
- **Preact 10.28.4** — Lightweight React alternative
- **@preact/signals 2.x** — Fine-grained reactive state
- **Vite 7.2.2** — Build tool with HMR
- **Tailwind CSS 4.x** — Utility-first CSS (v4 with `@import 'tailwindcss'`)
- **oRPC 1.13.x** — Type-safe RPC clients
- **Zod 4.x** — Schema validation
- **Taurify** — Desktop app packaging (Tauri)

## Three-Package Model

The frontend consumes two framework packages with distinct roles:

### `@netscript/fresh` (v1.0.0) — Framework Runtime

Dependency import — consumed as a versioned package. Provides builders, defer, forms, route
contracts, error handling, SSE, app bootstrap, and Vite config.

**10 subpath exports:**

| Export          | Purpose                                                                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.`             | Root helpers: `ErrorDisplay`, `errorHandler`, `extractData`, `extractErrorData`, `hasError`, `DeferPage`, `DeferComponent`, `DEFER_POLICY`, `DEFER_STALE_MS`, `DETAIL_FORCE_REFRESH_POLICY`, `resolveDetailDeferConfig`, cache utils |
| `./server`      | `defineFreshApp()`, `DefineFreshAppOptions`, Fresh type re-exports (`App`, `FreshConfig`, `Middleware`)                                                                                                                              |
| `./builders`    | `definePage()`, `definePartial()`, `defineStatsPartial()` — composable page builder with 60+ typed symbols                                                                                                                           |
| `./route`       | `defineRouteContract()`, `createRouteReference()`, `bindRoutePattern()`, `enumPathParamSchema()`, `defineEnumPathParam()`, `paginationSearchSchema()`, `fallback()`                                                                  |
| `./defer`       | `DeferPage`, `DeferComponent`, `DEFER_POLICY`, `DEFER_STALE_MS`, `DETAIL_FORCE_REFRESH_POLICY`, `resolveDetailDeferConfig`                                                                                                           |
| `./form`        | Form state, errors, pagination helpers                                                                                                                                                                                               |
| `./error`       | `extractErrorData`, `ErrorData`, `ErrorType`, `ErrorPrimitives`                                                                                                                                                                      |
| `./utils`       | `hasAllCacheEntries()`, `minCachedAt()`, `projectCachedItemFromList()`, `CacheEntryLike`, `CachedListEntryLike`                                                                                                                      |
| `./interactive` | `usePromise()`, `resolvedPromise()` (browser-facing)                                                                                                                                                                                 |
| `./vite`        | `createNetScriptVitePlugin()` and related config types                                                                                                                                                                               |

### `@netscript/fresh-ui` (v0.1.0) — Interactive Primitives + Copy-Source Registry

Copy-source for UI — applications own and evolve registry components after copy. Package-owned
runtime primitives are imported directly.

**2 subpath exports:**

| Export          | Purpose                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `.`             | `cn()` (clsx + tailwind-merge), toast helpers (`getToast`, `withToast`, `stripToastFromUrl`, `REGISTRY_TOAST_QUERY_KEYS`) |
| `./interactive` | `Accordion`, `Dialog`, `Drawer`, `Popover`, `Tabs`, `Tooltip`                                                             |

**Registry contents (copy-source):**

- **29 UI components** in `registry/components/ui/`: alert, badge, breadcrumb, button, card,
  checkbox, data-table, detail-layout, empty-state, filter-form, form-field, icon-button,
  inline-notice, input, label, page-header, pagination, panel, progress, section-divider, select,
  separator, sidebar-shell, skeleton, spinner, stats-grid, switch, textarea
- **3 islands** in `registry/islands/`: SidebarToggle, ThemeToggle, Toast
- **Dependencies:** clsx 2.x, tailwind-merge 3.x

## Builders API

The builders system in `@netscript/fresh/builders` provides a composable, type-safe page definition
API.

### `definePage()`

Creates a `PageRootBuilder` — a chainable builder for defining complete page routes with typed route
references, layers, handlers, layouts, meta, and slots.

```tsx
import { definePage } from '@netscript/fresh/builders';

const page = definePage()
  .route(usersListRoute) // Bind typed route reference
  .layer('users', loader) // Add data layer
  .layout(DashboardLayout) // Set layout
  .meta(metaResolver) // Page meta/headers
  .handlers({ POST: handler }) // HTTP method handlers
  .build(); // Finalize definition
```

**Key builder types:**

| Type                     | Purpose                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `PageBuilder`            | Main chainable builder interface (`.route()`, `.layer()`, `.layout()`, `.meta()`, `.handlers()`, `.build()`) |
| `PageContext`            | Full context available in page layer loaders                                                                 |
| `PageLayoutContext`      | Context available in layout components                                                                       |
| `PageLayerConfig`        | Configuration for a data layer                                                                               |
| `PageRouteReference`     | Typed reference to a route (path params, search params, href generation)                                     |
| `PageMetaResolver`       | Function to resolve page meta from context                                                                   |
| `PageSlot` / `PageSlots` | Named renderable slots for layout composition                                                                |
| `PageDefinition`         | Finalized page definition                                                                                    |

### `definePartial(options)`

Preset for partial endpoint routes (deferred loading targets).

```tsx
import { definePartial } from '@netscript/fresh/builders';

const partial = definePartial({
  // PartialRouteConfig fields
});
```

### `defineStatsPartial(options)`

Stats-specific partial preset with defaults tuned for dashboard stat cards.

```tsx
import { defineStatsPartial } from '@netscript/fresh/builders';

const statsPartial = defineStatsPartial({
  // DefineStatsPartialOptions fields
});
```

### Route Contracts

From `@netscript/fresh/route`:

```tsx
import {
  bindRoutePattern,
  createRouteReference,
  defineRouteContract,
  paginationSearchSchema,
} from '@netscript/fresh/route';

// Define a contract with typed path and search params
const usersContract = defineRouteContract({
  path: '/dashboard/users',
  search: paginationSearchSchema(),
});

// Create a reusable reference
const usersRoute = createRouteReference(usersContract);

// Bind a pattern for dynamic routes
const userDetailRoute = bindRoutePattern('/dashboard/users/:id');
```

**Key route types:**

| Type                     | Purpose                                                                    |
| ------------------------ | -------------------------------------------------------------------------- |
| `RouteReference`         | Full route reference with `.href()`, `.getLinkProps()`, navigation helpers |
| `DefineRouteContract`    | Route contract definition with path/search schemas                         |
| `BoundRouteContract`     | Pattern-bound route contract                                               |
| `PairedRouteTarget`      | Paired route (e.g. list + detail) with cross-navigation                    |
| `PaginationSearchSchema` | Pre-built search param schema for paginated list routes                    |
| `RouteNavigation`        | Navigation utilities for a route reference                                 |

## Form Handling

From `@netscript/fresh/form`:

### Error Utilities

```tsx
import { createEmptyFormErrors, firstFieldError, toFormErrors } from '@netscript/fresh/form';

// Create empty error state
const errors = createEmptyFormErrors(); // FormErrors

// Convert Zod validation error to form errors
const formErrors = toFormErrors(zodError); // FormErrors

// Get first error for a specific field
const emailError = firstFieldError(errors, 'email'); // string | undefined
```

### Form Data Processing

```tsx
import { formDataToRawValues, normalizeFormValues } from '@netscript/fresh/form';

// Extract raw values from FormData
const raw = formDataToRawValues(formData);

// Normalize raw values against a Zod schema
const normalized = normalizeFormValues(raw, userSchema);
```

### Form State Resolution

```tsx
import { resolveFormState } from '@netscript/fresh/form';

// Resolve form state from request context (handles GET/POST, errors, values)
const state = await resolveFormState(ctx); // FormState
```

### Pagination

```tsx
import { buildPaginationState, resolvePagination } from '@netscript/fresh/form';

// Build pagination state from input
const pagination = buildPaginationState(input); // PaginationState

// Resolve pagination from request context
const paginationState = resolvePagination(ctx); // PaginationState
```

### Form Types

| Type                        | Purpose                                              |
| --------------------------- | ---------------------------------------------------- |
| `FormErrors`                | Map of field names to error string arrays            |
| `FormState`                 | Complete form state (mode, values, errors)           |
| `PaginationState`           | Current page, limit, offset, total                   |
| `PaginationInput`           | Input for `buildPaginationState()`                   |
| `FormPageMode`              | `'create'` or `'edit'`                               |
| `FormPageProps`             | Props passed to form page components                 |
| `FormValues`                | Record of form field values                          |
| `FormFieldErrors`           | Error arrays keyed by field name                     |
| `FormPageInvalidateContext` | Context for cache invalidation after form submission |
| `FormSchemaValidationError` | Typed Zod validation error for forms                 |

## Core Patterns

### DeferPage Pattern (Cache-First Loading)

```tsx
import { DeferPage } from '@netscript/fresh/defer';

// In page route
export default define.page(async (ctx) => {
  const cachedData = await queries.users.list.getCachedData({ limit: '10' });

  return (
    <DeferPage
      action='/dashboard/users'
      partial='/partials/dashboard/users/list'
      name='users-list'
      component={cachedData ? <UsersList {...cachedData} /> : undefined}
      fallback={<UsersListSkeleton />}
      ctx={ctx}
    />
  );
});
```

**Flow:** Show cached data instantly → Display skeleton if no cache → Partial endpoint fetches fresh
data → Replace content seamlessly

**Defer constants:**

| Symbol                        | Purpose                                       |
| ----------------------------- | --------------------------------------------- |
| `DEFER_POLICY`                | Default defer policy configuration            |
| `DEFER_STALE_MS`              | Default stale time for cached data            |
| `DETAIL_FORCE_REFRESH_POLICY` | Policy for detail pages that force-refresh    |
| `resolveDetailDeferConfig`    | Resolve defer config for detail page patterns |

### Error Handling Pattern (Granular)

```tsx
import { errorHandler, extractData, extractErrorData, hasError } from '@netscript/fresh';
import { ErrorDisplay } from '@netscript/fresh';

// In partial loader — errorHandler wraps async loader with error boundary
export const loader = errorHandler(async () => {
  // CRITICAL data — failure shows error page
  const user = await queries.users.getById({ id });

  // OPTIONAL data — failure shows inline warning
  const [ordersError, ordersData] = await safe(queries.orders.list({ ... }));
  if (ordersError) {
    return { user, orders: undefined, ordersError: extractErrorData(ordersError) };
  }
  return { user, orders: ordersData.items, ordersError: undefined };
});

// In page component
export default define.page(async (ctx) => {
  const result = await loader(ctx);
  if (hasError(result)) {
    return <ErrorDisplay error={result.error}>{(props) => <CustomError {...props} />}</ErrorDisplay>;
  }
  const { user, orders, ordersError } = extractData(result);
  return <UserDetail user={user} orders={orders} ordersError={ordersError} />;
});
```

### Partial Updates (Delete Actions)

```tsx
// In partial handler
export const handler = define.handlers({
  async POST(ctx) {
    const form = await ctx.req.formData();
    const userId = Number(form.get('userId'));
    const deletedUser = await deleteUser(userId.toString());
    return { data: { deletedUser, success: true } };
  },
});

// In component — form with f-partial
<form method='POST' f-partial='/partials/dashboard/users/list'>
  <input type='hidden' name='userId' value={user.id} />
  <button type='submit'>Delete</button>
</form>;
```

## Routing Structure

```
routes/
├── _app.tsx                         # Root HTML shell (f-client-nav, Partial)
├── health.ts                        # Health check endpoint
├── index.tsx                        # Home page (/)
├── (dashboard)/                     # Route group with shared layout
│   ├── _layout.tsx                  # Dashboard navigation shell
│   ├── (_components)/               # Shared dashboard components
│   │   ├── breadcrumb.tsx
│   │   ├── loading-spinner.tsx
│   │   ├── order-form.tsx / orders-table.tsx
│   │   ├── product-form.tsx / products-table.tsx
│   │   ├── user-form.tsx / users-table.tsx / user-profile.tsx
│   │   ├── stats-card.tsx
│   │   ├── pagination.tsx
│   │   └── filters/
│   └── dashboard/
│       ├── index.tsx                # /dashboard (stats overview)
│       ├── users/                   # CRUD: index, new, [id], [id]/edit
│       ├── products/                # Same CRUD pattern
│       ├── orders/                  # Same CRUD pattern
│       ├── jobs/                    # /dashboard/jobs (index, [jobId]/, executions/)
│       ├── tasks/                   # /dashboard/tasks (index, [taskId]/, executions/)
│       ├── sagas/                   # /dashboard/sagas (index, [sagaName]/, [sagaName]/[correlationId])
│       ├── triggers/                # /dashboard/triggers (index, [id]/)
│       └── taurify/                 # /dashboard/taurify (desktop integration)
├── partials/                        # Deferred loading endpoints
│   └── dashboard/
│       ├── stats.tsx                # Dashboard stats
│       ├── recent-orders.tsx        # Recent orders widget
│       ├── recent-users.tsx         # Recent users widget
│       ├── users/                   # list, stats, [id]/
│       ├── products/                # list, stats, [id]/
│       ├── orders/                  # list, stats, [id]/
│       ├── jobs/                    # list, stats
│       ├── tasks/                   # list, stats
│       ├── sagas/                   # list, stats
│       └── triggers/                # list, stats, events
└── api/
    ├── [name].tsx                   # Dynamic API proxy
    ├── jobs.ts                      # SSE stream for job execution updates
    ├── tasks/                       # Task-related API endpoints
    ├── sagas/                       # Saga SSE endpoints
    └── triggers/                    # Trigger SSE (subscribe.ts)
```

## API Clients (`lib/api-clients.ts`)

Six service clients created via `createServiceClient` from `@netscript/sdk/client`:

```tsx
import { createServiceClient } from '@netscript/sdk/client';
import { createQueryFactories } from '@netscript/sdk/query';

// Core CRUD services
const usersClient = createServiceClient({ contract: usersContract, serviceName: 'users' });
const productsClient = createServiceClient({ contract: productsContract, serviceName: 'products' });
const ordersClient = createServiceClient({ contract: ordersContract, serviceName: 'orders' });

// Plugin services (serviceName = Aspire discovery, routerName = router path segment)
const workersClient = createServiceClient({
  contract: workersContract,
  serviceName: 'workers-api',
  routerName: 'workers',
});
const sagasClient = createServiceClient({
  contract: sagasContract,
  serviceName: 'sagas-api',
  routerName: 'sagas',
});

// Triggers client — lazy proxy to avoid crashing when triggers-api is not wired
const triggersClient = /* lazy Proxy */ createServiceClient({
  contract: triggersContract,
  serviceName: 'triggers-api',
  routerName: 'triggers',
});

// Base query factories with caching
const baseQueries = createQueryFactories({
  orders: { contract: ordersContract, client: ordersClient },
  users: { contract: usersContract, client: usersClient },
  products: { contract: productsContract, client: productsClient },
});
```

## Dashboard Queries (`utils/dashboard-queries.ts`)

```tsx
import { createCompositeQuery } from '@netscript/sdk/query';

// Composite query — fetches all stats in parallel with error resilience
const dashboardStats = createCompositeQuery({
  key: ['stats', 'dashboard'],
  queryFn: async (props) => {
    const [ordersError, ordersStats] = await safe(baseQueries.orders.getStats(props));
    const [usersError, usersStats] = await safe(baseQueries.users.getStats(props));
    const [productsError, productsStats] = await safe(baseQueries.products.getStats(props));
    // ... error handling, returns combined stats
    return { orders, users, products, userStats, productStats, orderStats };
  },
});

// Exported queries = baseQueries + dashboardStats
export const queries = { ...baseQueries, dashboardStats } as const;

// Cache invalidation helpers
await invalidateUsers(true); // Invalidate + eager refetch
await invalidateProducts(); // Invalidate only
await invalidateOrders(true); // Invalidate + eager refetch
await invalidateAllDashboard(); // Nuclear option — clear everything

// Prefetch helpers for detail bundles
prefetchOrderDetailBundle(order); // order + linked user + linked products
prefetchUserDetailBundle(user); // user + recent orders
prefetchProductDetailBundle(product); // product + related orders
prefetchOrderDetailsFromList(orders); // Budgeted batch prefetch
prefetchUserDetailsFromList(users);
prefetchProductDetailsFromList(products);

// Shared deletion utilities
await deleteOrder(orderId); // Fetch → delete → invalidate → return order
await deleteProduct(productId);
await deleteUser(userId);
```

## Islands (Client-Side Interactivity)

### Top-Level Islands

| Island                    | Purpose                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| `Counter.tsx`             | Simple counter demo                                                                             |
| `Defer.ts`                | Defer island bootstrap                                                                          |
| `JobsWidget.tsx`          | Real-time job monitoring via SSE (signals, topic filtering, status colors, duration formatting) |
| `LiveExecutionsTable.tsx` | Live execution table with real-time updates                                                     |
| `ManualTrigger.tsx`       | Manual saga triggering                                                                          |
| `OrderItems.tsx`          | Order items display                                                                             |
| `RunJobButton.tsx`        | Manual job execution trigger                                                                    |
| `SagaInstanceList.tsx`    | Saga instance browser                                                                           |
| `SagaLinkedJobs.tsx`      | Jobs linked to a saga instance                                                                  |
| `SagaStateViewer.tsx`     | JSON state inspector for sagas                                                                  |
| `SagaTimeline.tsx`        | Saga event timeline                                                                             |
| `TaskTriggerButton.tsx`   | Manual task trigger button                                                                      |
| `TasksWidget.tsx`         | Tasks dashboard widget                                                                          |
| `TaurifyNavLink.tsx`      | Desktop navigation link (Taurify-aware)                                                         |
| `TaurifyTest.tsx`         | Taurify integration test                                                                        |
| `Toast.tsx`               | Global notifications (success, error, info, warning)                                            |
| `TriggerButton.tsx`       | Trigger execution button                                                                        |
| `TriggersWidget.tsx`      | Triggers dashboard widget                                                                       |

### Island Subdirectories

| Path                                         | Contents                                    |
| -------------------------------------------- | ------------------------------------------- |
| `islands/Data/Stats.tsx`                     | Stats data island                           |
| `islands/components/ResultPreviewDialog.tsx` | Dialog for previewing job execution results |
| `islands/components/TopicSelector.tsx`       | SSE topic filter selector                   |

## SSE Connection Pattern

```tsx
// utils/jobs/store.ts — Signal-based global store
import { signal } from '@preact/signals';

export const jobsSSEState = {
  connected: signal(false),
  jobs: signal<JobDefinition[]>([]),
  allTopics: signal<string[]>([]),
  runningExecutions: signal<ExecutionRecord[]>([]),
  recentExecutions: signal<ExecutionRecord[]>([]),
  error: signal<string | null>(null),
  lastUpdate: signal<string | null>(null),
  topic: signal<string>('all'),
};

// utils/jobs/connection.ts — SSE lifecycle
function useSSEConnection() { ... }

// routes/api/jobs.ts — Server-side SSE
// Uses oRPC workersClient.subscribe() event iterator
// Transforms to standard SSE format with:
//   - OpenTelemetry tracing
//   - Last-Event-ID reconnection support
//   - Optional topic and jobId filtering
//   - Graceful client disconnect handling
```

## UI Components

### Dashboard Components (`routes/(dashboard)/(_components)/`)

| Component                                                     | Purpose                      |
| ------------------------------------------------------------- | ---------------------------- |
| `users-table.tsx` / `products-table.tsx` / `orders-table.tsx` | List tables                  |
| `user-form.tsx` / `product-form.tsx` / `order-form.tsx`       | CRUD forms                   |
| `user-profile.tsx`                                            | User profile display         |
| `stats-card.tsx`                                              | Reusable stat card           |
| `pagination.tsx`                                              | Pagination controls          |
| `breadcrumb.tsx`                                              | Breadcrumb navigation        |
| `loading-spinner.tsx`                                         | Loading indicator            |
| `filters/`                                                    | Search and filter components |

### App-Level Components (`components/`)

| Path                    | Purpose                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `components/Button.tsx` | Shared button component                                                               |
| `components/Toast.tsx`  | Toast notification component                                                          |
| `components/icons/`     | Icon components                                                                       |
| `components/ui/`        | UI primitives: `button.tsx`, `input.tsx`, `select.tsx`, `label.tsx`, `form-field.tsx` |

## Vite Configuration

The frontend uses `createNetScriptVitePlugin()` from `@netscript/fresh/vite` alongside Fresh and
Tailwind plugins:

```tsx
// vite.config.ts
import { createNetScriptVitePlugin } from '@netscript/fresh/vite';

export default defineConfig(({ mode }) => ({
  server: {
    port: Number.parseInt(env.NETSCRIPT_VITE_PORT ?? process.env.PORT ?? '5173', 10),
    host: env.NETSCRIPT_VITE_HOST ?? '0.0.0.0',
  },
  plugins: [
    fresh(),
    tailwindCSS(),
    createNetScriptVitePlugin({
      appRoot,
      workspaceRoot,
      aliasDirectories: ['assets', 'components', 'islands', 'lib', 'routes'],
      watchPaths: [resolve(workspaceRoot, 'packages'), resolve(workspaceRoot, 'contracts')],
      routeManifest: {},
    }),
  ],
}));
```

**Plugin features:**

- `@app/` alias resolution for app-local imports
- Workspace root filesystem access for cross-package imports
- Watch paths for packages and contracts (triggers HMR on upstream changes)
- Route manifest auto-generation with debounced file watching
- Dynamic env var mapping (`NETSCRIPT_VITE_PORT`, `NETSCRIPT_VITE_HOST`)
- SSR externals: `ioredis`, `redis-errors`, `@fedify/redis`, `@prisma/client`, `pg`, `mssql`
- SSR bundled: `@netscript/sdk`, `@plugins/workers/contracts`, `@plugins/triggers/contracts`
- Rollup externals: `@prisma/client` (except browser-safe runtime), `mssql`, `node:` builtins

## Frontend Import Map

The frontend `deno.json` maps workspace packages to local paths:

| Import Specifier              | Target                                      |
| ----------------------------- | ------------------------------------------- |
| `@netscript/sdk`              | `../../packages/sdk/mod.ts`                 |
| `@netscript/fresh`            | `../../packages/fresh/mod.ts`               |
| `@netscript/fresh/vite`       | `../../packages/fresh/config/vite.ts`       |
| `@contracts`                  | `../../contracts/mod.ts`                    |
| `@plugins/workers`            | `../../plugins/workers/contracts/v1/mod.ts` |
| `@plugins/workers/contracts`  | `../../plugins/workers/contracts.ts`        |
| `@plugins/sagas/contracts`    | `../../plugins/sagas/contracts.ts`          |
| `@plugins/triggers/contracts` | `../../plugins/triggers/contracts.ts`       |
| `@netscript/telemetry`        | `../../packages/telemetry/mod.ts`           |
| `@netscript/kv`               | `../../packages/kv/mod.ts`                  |
| `@netscript/contracts`        | `../../packages/contracts/mod.ts`           |

## Fresh 2 Conventions

| Convention                                            | Purpose                                                                 |
| ----------------------------------------------------- | ----------------------------------------------------------------------- |
| `f-client-nav`                                        | SPA-style navigation (on root `<body>`)                                 |
| `f-partial`                                           | Partial form submissions                                                |
| `Partial` component                                   | Server-rendered region boundaries                                       |
| `define.page()` / `define.handlers()`                 | Type-safe route definitions                                             |
| `skipAppWrapper: true` / `skipInheritedLayouts: true` | Partial configuration                                                   |
| `(groupName)/`                                        | Route groups with shared layout (`_layout.tsx`)                         |
| `(_components)/`                                      | Non-route component directories (parenthesized = excluded from routing) |

## Utils Directory

| File                           | Purpose                                                           |
| ------------------------------ | ----------------------------------------------------------------- |
| `utils/dashboard-queries.ts`   | Composite queries, cache invalidation, prefetch, deletion helpers |
| `utils/workers-queries.ts`     | Workers/jobs query utilities                                      |
| `utils/sagas-queries.ts`       | Saga query utilities                                              |
| `utils/triggers-queries.ts`    | Trigger query utilities                                           |
| `utils/defer-policy.ts`        | Defer policy configuration                                        |
| `utils/detail-loaders.ts`      | Shared detail page loader patterns                                |
| `utils/detail-query-params.ts` | Query param builders for detail pages                             |
| `utils/query-policy.ts`        | Query caching policy                                              |
| `utils/prewarm.ts`             | Cache prewarm utilities                                           |
| `utils/store.ts`               | Global store utilities                                            |
| `utils/jobs/store.ts`          | Jobs SSE signal store                                             |
| `utils/jobs/connection.ts`     | SSE connection lifecycle                                          |
| `utils/commands/`              | Command utilities                                                 |
| `utils/tasks/`                 | Task-specific utilities                                           |
| `utils/triggers/`              | Trigger-specific utilities                                        |
