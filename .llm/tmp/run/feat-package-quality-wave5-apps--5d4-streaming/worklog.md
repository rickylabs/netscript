# Worklog — 5d4-streaming

Append-only. One entry per slice / decision.

## Design

Implementation resumes from the approved `design.md` and `plan.md` artifacts. PLAN-EVAL
`APPROVED` in `plan-eval.md`; no source implementation began before that verdict.

## 2026-06-13 — Slice 1 + promoted Slice 7 validation unblock

### Scope

- Promoted the approved Slice 7 root `deno.json` exclusion removal because Deno otherwise skipped
  `packages/fresh` during targeted check/fmt gates.
- Implemented Slice 1 public-surface cleanup for:
  - `packages/fresh/defer/DeferPage.tsx`
  - `packages/fresh/server/stream-error-boundary.tsx`
- Added package-owned renderable and policy prop types so public docs do not expose Preact private
  `JSXInternal`, `VNode`, `ComponentChildren`, or `Component`.
- Preserved the exported `StreamErrorBoundary` component name by moving the Preact class to an
  internal implementation class.

### Validation

| Gate | Command | Result |
| ---- | ------- | ------ |
| F-7 doc lint | `deno doc --lint packages/fresh/defer/DeferPage.tsx packages/fresh/server/stream-error-boundary.tsx` | PASS, checked 2 files |
| Static check | `deno check --config packages/fresh/deno.json --unstable-kv packages/fresh/defer/DeferPage.tsx packages/fresh/server/stream-error-boundary.tsx packages/fresh/builders/define-page/runtime.tsx packages/fresh/server.ts` | PASS |
| Static lint | `deno lint --config deno.json packages/fresh/defer/DeferPage.tsx packages/fresh/server/stream-error-boundary.tsx` | PASS, checked 2 files |
| Static fmt | `deno fmt --no-config --single-quote --line-width 100 --check packages/fresh/defer/DeferPage.tsx packages/fresh/server/stream-error-boundary.tsx` | PASS, checked 2 files |
| Root config fmt | `deno fmt --config deno.json --check deno.json` | PASS |

### Drift

- D-5d4-11 records why Slice 7 root exclusion removal was promoted ahead of source-slice commits.
- D-5d4-12 records why `StreamErrorBoundary` changed from an exported class to an exported
  function component backed by an internal class.

## 2026-06-13 — Slice 2 telemetry / policy / server polish

### Scope

- Added JSDoc to exported defer policy types, constants, and decision helpers.
- Replaced public Preact return/prop types in `Deferred`, `DeferIsland`, and server streaming
  helpers with package-owned structural renderable types.
- Replaced exported telemetry `Attributes` references with a local Fresh telemetry attribute map.
- Added `SSEClock`, `SSEKvKey`, and `SSEWatchableKv` public structural types for the SSE adapter.
- Added optional external abort signal and injectable clock support to `createSSEStream`.
- Removed all `console.*` calls from the touched defer/server streaming surface.

### Validation

| Gate | Command | Result |
| ---- | ------- | ------ |
| F-7 doc lint | `deno doc --lint packages/fresh/defer/mod.ts packages/fresh/server/stream.ts packages/fresh/server/sse.ts` | PASS, checked 3 files |
| Static check | `deno check --config packages/fresh/deno.json --unstable-kv packages/fresh/defer/mod.ts packages/fresh/server/stream.ts packages/fresh/server/sse.ts packages/fresh/builders/define-page/runtime.tsx packages/fresh/server.ts` | PASS |
| Static lint | `deno lint --config deno.json packages/fresh/defer/DeferPage.tsx packages/fresh/defer/Deferred.tsx packages/fresh/defer/DeferIsland.tsx packages/fresh/defer/policy.ts packages/fresh/defer/telemetry.ts packages/fresh/server/stream.ts packages/fresh/server/sse.ts packages/fresh/server/stream-error-boundary.tsx` | PASS, checked 8 files |
| Static fmt | `deno fmt --no-config --single-quote --line-width 100 --check packages/fresh/defer/DeferPage.tsx packages/fresh/defer/Deferred.tsx packages/fresh/defer/DeferIsland.tsx packages/fresh/defer/policy.ts packages/fresh/defer/telemetry.ts packages/fresh/server/stream.ts packages/fresh/server/sse.ts packages/fresh/server/stream-error-boundary.tsx` | PASS, checked 8 files |
| F-14 console scan | `rg "console\\." packages/fresh/defer packages/fresh/server packages/fresh/streams --glob '*.ts' --glob '*.tsx'` | PASS, no matches |

## 2026-06-13 — Slice 3 renderer abort tests

### Scope

- Added a `StreamingRenderer` port to `renderToStream` so renderer cancellation can be tested
  deterministically.
- Added colocated `packages/fresh/server/stream_test.ts` coverage for:
  - abort after renderer creation cancels the renderer stream,
  - already-aborted signals cancel immediately,
  - renderer context still flows through the port.

### Validation

| Gate | Command | Result |
| ---- | ------- | ------ |
| F-13 runtime invariant | `deno test --config packages/fresh/deno.json --allow-all packages/fresh/server/stream_test.ts` | PASS, 2 tests |
| Static check | `deno check --config packages/fresh/deno.json --unstable-kv packages/fresh/server/stream.ts packages/fresh/server/stream_test.ts` | PASS |
| F-7 doc lint | `deno doc --lint packages/fresh/server/stream.ts` | PASS |
| Static lint | `deno lint --config deno.json packages/fresh/server/stream.ts packages/fresh/server/stream_test.ts` | PASS, checked 2 files |
| Static fmt | `deno fmt --no-config --single-quote --line-width 100 --check packages/fresh/server/stream.ts packages/fresh/server/stream_test.ts` | PASS, checked 2 files |

## 2026-06-13 — Slice 4 SSE / KV watch abort tests

### Scope

- Added colocated `packages/fresh/server/sse_test.ts` coverage for:
  - external request/caller abort clearing the SSE heartbeat timer,
  - response body cancellation aborting the KV watch signal.
- Used local fake clock and fake KV watch ports; no shared testing helper was needed.

### Validation

| Gate | Command | Result |
| ---- | ------- | ------ |
| F-13 runtime invariant | `deno test --config packages/fresh/deno.json --allow-all packages/fresh/server/sse_test.ts` | PASS, 2 tests |
| Static check | `deno check --config packages/fresh/deno.json --unstable-kv packages/fresh/server/sse.ts packages/fresh/server/sse_test.ts` | PASS |
| Static lint | `deno lint --config deno.json packages/fresh/server/sse.ts packages/fresh/server/sse_test.ts` | PASS, checked 2 files |
| Static fmt | `deno fmt --no-config --single-quote --line-width 100 --check packages/fresh/server/sse.ts packages/fresh/server/sse_test.ts` | PASS, checked 2 files |

## 2026-06-13 — Slices 5 and 6 streams lifecycle + upstream-type wrap

### Scope

- Replaced raw `@tanstack/react-db` and `@durable-streams/state` re-exports from
  `@netscript/fresh/streams` with NetScript-owned wrapper types and live-query wrapper functions.
- Updated `createNetScriptStreamDB` to expose NetScript-owned schema, DB handle, and factory-port
  types while keeping durable-streams types internal.
- Added `create-stream-db_test.ts` to prove stream URL resolution, schema handoff, and lifecycle
  handle propagation through the injected factory seam.

### Validation

| Gate | Command | Result |
| ---- | ------- | ------ |
| F-7 / F-15 doc lint | `deno doc --lint packages/fresh/streams/mod.ts` | PASS, checked 1 file |
| Static check | `deno check --config packages/fresh/deno.json --unstable-kv packages/fresh/streams/mod.ts packages/fresh/streams/create-stream-db.ts packages/fresh/streams/create-stream-db_test.ts` | PASS |
| F-13 lifecycle test | `deno test --config packages/fresh/deno.json --allow-all packages/fresh/streams/create-stream-db_test.ts` | PASS, 1 test |
| Static lint | `deno lint --no-config packages/fresh/streams/mod.ts packages/fresh/streams/create-stream-db.ts packages/fresh/streams/create-stream-db_test.ts` | PASS, checked 3 files |
| Static fmt | `deno fmt --no-config --single-quote --line-width 100 --check packages/fresh/streams/mod.ts packages/fresh/streams/create-stream-db.ts packages/fresh/streams/create-stream-db_test.ts` | PASS, checked 3 files |
