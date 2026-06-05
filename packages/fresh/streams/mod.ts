/**
 * `@netscript/fresh/streams` — Client SDK for E2E durable streams.
 *
 * This subpath provides:
 * - `createNetScriptStreamDB()` — generic TanStack DB-backed StreamDB factory
 *   (wraps `@durable-streams/state` with NetScript URL resolution + auth)
 * - `useLiveQuery` / `useLiveSuspenseQuery` from `@tanstack/react-db`
 *   (works via `preact/compat` in Fresh islands)
 * - Re-exports of useful types from `@durable-streams/state`
 *
 * Plugin-specific factories (`createWorkersStreamDB`, etc.) live in their
 * respective plugin packages and import from here via `@netscript/fresh/streams`.
 *
 * @module
 */

// Generic framework factory
export {
  createNetScriptStreamDB,
  type NetScriptStreamDBOptions,
} from './create-stream-db.ts';

// Live-query hooks — re-exported from @tanstack/react-db (Preact-compatible
// via "react"→"preact/compat" import-map alias in apps/playground/deno.json)
export { useLiveQuery, useLiveSuspenseQuery } from '@tanstack/react-db';

// Useful types from @durable-streams/state
export type {
  StateSchema,
  StreamDB,
  StreamStateDefinition,
  CollectionDefinition,
} from '@durable-streams/state';

