/**
 * `@netscript/fresh` provides Fresh runtime extensions, page builders, form primitives, and route contracts for NetScript.
 *
 * Subpath exports:
 * - `.`: page-loader cache helpers and entry re-exports
 * - `./builders`: type-safe page and layout definition wrappers
 * - `./route`: route contracts, loader context, and handler primitives
 * - `./form`: server action and form handling primitives
 * - `./defer`: deferred server rendering and stream state utilities
 * - `./query`: Preact Query integration and hydration helpers
 * - `./server`: Fresh server setup, middleware, and plugin runtime
 * - `./streams`: client-side durable event stream consumers and hook helpers
 * - `./ai`: AI assistant endpoints, stream hooks, and tool integration
 * - `./ai/sandbox`: client-side AI code execution sandbox runtime
 * - `./interactive`: interactive Preact client component utilities
 * - `./vite`: Vite development server and build plugin integration
 * - `./error`: diagnostic error boundaries and error formatting helpers
 * - `./desktop`: desktop window container and IPC bridge helpers
 * - `./testing`: route loader testing and assertion harness helpers
 *
 * For visual UI components and design system primitives, see `@netscript/fresh-ui`. Visual components are copied into your app (via `ui:add`), not imported from the package.
 *
 * Read your generated app's scaffold (`routes/` and `components/ui/mod.ts`) to see the intended app structure and usage patterns; package docs describe API symbols and types.
 *
 * @module
 */
export {
  type CachedListEntryLike,
  type CacheEntryLike,
  hasAllCacheEntries,
  minCachedAt,
  projectCachedItemFromList,
} from './src/application/cache-entries/mod.ts';
