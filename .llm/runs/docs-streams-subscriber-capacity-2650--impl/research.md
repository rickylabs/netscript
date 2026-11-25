# Research

- Source-inspected: `plugins/streams/services/src/service.ts` starts the front service and
  its own upstream server and resolves the file directory. `plugins/streams/services/src/bounded-file-store.ts`
  composes the file store and its bounded segment reads.
- Source-inspected: the pinned server (`deno.lock`, `@durable-streams/server@0.3.9`) exposes
  no declared cleanup counters. Its implementation tracks active SSE responses and pending
  long polls, including waits used by SSE. Its shutdown cancels pending waits. The benchmark
  samples those counters from the one upstream instance.
- Source-inspected: `packages/plugin-streams-core/src/application/stream-sse-v1.ts` validates
  named events and advances the opaque resume offset on controls. The producer exposes readiness,
  append receipts, terminal close, and local stop.
- Source-inspected: `packages/sdk/src/query/query-factory.ts` implements callable SWR,
  metadata-only reads and browser query options. `packages/sdk/src/query-client/query-client-factory.ts`
  defaults focus refetch to false. The Streams guide documents per-request reader header callbacks.
  Checkout MCP `find_guidance` led to these existing Streams and SDK surfaces.
- Source-inspected: root `deno.json` is unpublished and `tools/` is outside all workspace
  members. The plugin and core publication filters apply within their package roots.
