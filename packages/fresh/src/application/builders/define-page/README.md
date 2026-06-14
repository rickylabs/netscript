# `definePage<TState = EmptyRecord>()`

Canonical composable page builder for `@netscript/fresh`.

## Import

- `import { definePage } from '@netscript/fresh';`

## What it supports today

- typed request `state`
- ordered resource resolution with `withResource()` / `withResources()`
- path/search parsing via schema-like `safeParse()` hooks
- layered rendering with `withLayer()`
- custom layouts via `withLayout()`
- canonical current-route hooks via `usePageRoute()`, `usePagePath()`, and `usePageSearch()`
- typed page-bound hook bundles via `createDefinePageHooks()` / `route.hooks`
- metadata via `withMeta()`
- response headers/status via `withHeader()` and `withStatus()`
- method handlers via `withHandler()`

## Example

```ts
const usersPage = definePage<AppState>()
  .withResource('session', ({ state }) => state.session)
  .withLayer('panel', UsersPanel, ({ resource }) => ({
    userId: resource('session').userId,
  }))
  .withLayout((slots) => <main>{slots.panel()}</main>)
  .build({ routePattern: '/dashboard/users/[id]' });
```

## Notes

- `withHeader()` / `withStatus()` generate a `GET` handler that uses `ctx.render()`.
- Do not combine `withHandler('GET', ...)` with `withHeader()` or `withStatus()`.
- This is the canonical target replacing route-specific page presets over time.
- `.build()` without a route pattern returns an unrouted page definition (`page`, `default`, and
  optional `handler`).
- `.build({ routePattern })`, `.build('/path')`, and `.withRoute(...).build()` return a routed page
  definition that additionally exposes `route`, `nav`, and `hooks`.
- The builder's generic type state is carried by TypeScript for inference; it is not intended as a
  meaningful runtime API surface.
- Prefer `route.hooks.use*()` for typed access to page state, resources, layers, slots, and context
  inside a routed `definePage()` render tree.
- Use `usePageRoute()`, `usePagePath()`, and `usePageSearch()` as value-level APIs for the canonical
  current-page route contract. They do not require a separately exported page-specific route alias.
- Omit the generic entirely when the route does not need custom request state: `definePage()`.

## Related files

- public entry: `packages/fresh/src/application/builders/define-page/mod.ts`
- builder: `packages/fresh/src/application/builders/define-page/builder/mod.tsx`
- request/runtime pipeline: `packages/fresh/src/application/builders/define-page/runtime/mod.tsx`
- tests: `packages/fresh/src/application/builders/define-page/tests/`
