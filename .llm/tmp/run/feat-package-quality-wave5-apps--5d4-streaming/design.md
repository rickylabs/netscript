# Design — 5d4 streaming (defer + PSR + e2e streams)

## Run metadata

| Field          | Value                                                  |
| -------------- | ------------------------------------------------------ |
| Run ID         | feat-package-quality-wave5-apps--5d4-streaming         |
| Branch         | `feat/package-quality-wave5-apps--5d4-streaming`       |
| Phase          | Design + Plan (Phase 2 of 2)                             |
| Target package | `@netscript/fresh`                                     |
| Archetype      | Archetype 3 — Runtime / Behavior                      |
| Scope overlays | `SCOPE-frontend`                                       |

## Doctrine baseline

- Verdict for `@netscript/fresh` from `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`: **Restructure**.
- Top-priority remediation: split `builders/mod.ts` (1,110 LOC) per builder concern; add subpath exports.
- This wave only touches **defer + streams + server streaming helpers**. It must not expand the restructure debt; it may record new debt if unavoidable.

## Axioms in play

| Axiom | Why it governs this design |
| ----- | -------------------------- |
| A1    | Public types (props, stream handles, telemetry tags) are declared before implementation. |
| A2    | Simple over easy: consumers pass an `AbortSignal` and receive a `ReadableStream`; no hidden global lifecycle. |
| A4    | Base classes are stub-only contracts; no concrete `run()` orchestration in base classes. |
| A5    | Composition over inheritance: stream renderers compose a `Renderer` port, not subclass it. |
| A6    | Helpers must be justified; prefer Web Platform streams / Preact `renderToReadableStream`. |
| A7    | Web Platform APIs first: `ReadableStream`, `AbortSignal`, `EventSource`. |
| A8    | One concern per file; split telemetry, policy, and renderer wiring. |
| A10   | Composition root owns lifecycle ports; no module-load-time singletons. |
| A13   | Crash boundaries explicit: `StreamErrorBoundary` and server error frames. |
| A14   | Fitness gates preserve doctrine (F-2, F-3, F-5, F-7, F-9, F-13, F-14, F-15). |

## Problem restatement

RFC 13 (Progressive Streaming Rendering, PSR) and RFC 16 (end-to-end durable streams) require `@netscript/fresh` to:

1. Render pages with server-first deferred regions and flush progressive HTML.
2. Hydrate deferred islands safely on the client without tearing the DOM.
3. Expose durable, observable streams from server to client through the `plugins/streams` adapter.
4. Cleanup subscriptions and renderers on abort, navigation, and error.

The current implementation has the right shape but still contains public-surface lint errors (`private-type-ref`, `missing-jsdoc`) and likely gaps in abort/cancel plumbing.

## Design overview

```text
packages/fresh/
├── defer/                  # PSR deferred-region renderer
│   ├── DeferPage.tsx       # server route wrapper (entry point)
│   ├── DeferIsland.tsx     # client island hydration helpers
│   ├── Deferred.tsx        # promise + Suspense renderer
│   ├── policy.ts           # defer profiles and stale strategies
│   └── telemetry.ts        # prewarm / flush / abort tracing tags
├── server/
│   ├── stream.ts           # PSR HTML streaming renderer
│   ├── sse.ts              # Server-Sent Events helpers + KV watch integration
│   └── stream-error-boundary.tsx  # Preact error boundary for streaming SSR
└── streams/
    ├── mod.ts                # client SDK for e2e durable streams
    └── create-stream-db.ts   # TanStack DB + durable-streams/state bridge
```

### Responsibility split

| Area            | Responsibility                                               | In scope for 5d4 |
| --------------- | ------------------------------------------------------------ | ---------------- |
| `defer/`        | PSR rendering, server-first flushing, client hydration       | Yes              |
| `server/stream.ts` | Preact `renderToReadableStream` wrapper + abort handling  | Yes              |
| `server/sse.ts` | SSE producer framing, KV watch wiring, client reconnect hints | Yes              |
| `server/stream-error-boundary.tsx` | Crash boundary for SSR streaming           | Yes              |
| `streams/`      | E2E durable stream client DB and subscription lifecycle      | Yes              |
| `builders/define-page/` | Route/page definition that uses defer rendering      | Surface only     |

### Streaming lifecycle

```text
Request
  │
  └─▶ createReadableStreamFromElement(element, signal)
         │
         └─▶ renderToReadableStream(preactVNode, { signal })
                  │
                  └─▶ ReadableStream<Uint8Array> ─▶ Response
```

For SSE:

```text
Client EventSource ─▶ GET /_ns/streams/:streamId
                              │
                              └─▶ createSSEStream(signal)
                                       │
                                       └─▶ watchKvPrefix(streamId, signal)
```

### Defer lifecycle

```text
Route handler
  │
  └─▶ <DeferPage component={Page} data={lazyPromise} fallback={Skeleton} />
            │
            └─▶ Server renders fallback + inline markers
                     Client receives markers, resolves promise, hydrates island
```

## State / identity / lifecycle

### Stream session identity

- Each e2e stream is identified by a server-generated opaque `streamId`.
- The client SDK stores the `streamId` in TanStack DB and subscribes through `EventSource`.
- On reconnect, the client sends `Last-Event-ID` header; server resumes from KV watch cursor.

### Lifecycle phases

| Phase      | Trigger                               | Cleanup required                                      |
| ---------- | ------------------------------------- | ----------------------------------------------------- |
| created    | Server accepts stream request         | Register `AbortSignal` cleanup                        |
| streaming  | Bytes / events flowing                | Track active readers; heartbeat                       |
| paused     | Client disconnect (no signal)         | Close reader, keep durable cursor in KV               |
| aborted    | `signal.abort()` / navigation         | Cancel upstream watch, remove heartbeat, close stream |
| completed  | Natural end-of-stream                 | Same as aborted but without error frame               |

### Cancellation contract

- Every public stream function accepts `AbortSignal`.
- `AbortSignal` abort triggers:
  1. `reader.cancel()` or `controller.close()` on the HTTP response stream.
  2. `Deno.Kv` watch unwatch.
  3. Heartbeat interval cleared.
- Preact `renderToReadableStream` is passed the same signal so renderer teardown is unified.

## Ports / adapters

### Internal ports

| Port                  | Role                                   | Current home                            |
| --------------------- | -------------------------------------- | --------------------------------------- |
| `Renderer`            | Turn JSX into `ReadableStream`         | `server/stream.ts`                      |
| `StreamTransport`     | Produce byte stream for HTTP           | `server/stream.ts` + `server/sse.ts`    |
| `WatchSource`         | Durable watch backend                  | `server/sse.ts` (KV watch adapter)      |
| `StreamDB`            | Client-side durable stream state DB    | `streams/create-stream-db.ts`           |
| `TelemetryReporter`   | Structured events / spans              | `defer/telemetry.ts` + `@netscript/telemetry/tracer` |

### Adapter boundaries

- `server/stream.ts` is an adapter for Preact SSR.
- `server/sse.ts` is an adapter over `Deno.serve` response streams and `Deno.Kv` watches.
- `streams/create-stream-db.ts` is an adapter over `@tanstack/react-db` + `@durable-streams/state`.

## Telemetry vocabulary

| Tag / event               | Meaning                                      | Emitted from              |
| ------------------------- | -------------------------------------------- | ------------------------- |
| `defer:prewarm:start`     | Lazy data loader invoked                     | `defer/telemetry.ts`      |
| `defer:prewarm:hit`       | Cached promise reused                        | `defer/telemetry.ts`      |
| `defer:render:fallback`   | Server rendered fallback region              | `DeferPage`               |
| `defer:hydrate:complete`  | Client island resolved and hydrated          | `DeferIsland`             |
| `stream:response:start`   | HTTP stream response opened                  | `server/stream.ts`        |
| `stream:response:abort`   | Stream aborted by client / signal            | `server/stream.ts`        |
| `stream:sse:watch:start`  | KV watch started for a stream                | `server/sse.ts`         |
| `stream:sse:watch:stop`   | KV watch stopped                             | `server/sse.ts`         |

All events go through the `TelemetryReporter` port; no `console.*` in published code (AP-13).

## Error handling / crash boundaries

1. **Rendering errors** are caught by `StreamErrorBoundary` and emitted as a safe HTML comment + fallback.
2. **Upstream watch errors** are caught by the SSE adapter and written as an `error` event frame, then the stream is closed cleanly.
3. **Abort errors** (`AbortError`) are treated as expected; no error frame is emitted.
4. **Unknown errors** are normalized through `@netscript/shared/error-normalizer` (if available) or rethrown after logging to telemetry.

## Public surface changes (planned)

- No new package-level exports in 5d4 unless required by RFC 13/16.
- Existing exports remain; types currently referencing private Preact internals are fixed to use public types (`ComponentChildren`, `VNode`, or local type aliases).
- If a new helper must be public, it gets a JSDoc `@module` tag and a JSR doc-score check.

## Files expected to change

| File                                                   | Change type    | Why                                                       |
| ------------------------------------------------------ | -------------- | --------------------------------------------------------- |
| `packages/fresh/defer/DeferPage.tsx`                   | Fix            | Resolve `private-type-ref` on `JSXInternal.Element`.      |
| `packages/fresh/server/stream-error-boundary.tsx`      | Fix            | Add JSDoc; resolve `private-type-ref` on `ComponentChildren`. |
| `packages/fresh/server/stream.ts`                      | Polish / test  | Confirm abort signal propagation; add tests.              |
| `packages/fresh/server/sse.ts`                         | Polish / test  | Confirm KV watch cleanup on abort; add tests.             |
| `packages/fresh/defer/telemetry.ts`                    | Polish         | Verify telemetry port injection.                          |
| `packages/fresh/streams/mod.ts`                        | Polish / test  | Confirm client lifecycle and abort.                       |
| `packages/fresh/streams/create-stream-db.ts`           | Polish / test  | Confirm durable state bridge.                             |
| `packages/fresh/builders/define-page/builder.tsx`      | Surface review | Ensure defer API usage is type-safe.                      |

## Open design questions

| Question                                                                 | Proposed resolution                                  | Status |
| ------------------------------------------------------------------------ | ---------------------------------------------------- | ------ |
| Should `StreamErrorBoundary` render fallback or just swallow in non-DOM contexts? | Render fallback when `children` is a function; otherwise rethrow. | Locked |
| How is the heartbeat interval injected?                                  | Clock port passed at composition; default `setInterval` only in adapters. | Locked |
| Does the client SDK expose the raw `EventSource`?                        | No. Expose `ReadableStream<StreamEvent>` + TanStack DB query. | Locked |

## Anti-patterns to resolve or avoid

| AP   | Where it appears or could appear                | Plan                                |
| ---- | ----------------------------------------------- | ----------------------------------- |
| AP-1 | `builders/mod.ts` is pre-existing monolith      | Do not expand; defer to roadmap.    |
| AP-11| KV watch or telemetry singleton                 | Inject ports; no module singletons. |
| AP-12| `setInterval` in handlers                       | Use clock port in adapters.         |
| AP-13| `console.*` in streaming code                   | Replace with telemetry port.        |
| AP-19| Permissions for KV / SSE assumed silently       | README declares required permissions. |
| AP-22| Sub-barrels under `defer/`                      | Only root `mod.ts` and subpath files are barrels; no `defer/mod.ts` unless required. |

## Fitness-gate implications

| Gate | How addressed |
| ---- | ------------- |
| F-2  | Prefer `ReadableStream`, `AbortSignal`, `@std/*` helpers; justify any local helper. |
| F-3  | Keep layering: domain/types → ports → adapters (`server/stream.ts`, `server/sse.ts`) → presentation. |
| F-5  | Public surface audit of `fresh/defer/*`, `fresh/server/*`, `fresh/streams/*`. |
| F-7  | JSDoc on every exported symbol; target doc score 100. |
| F-9  | Declare KV / network permissions in README and `deno.json`. |
| F-13 | Runtime invariants: abort cancels watch + renderer + heartbeat. |
| F-14 | No `console.*` in changed files. |
| F-15 | Do not re-export upstream Preact types from `@netscript/fresh` public surface. |

## Review map

- `packages/fresh/defer/` → PSR renderer design.
- `packages/fresh/server/stream.ts` + `server/sse.ts` → streaming transport design.
- `packages/fresh/streams/` → durable client stream DB design.
- `packages/fresh/deno.json` → export surface unchanged.
- `packages/fresh/README.md` → permissions and streaming semantics.

## Assumptions

- The Preact version in `deno.lock` supports `renderToReadableStream` with `AbortSignal`.
- `Deno.Kv` watch API supports cleanup via `AbortSignal`.
- Phase 1 research findings in `research.md` remain valid and do not need re-derivation.
- The 5d4 wave does not own the full `@netscript/fresh` restructure; it only fixes streaming-related surface and runtime issues.

## Dependencies & merge impact

- Depends on `@netscript/telemetry/tracer` for telemetry tags.
- Depends on `@durable-streams/state` and `@tanstack/react-db` for client durable streams.
- No lockfile changes in this phase.
- Merge impact: touches `packages/fresh` files only; no plugin or CLI changes.

## Side-effect ledger

| Side effect                                      | Mitigation                                              |
| ------------------------------------------------ | ------------------------------------------------------- |
| Adding JSDoc may surface additional lint issues  | Run scoped lint after edits and fix in the same slice.  |
| Changing public type aliases may affect consumers| Verify with `deno check` on fresh and fresh-ui.         |
| Abort-signal tests may be flaky in CI            | Use `AbortController` per test; no shared global timers.|
