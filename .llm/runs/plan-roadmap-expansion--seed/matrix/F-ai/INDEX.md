# matrix/F-ai/ — INDEX (Stage-B)

Matrix of the external AI landscape the F-ai (AI suite) topic should wrap, per NetScript's
"wrap, do not reinvent" law. Scope: provider-abstraction SDKs (streaming/tool-calling), MCP,
provider-adapter patterns generally, and GenAI OpenTelemetry semantic conventions — the four
external surfaces a `plugin-ai-core` + N-adapters design borrows from.

**Load-bearing context found in-repo (not hypothetical):** NetScript already ships
`packages/ai` (`@netscript/ai`, archetype-2 core) and `plugins/ai` (`@netscript/plugin-ai`,
thin scaffolder). The core already wraps **TanStack AI** (`@tanstack/ai*` via npm: specifiers),
not Vercel AI SDK — `anthropic.adapter.ts` / `openai-compatible.adapter.ts` wrap
`@tanstack/ai-anthropic` / `@tanstack/ai-openai`, and `mcp-transport.ts` documents wrapping
`@tanstack/ai-mcp`. This matrix evaluates that existing choice against the landscape rather than
starting from zero, and flags where the wrap is incomplete or at risk.

| file | description |
|---|---|
| `external-resources-matrix.md` | Master matrix: Vercel AI SDK, TanStack AI, MCP TS SDK, provider-adapter patterns (LiteLLM/gateway vs library-composition), OpenTelemetry GenAI semconv — each with Deno/JSR fit, license, maturity, wrap-vs-reinvent verdict, and risk. |
| `_draft-reference-rows.md` | Longer per-resource notes with source URLs, version pins found in `packages/ai/deno.json`, and the concrete in-repo wrap evidence (`packages/ai/src/adapters/*`, `packages/ai/src/ports/mcp-transport.ts`, eis-chat's `apps/dashboard/lib/otel.ts` use of `@tanstack/ai/middlewares/otel`). |

## Headline finding

NetScript's existing wrap choice (TanStack AI over Vercel AI SDK) is defensible and should be
**reaffirmed, not revisited**, for three reasons distilled below:

1. Deno fit — TanStack AI ships as plain npm packages with no Node-only API dependency observed;
   Vercel AI SDK's own docs require "Node.js 22+" and community reports describe friction wiring it
   into Deno-based edge runtimes (Supabase Edge Functions/Deno Deploy) via `npm:` specifiers.
2. Architecture fit — TanStack AI is a library-composition toolkit (import only the activities you
   need, adapters carry per-model type narrowing); Vercel AI SDK is a platform toolkit
   (broader feature surface, gateway/observability opinions). NetScript's `@netscript/ai` is itself
   architected as a zero-dependency composition root — TanStack's shape is the closer analogue.
3. **Free telemetry alignment** — eis-chat's real, running code (`apps/dashboard/lib/otel.ts`)
   already uses `@tanstack/ai/middlewares/otel` (`chatOtelMiddleware`) to emit native
   `gen_ai.*`-semconv spans (`chat <model>` root, `execute_tool <name>` per tool call). Adopting
   Vercel AI SDK would forfeit this and require hand-rolling GenAI spans — a reinvent-trap.

The material risk is **maturity, not fit**: TanStack AI is pre-1.0 (`@tanstack/ai@^0.39.0`,
`@tanstack/ai-mcp@0.2.1` pinned exact, per `packages/ai/deno.json`) with a fast, breaking-prone
release cadence (1,300+ releases). Vercel AI SDK is materially more mature/stable (25.4k stars,
25+ providers, ~5 years of iteration) but is the worse Deno/telemetry fit. This is recorded as the
top caveat, not a reversal recommendation.
