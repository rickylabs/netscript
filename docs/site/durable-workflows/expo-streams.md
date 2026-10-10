---
layout: layouts/base.vto
title: Consume durable streams in Expo
templateEngine: [vento, md]
---

# Consume durable streams in Expo

Use the SDK's focused consumer entries to render server-owned execution state in React Native. The
phone reads the durable log; workers, sagas, and triggers continue on the server when it
disconnects.

## Connect a typed collection

Import `createStreamCollectionV1` from `@netscript/sdk/streams/collections`. Pass the full stream
URL, an injected streaming fetch, a State Protocol `type`, an entity validator (`parse`), and a
primary-key extractor (`getKey`). Use `@netscript/sdk/streams/react`'s `useStreamLiveQueryV1` inside
a React component with `binding.collection`. It subscribes through TanStack’s collection live-query
overload.

The binding uses the same TanStack DB as the web streams surface. Committed entity changes update
live queries directly, without query invalidation, refetch, or polling. It expects full entity state
for insert, update, and upsert operations. Delete changes omit `value`. Events for other collection
types are ignored. Parsing and key agreement finish before writes begin; invalid entities stop the
source and reject `binding.done`.

Keep the binding in a screen-owned effect, and call `await binding.dispose()` during teardown.
Dispose is idempotent, closes the source, cancels transport work, and releases the collection.
Observe `binding.done` for terminal consumption failures. Query status remains `loading` until a
control reports `upToDate` or `streamClosed`.

## Inject Expo fetch

The
[Expo reference app](https://github.com/rickylabs/netscript/tree/main/resources/examples/expo-streams)
contains the complete screen, typed execution contract, and a checked `expo/fetch` wrapper. Its data
layer needs only NetScript imports. The host wrapper forwards GET, headers, and the abort signal;
Expo's request body type is narrower than WHATWG `RequestInit`, so do not forward arbitrary request
bodies. `FetchResponse` satisfies the SDK's `StreamFetchResponseV1` subset without a cast and its
body is read incrementally. See
[Expo's streaming fetch documentation](https://docs.expo.dev/versions/v57.0.0/sdk/expo/#expofetch-api).

Use `authHeaders` to resolve credentials on every connection. The underlying injected source keeps
finite heartbeat, framing, pending-event, and reconnect-delay budgets. Persistent non-success HTTP
responses retry until cancellation; callers should abort when their session expires.

## Resume and readiness

Data waits for a validated control before materialization. Reconnect uses the last committed opaque
`offset`, plus SSE `Last-Event-ID` when present. A disconnect before control discards the incomplete
batch; replay re-delivers it once the server honors that offset. The collection stays mounted across
connections. `binding.snapshot()` exposes replay progress after successful batch application.

A new app instance starts at `offset=-1` to reconstruct the collection. Reusing a cursor without its
materialized rows skips earlier state. Retain rows and cursor together if you add persistence. This
binding does not synthesize state missing from a server's retained log.

## Verify native portability

The reference includes an executable Hermes probe for `AbortSignal.throwIfAborted`,
`AbortSignal.reason`, streaming `TextDecoder`, `URL.searchParams` including `set`, and
`ReadableStream.getReader`. Run the actual native app, inspect its probe output, and force a stream
disconnect while observing execution updates. Deno tests prove the binding works without
`EventSource`; they do not prove native runtime behavior. Native Hermes and Expo network acceptance
remain pending until that device run is recorded.
