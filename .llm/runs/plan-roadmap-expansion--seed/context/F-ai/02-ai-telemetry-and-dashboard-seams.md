# context/F-ai: AI telemetry-span and dashboard-panel seams (Topic-B / Topic-A cross-reference)

Extraction-only note: how an AI invocation would emit GenAI telemetry spans, and where a dashboard
AI-invocation panel would attach. No recommendation is made here beyond identifying the seams; see
`research/F-ai/02-ai-stack-architecture-and-migration-delta.md` §5 for the same material folded
into the main delta analysis.

## 1. The injection seam: `TelemetryPort`

`packages/ai/src/ports/telemetry.ts:33` defines `TelemetryPort` with exactly two members:
`startSpan` and `recordEvent`. It is deliberately tiny — a minimal capability seam, composed by
`createAiRuntime(config)` like every other port (A10), with a no-op default when no telemetry
collaborator is injected. No richer instrumentation (span attributes, GenAI semconv attribute
names, exporter wiring) lives in `@netscript/ai` itself.

## 2. The deferred richer adapter: E9 / GitHub #248

The richer adapter is tracked as its own open engine slice, **E9** (GitHub #248: "OTel GenAI/MCP
semconv telemetry adapter (`./otel`)"), milestone `0.0.1-beta.4`, per
`research/F-ai/04-github-ai-program-state.md` §3. It is explicitly scoped as **tracing spans for AI
calls**, and the epic-delta comment on #238 is explicit that this is **not** the same thing as
product usage/cost analytics — that is #266, ruled "track-only, no impl" (a product decision, not a
framework seam). The distinction matters for Topic-B: #248 is squarely a telemetry-seam issue;
#266 is explicitly out of telemetry-seam scope even though it sounds adjacent.

## 3. Evidence the pattern already works one layer down (eis-chat + TanStack AI)

Per `matrix/F-ai/external-resources-matrix.md` and `matrix/F-ai/_draft-reference-rows.md`, the live
dogfood reference `rickylabs/eis-chat` already emits correct GenAI-semconv spans **today**, but by
reaching past `@netscript/ai` entirely: `apps/dashboard/lib/otel.ts` (in the eis-chat checkout)
calls `@tanstack/ai/middlewares/otel`'s `chatOtelMiddleware` directly, producing a `chat <model>`
root span and an `execute_tool <name>` span per tool call. This proves two things simultaneously:

1. The underlying wrapped library (TanStack AI) already knows how to emit spec-correct
   `gen_ai.*`-semconv spans — E9's job is not to invent GenAI semconv from scratch, it is to
   **surface the middleware TanStack AI already ships** through `@netscript/ai`'s own
   `TelemetryPort`, so a consumer gets correct spans by injecting the port rather than by
   hand-wiring TanStack's OTel middleware directly (which is exactly what eis-chat currently has to
   do, and which #248 exists to make unnecessary).
2. Until E9 ships, any NetScript-native AI consumer that wants GenAI spans has no seam to use —
   they would have to bypass `@netscript/ai`'s port architecture and reach for the TanStack
   middleware directly, exactly mirroring eis-chat's current workaround. This is a concrete
   "workaround the seam is supposed to delete" instance, consistent with the epic's overall
   dogfood-migration framing (seam lands → eis-chat workaround deleted).

## 4. Dashboard AI-invocation panel: no confirmed consumer-side surface found

No `packages/dashboard`-side (or equivalent) AI-invocation panel/consumer code was located or read
in this cell. The natural seam for such a panel is downstream of #248: once `@netscript/ai/otel`
exists and emits spans/metrics through `TelemetryPort`, a dashboard panel would be a consumer of
whatever concrete shape that adapter exports (span attributes at minimum; possibly a metrics/rollup
shape if #266's product-analytics decision is later revisited — though as of the 2026-07-04
epic-delta sweep, #266 remains explicitly track-only). This is recorded as an **open question**,
not an absence-of-evidence claim — a dedicated dashboard-app source sweep was out of this cell's
scope.

## Verification gaps

- No direct source read of any dashboard app or `packages/telemetry` consumer surface was performed
  in this note; the "no confirmed consumer-side surface" statement in §4 reflects the scope of this
  cell's reads, not an exhaustive repo-wide negative sweep.
- The eis-chat `apps/dashboard/lib/otel.ts` citation is sourced from the sibling
  `matrix/F-ai/` cell's read of the external eis-chat checkout
  (`C:\Dev\repos\netscript-framework\.llm\tmp\eis-chat-ref`), not independently re-read by this
  file's author.
