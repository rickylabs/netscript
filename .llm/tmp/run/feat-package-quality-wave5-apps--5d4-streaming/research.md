# 5d4 Streaming — Research

Run: `feat/package-quality-wave5-apps--5d4-streaming` · PR #37 · phase 1 of 2: RESEARCH ONLY.

Status: skeleton created; findings appended incrementally.

## Reused from prior run

Prior trace: `.llm/tmp/run/openhands/pr-37/run-27442077218-1/`. Summary claims "no artifact files" and false completion; measured findings retained and verified/refreshed below.

- [ ] 113 combined `deno doc --lint` errors for `./defer` + `./streams` + server streaming files (refresh).
- [ ] Abort gap: `createIncrementalStreamingResponse` only calls `signal.throwIfAborted()` in `cancel`.
- [ ] Cleanup: `sse.ts` has AbortController + keepalive cleanup.
- [ ] Private-type refs: `JSXInternal`, `WatchableKv`, `KvKey`, `ComponentChildren`.
- [ ] Divergence: prior run found only 3 files importing streams packages; supervisor hint says ~27 fresh files reference plugin-streams. **VERIFY and resolve.**

## MEASURE-FIRST

### Scope

Measure directly:
- `packages/fresh/defer/mod.ts`
- `packages/fresh/streams/mod.ts`
- `packages/fresh/server/sse.ts`
- `packages/fresh/server/stream.ts`
- `packages/fresh/server/stream-error-boundary.tsx`

Also:
- `deno check --unstable-kv` over the package entrypoints.
- Over-cap inventory (F-1 layer caps) for the above surfaces.
- Private-type refs (exact symbols + sites).

### doc-lint baseline

Combined command:

```bash
deno doc --lint ./defer/mod.ts ./streams/mod.ts ./server/sse.ts ./server/stream.ts ./server/stream-error-boundary.tsx
```

Result:

| Metric | Value |
|--------|-------|
| Total doc-lint errors | **113** |
| missing-jsdoc | 63 |
| private-type-ref | 50 |

This verifies the prior run's 113 combined baseline.

Per-file breakdown:

| Entrypoint | total | missing-jsdoc | private-type-ref |
|------------|-------|---------------|------------------|
| `./defer/mod.ts` | 60 | 46 | 14 |
| `./streams/mod.ts` | 32 | 8 | 24 |
| `./server/sse.ts` | 3 | 0 | 3 |
| `./server/stream.ts` | 7 | 4 | 3 |
| `./server/stream-error-boundary.tsx` | 11 | 5 | 6 |
| **Combined** | **113** | **63** | **50** |

### deno check --unstable-kv

```bash
deno check --unstable-kv ./defer/mod.ts ./streams/mod.ts ./server/sse.ts ./server/stream.ts ./server/stream-error-boundary.tsx
```

Result: exit 0, no errors (only the persistent `Warning No matching files found.` from Deno when a glob is not expanded; not a type error).

### Over-cap inventory

Scoped streaming source sizes (lines):

| File | Lines | Cap note |
|------|-------|----------|
| `defer/mod.ts` | 14 | ok |
| `streams/mod.ts` | 34 | ok |
| `defer/DeferIsland.tsx` | 240 | likely F-1 layer-cap candidate |
| `defer/DeferPage.tsx` | 264 | likely F-1 layer-cap candidate |
| `defer/policy.ts` | 175 | ok |
| `defer/telemetry.ts` | 197 | ok |
| `defer/Deferred.tsx` | 75 | ok |
| `streams/create-stream-db.ts` | 70 | ok |
| `server/sse.ts` | 408 | likely F-1 layer-cap candidate |
| `server/stream.ts` | 220 | ok |
| `server/stream-error-boundary.tsx` | 75 | ok |

TODO: confirm exact layer-cap threshold and split candidates.

### Private-type refs

Confirmed private-type-ref symbols (from combined output):

| Symbol | Site | Proposed fix |
|--------|------|--------------|
| `JSXInternal` / `JSXInternal.Element` | `defer/DeferPage.tsx:34` (`DeferPageProps.component`) | Use public `preact.JSX.Element` or re-export from `@netscript/fresh` internal types. |
| `ComponentChildren` | `server/stream-error-boundary.tsx:19,60` (`StreamErrorBoundaryProps.children` and `render`) | Import public `ComponentChildren` from `preact` or re-export. |
| `WatchableKv` | `streams/create-stream-db.ts`, `defer/policy.ts` | Re-export from `@netscript/plugin-streams-core` public API or `@netscript/fresh/streams`. |
| `KvKey` | `streams/create-stream-db.ts`, `defer/policy.ts` | Re-export from `@netscript/plugin-streams-core` public API or `@netscript/fresh/streams`. |

TODO: verify exact line numbers and whether umbrella or core should own the re-export.

## Abort / cleanup / backpressure audit

TODO: read files and fill table.

| Surface | File(s) | AbortSignal propagation | Backpressure | Disconnect cleanup | Gap |
|---------|---------|------------------------|--------------|--------------------|-----|
| DeferIsland | `defer/DeferIsland.tsx` | TODO | TODO | TODO | |
| DeferPage | `defer/DeferPage.tsx` | TODO | TODO | TODO | |
| Deferred | `defer/Deferred.tsx` | TODO | TODO | TODO | |
| policy.ts | `defer/policy.ts` | TODO | TODO | TODO | |
| sse.ts | `server/sse.ts` | TODO | TODO | TODO | |
| stream.ts | `server/stream.ts` | TODO | TODO | TODO | |
| create-stream-db.ts | `streams/create-stream-db.ts` | TODO | TODO | TODO | |

## Plugin-streams coupling map

Goal: exact exports of `@netscript/plugin-streams` and `@netscript/plugin-streams-core` consumed in `@netscript/fresh`, and resolution of the 3-vs-27 divergence.

### Resolution of 3-vs-27 divergence

- **Inside `packages/fresh/` source**: only **1 file** directly imports from streams packages:
  - `streams/create-stream-db.ts:18` → `buildStreamUrl`, `getStreamsAuth`, `getStreamsUrl` from `@netscript/plugin-streams-core`.
- **Repo-wide direct imports of `@netscript/plugin-streams-core`**: **27 occurrences** across `packages/` + `plugins/`.
- These 27 are **not** all inside `@netscript/fresh`; they span plugin factories, producers, schemas, diagnostics, telemetry, and the SDK.
- The supervisor hint of "~27 fresh files referencing plugin-streams" appears to mean "fresh (as in newly authored) files in the streaming surface across packages/plugins", not files inside the `@netscript/fresh` package.
- Divergence resolved: the prior run's count of "3 files" likely included the `deno.json` import-map line + source files within `@netscript/fresh`, while the ~27 count is repo-wide streams-surface references.

### Consumer table (scope: `@netscript/fresh` only)

| Consumer file | Imported package | Symbols | Usage |
|---------------|------------------|---------|-------|
| `streams/create-stream-db.ts` | `@netscript/plugin-streams-core` | `buildStreamUrl`, `getStreamsAuth`, `getStreamsUrl` | Build durable-streams URL and inject auth headers |

### Consumer table (repo-wide streaming surface)

The 27 repo-wide references cluster as:

| Area | Files | Symbols |
|------|-------|---------|
| `@netscript/fresh/streams` | `create-stream-db.ts` | `buildStreamUrl`, `getStreamsAuth`, `getStreamsUrl` |
| `@netscript/sdk/streams` | `packages/sdk/streams.ts` | exports from `plugin-streams-core` |
| Plugin client factories | `plugins/workers/streams/factory.ts`, `plugins/sagas/streams/factory.ts`, `plugins/triggers/streams/factory.ts` | `buildStreamUrl`, `getStreamsAuth` |
| Plugin producers | `plugins/sagas/streams/producer.ts`, `plugins/triggers/streams/producer.ts`, `packages/plugin-workers-core/src/streams/producer.ts` | `createDurableStream`, `DurableStreamProducer`, `StreamProducerPort` |
| Plugin schemas | `packages/plugin-sagas-core/src/streams/schema.ts`, `packages/plugin-workers-core/src/streams/schema.ts`, `plugins/triggers/streams/schema.ts` | `defineStreamSchema` |
| Diagnostics / telemetry | `packages/plugin-streams-core/src/diagnostics/inspect-stream-topic.ts`, `packages/plugin-streams-core/src/telemetry/instrumentation.ts`, `plugins/streams/src/public/mod.ts` | package self-references |
| Testing | `packages/plugin-streams-core/src/testing/memory-stream-producer.ts` | self-reference |
| E2E probes | `plugins/streams/src/e2e/probes/subscribe.ts`, `plugins/streams/src/e2e/probes/publish.ts` | `createDurableStream`, `defineStreamSchema` |

TODO: confirm whether the design should route all `@netscript/fresh` consumers through `sdk/streams` rather than direct `plugin-streams-core` import.

## Telemetry baseline

### Current spans in `defer/telemetry.ts`

| Span name | Kind | Caller | Attributes / Events |
|-----------|------|--------|---------------------|
| `defer.prewarm.dispatch` | `INTERNAL` | `prewarmPartial()` | region, reason, action URL, partial URL; on complete: status, ok, duration. |
| `defer.cache.read` | `INTERNAL` | `DeferPage` | cache state, staleness, fallback-visible timing, policy profile. |
| `defer.client.decision` | `INTERNAL` | `DeferComponent` | decision (`submit`/`skip`), reason, freshness state. |
| `stream.render` | `INTERNAL` | `emitStreamRenderSpan()` | route pattern, boundary count, layer count, duration, error count. |

### Missing streaming telemetry

- **TTFB** (Time to First Byte): no span records first chunk / first HTML byte flushed to the network.
- **Chunk timing**: per-chunk `stream.chunk.flushed_ms` event is absent.
- **Boundary-resolution timing**: no per-Suspense-boundary span or event (`stream.boundary.resolved`).
- **Abort / disconnect**: no `stream.client.disconnect` or `stream.cancel` event.
- **Backpressure / buffer health**: no bytes-queued / backpressure events.
- **Transport-layer coupling**: `createIncrementalStreamingResponse` does not emit telemetry; `createStreamingResponse` only via external `emitStreamRenderSpan` wrapper.

TODO: align attribute naming with 5d1 cross-cutting convention (PR #34) once that lands.

## Market comparison

| Framework | Streaming primitive | Abort/cleanup model | Telemetry / metrics exposed |
|-----------|--------------------|--------------------|------------------------------|
| **React 18 `renderToReadableStream`** | `ReadableStream` with inline Suspense boundary chunks | `signal` passed to renderer; boundary errors fall through to `onError`; stream can be `cancel()`ed | None built-in; users wrap with OpenTelemetry/Custom |
| **Next.js App Router** | `renderToReadableStream` wrapped in edge/node handlers; generates streaming flight + HTML | Request `AbortSignal` wired to stream; `onShellReady`/`onAllReady` | Next.js collects `started`, `flushed`, `completed` phases in `next/client` spans; not user exposed by default |
| **Remix `defer()`** | Promises wrapped in `<Deferred>`; shell + deferred scripts | Uses web `Response` stream; relies on platform `AbortSignal`; `ErrorBoundary` per deferred block | None built-in; relies on hosting platform logs |
| **TanStack Start streaming loaders** | Streamed promises resolved via `Suspense` on client; serialized promise state stream | `AbortSignal` from loader context; cancellation up to loader | Not standardized; framework adapters may emit loader timing |

Key takeaways for 5d4:
1. TTFB and per-chunk timing are universally left to user instrumentation — opportunity for NetScript to standardize.
2. Boundary-level error isolation is handled via framework error boundaries (Next.js error.js, Remix `<ErrorBoundary>`, React class boundaries). `StreamErrorBoundary` is aligned but not yet integrated into `createStreamingResponse`.
3. Abort propagation should flow from request `AbortSignal` into `renderToReadableStream` and into any incremental chunk generators.

## Abort / cleanup / backpressure audit

### Surface table

| Surface | AbortSignal source | Propagated to | Cleanup on cancel | Backpressure handling | Gap |
|---------|-------------------|---------------|-------------------|----------------------|-----|
| `defer/DeferPage.tsx` `prewarmPartial` | N/A (fire-and-forget fetch) | Not applicable | `fetch()` request has no explicit abort; leak risk if client disconnects | None | No AbortSignal/timeout on prewarm fetch; no ceiling on concurrent prewarms |
| `defer/DeferIsland.tsx` `useEffect` | N/A (client form submit) | Not applicable | Effect teardown not used; form submit is synchronous | N/A | Could abort in-flight fetch on unmount |
| `defer/policy.ts` | N/A | N/A | N/A | N/A | No runtime lifecycle |
| `server/sse.ts` `createSSEStream` | Local `AbortController` | Passed to handler | `cancel()` aborts controller and clears keepalive timer | `enqueue()` exceptions caught; no explicit backpressure signal | `ReadableStream` should accept a `highWaterMark`; handler's `signal` should also listen to request `AbortSignal` |
| `server/sse.ts` `createKvWatchSSE` | Local controller + `kv.watch({ signal })` | `kv.watch` / `kv.watchPrefix` | Cancels via signal; clears timer | None explicit | If `kv.watch` rejects non-AbortError it rethrows after handler catch; need audit of `WatchableKv` behavior |
| `server/stream.ts` `renderToStream` | Caller `options.signal` | `renderStream.cancel()` | Removes `abort` listener; calls `cancel()` | Delegated to Preact stream | Does not pass `signal` into `renderToReadableStream` itself; only external cancellation |
| `server/stream.ts` `createStreamingResponse` | Caller `options.signal` | `renderToStream` | Same as above | Same as above | No request-signal auto-wire |
| `server/stream.ts` `createIncrementalStreamingResponse` | Caller `options.signal` | Only `throwIfAborted()` in `cancel` | Cancels async generator implicitly via `ReadableStream.cancel` | None; chunks settled with `Promise.race` can pile up | **Critical gap**: `signal` is never checked during streaming; only at cancel time. No abort of pending chunk renders. |
| `streams/create-stream-db.ts` | N/A | N/A | N/A | N/A | Transport layer handled by `@durable-streams/state` |

### Key findings
- `createIncrementalStreamingResponse` only calls `signal.throwIfAborted()` inside `cancel` — confirmed prior-run finding.
- `sse.ts` creates a local `AbortController` but does not expose request-signal wiring; handler receives only local signal.
- `createSSEStream` keepalive timer cleanup is duplicated in `close()` and `cancel()`; could be centralized in a single `dispose()` helper.
- No surface applies `ReadableStream` backpressure (`highWaterMark`, `desiredSize`, or `pull` strategy).

## Drift candidates

See `drift.md`. Append-only entries `D-5d4-n`.
