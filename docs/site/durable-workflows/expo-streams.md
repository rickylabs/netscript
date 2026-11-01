---
layout: layouts/base.vto
title: Consume durable streams in Expo
templateEngine: [vento, md]
order: 4
---

# Consume durable streams in Expo

This guide renders server-owned execution state in a React Native screen with the SDK's stream
consumer entries. The phone reads the durable log; workers, sagas, and triggers keep running on the
server when it disconnects.

## Connect a typed collection

1. Import `createStreamCollectionV1` from `@netscript/sdk/streams/collections`.
2. Pass it the full stream URL, an injected streaming fetch, a State Protocol `type`, an entity
   validator (`parse`), and a primary-key extractor (`getKey`).
3. In a React component, pass `binding.collection` to `useStreamLiveQueryV1` from
   `@netscript/sdk/streams/react`. It subscribes through TanStack's collection live-query overload.
4. Create the binding in a screen-owned effect, and call `await binding.dispose()` during teardown.

The binding uses the same TanStack DB engine as the web streams surface. Committed entity changes
update live queries directly, without query invalidation, refetch, or polling. Insert, update, and
upsert operations must carry full entity state; delete changes omit `value`. Events for other
collection types are ignored. Parsing and key agreement finish before writes begin, and an invalid
entity stops the source and rejects `binding.done`.

### Lifecycle and failure

- `dispose()` is idempotent. It closes the source, cancels transport work, and releases the
  collection.
- Observe `binding.done` for terminal consumption failures.
- Before readiness, `collection.preload()` rejects with a fatal source or entity-validation failure
  instead of waiting forever. The failed collection is cleaned up and its status becomes
  `cleaned-up`. `collection.utils.getError()` keeps the error, and the React hook returns
  `status: 'error'`, `isLoading: false`, and `error`, which it can still render after a remount.
- The binding is single-use. After `cleanup()` or `dispose()`, starting sync or subscribing again
  requires a new binding.
- Successful readiness waits for a control that reports `upToDate` or `streamClosed`.

### Typed queries

`StreamCollectionV1<T>` is the SDK's typed read and lifecycle port over the upstream collection.
Before you use TanStack's query builder, narrow it with `isCollection` and keep the validated entity
type in a typed local. Filtered and projected queries then keep their types without assertions:

```ts
import type { StreamCollectionV1 } from '@netscript/sdk/streams/collections';
import { createLiveQueryCollection, eq, isCollection } from '@tanstack/db';
import type { Collection } from '@tanstack/db';

declare const executions: StreamCollectionV1<{ id: string; status: string }>;
if (!isCollection(executions)) throw new TypeError('Expected a TanStack collection');
const collection: Collection<{ id: string; status: string }, string> = executions;
const running = createLiveQueryCollection({
  query: (q) =>
    q.from({ execution: collection })
      .where(({ execution }) => eq(execution.status, 'running'))
      .select(({ execution }) => ({ id: execution.id, status: execution.status })),
});
await running.cleanup();
```

## Choose the materializer

The Expo binding and Fresh StreamDB are separate adapters over TanStack DB. Sharing the query engine
does not make their schemas, transports, or failure states interchangeable:

| Concern        | SDK `createStreamCollectionV1`                                                                                 | Fresh `createNetScriptStreamDB`                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Input contract | One State Protocol `type`, full-entity `parse`, and `getKey`; other types ignored                              | Multi-type `StateSchema` passed to `@durable-streams/state` `createStreamDB`                          |
| Transport      | Existing DOM-independent SDK fetch source and stream-core v1 framing/binding; full URL and host fetch required | `@durable-streams/client` transport with NetScript URL/auth resolution and the Fresh recovery adapter |
| Recovery       | Non-success HTTP responses retry with refreshed credentials until cancellation; finite buffer and delay caps   | A finite outage retry budget; permanent auth/protocol failures stop immediately                       |
| Failure        | `done` and pending `preload()` reject; collection is cleaned up; hook exposes `error` and leaves loading       | Recovery adapter exposes `failed`; collections belong to the upstream StreamDB                        |
| Lifecycle      | `binding.dispose()` is awaitable and idempotent; a cleaned-up collection cannot restart its source             | Database-level preload, status, and stop/dispose hooks own the default consumer                       |

Use the SDK adapter for an injected Expo fetch and a single validated entity type. Use Fresh
StreamDB for its schema-based web database and recovery contract. Both support TanStack query
composition, and neither supplies the other's lifecycle or recovery policy.

## Inject Expo fetch

The
[Expo reference app](https://github.com/rickylabs/netscript/tree/main/resources/examples/expo-streams)
contains the complete screen, a typed execution contract, and a checked `expo/fetch` wrapper. Its
data layer needs only NetScript imports. The host wrapper forwards GET, headers, and the abort
signal. Expo's request body type is narrower than WHATWG `RequestInit`, so do not forward arbitrary
request bodies. `FetchResponse` satisfies the SDK's `StreamFetchResponseV1` subset without a cast,
and its body is read incrementally. See
[Expo's streaming fetch documentation](https://docs.expo.dev/versions/v57.0.0/sdk/expo/#expofetch-api).

Use `authHeaders` to resolve credentials on every connection. The injected source keeps finite
heartbeat, framing, pending-event, and reconnect-delay budgets. Persistent non-success HTTP
responses retry until cancellation, so abort when the user's session expires.

## Resume and readiness

Data waits for a validated control before materialization. Reconnect uses the last committed opaque
`offset`, plus SSE `Last-Event-ID` when present. A disconnect before control discards the incomplete
batch, and replay re-delivers it once the server honors that offset. The collection stays mounted
across connections. `binding.snapshot()` exposes replay progress after each successful batch.

A new app instance starts at `offset=-1` to rebuild the collection. Reusing a cursor without its
materialized rows skips earlier state, so if you add persistence, store rows and cursor together.
The binding does not synthesize state that is missing from the server's retained log.

## Verify native portability

The reference app includes an executable Hermes probe for `AbortSignal.throwIfAborted`,
`AbortSignal.reason`, streaming `TextDecoder`, `URL.searchParams` including `set`, and
`ReadableStream.getReader`. Run the native app, inspect the probe output, and force a stream
disconnect while you watch execution updates.

{{ comp callout { type: "important", title: "Native behavior is unverified" } }}
Deno tests prove the binding works without <code>EventSource</code>. They do not prove native runtime behavior, and Hermes and Expo network behavior has not yet been verified on a device.
{{ /comp }}

## Next steps

Look up `createStreamCollectionV1` and `useStreamLiveQueryV1` in the [SDK reference](/reference/sdk/).
