# Draft Reference Rows — Topic F-ai Matrix

Longer per-resource notes with source URLs, folded into `external-resources-matrix.md`. Each entry
records what was actually verified (web source) vs what was cross-checked against in-repo code
(`packages/ai`, `plugins/ai`, eis-chat).

## 1. Vercel AI SDK (`ai`, `@ai-sdk/*`)

- **Sources:** https://github.com/vercel/ai · https://ai-sdk.dev/docs/introduction ·
  https://vercel.com/blog/ai-sdk-5 · https://vercel.com/blog/ai-sdk-6 ·
  https://ai-sdk.dev/docs/ai-sdk-core/generating-text
- **What it is:** `generateText`/`streamText` core functions; `stopWhen` turns a single call into a
  bounded tool-calling loop; an `Agent` class that is sugar over the same primitives; a provider
  package per vendor (`@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, 25+ total) each
  exporting a factory that mints model instances; a `useChat` UI hook, framework-agnostic
  (React/Svelte/Vue/Angular official, more community).
- **Maturity:** 25.4k GitHub stars, 7,460+ commits, 5,000+ releases (workflow-harness subpackage
  alone at 1.0.18 as of the check date) — the most mature TS AI SDK by a wide margin.
- **Deno/JSR fit — the load-bearing caveat:** Vercel's own docs specify **Node.js 22+** as the
  runtime requirement; no Deno support is documented. Community threads (Supabase Edge Functions,
  which run Deno) report friction specifically around Deno's `npm:` specifier interacting badly
  with Vercel's own build pipeline expectations (package.json/lockfile mismatches), and explicitly
  recommend **decoupling services and integrating via API calls** rather than running the SDK
  inside a Deno process directly. This is a materially worse fit than TanStack AI, which NetScript
  already imports successfully via the same `npm:` mechanism.
- **License:** repository carries a LICENSE file (MIT, per package metadata norms for the Vercel
  OSS ecosystem); exact per-package license was not independently re-verified for all 25+ provider
  packages — spot-check before any adoption.
- **Wrap-vs-reinvent verdict:** Do not adopt as the primary engine — it would duplicate
  `@netscript/ai`'s already-working TanStack wrap and forfeit the free GenAI-telemetry win (see
  entry 5). Feature gaps worth tracking for a *future, narrow* look: structured-object streaming,
  reranking, and embeddings/image-editing primitives that TanStack AI does not yet expose — but
  only if `@netscript/ai`'s currently-throwing `EmbeddingProviderPort`/`VisionProviderPort` (E6/E7)
  need a second reference implementation, and only behind the same anti-corruption seam already
  used for TanStack (no `@ai-sdk/*` type in a public `@netscript/ai/contracts` signature).

## 2. TanStack AI (`@tanstack/ai`, `@tanstack/ai-anthropic`, `@tanstack/ai-openai`, `@tanstack/ai-mcp`, …)

- **Sources:** https://github.com/tanstack/ai · https://tanstack.com/ai/latest ·
  https://www.npmjs.com/package/@tanstack/ai · https://tanstack.com/ai/latest/docs/comparison/vercel-ai-sdk
- **What it is:** a type-safe, provider-agnostic TS AI SDK built from composable "activities" —
  chat, tool calling, agents, structured output, realtime voice, media generation, devtools — each
  independently importable ("tree-shakeable by activity"). Framework-native clients: React, Vue,
  Svelte, Solid, Preact, plus a headless client. Providers: OpenRouter, OpenAI, Anthropic, Gemini,
  Ollama, Groq, xAI/Grok, ElevenLabs, fal.ai (~10, vs Vercel's 25+).
- **Maturity:** MIT license; 2.9k stars, 264 forks, 1,306 releases (very fast cadence — latest
  release same-day as this check). Independent reviews (LogRocket-style blogs, byteiota) describe
  it as **alpha software** despite the release volume — "long way to go to catch up to [Vercel] AI
  SDK's feature set." Version pins in `packages/ai/deno.json` confirm pre-1.0 status directly:
  `@tanstack/ai@^0.39.0`, `@tanstack/ai-anthropic@^0.15.13`, `@tanstack/ai-openai@^0.15.10`,
  `@tanstack/ai-mcp@0.2.1` (exact-pinned, not caret — the strictest pin in the file, a signal the
  authoring team already treats this subpath as the most fragile).
- **Deno/JSR fit:** **proven, not theoretical** — this is not a hypothetical wrap candidate, it is
  already the concrete dependency of `@netscript/ai`'s two shipping provider adapters, imported via
  plain `npm:` specifiers, passing `deno check --unstable-kv` and `deno publish --dry-run` per the
  package's own `deno.json` tasks.
- **Architecture framing (from TanStack's own vs-Vercel comparison page and third-party
  coverage):** TanStack AI treats AI as a *library composition* problem (import only what you use,
  no platform/gateway layer, per-adapter type narrowing) vs Vercel's *platform* framing (broader
  surface, gateway/observability opinions baked in). A code-volume claim from a third-party review:
  implementing 10 tools is ~600 LOC in Vercel AI SDK vs ~300 LOC in TanStack AI (define once, wire
  where it runs).
- **Wrap-vs-reinvent verdict:** **Reaffirm the existing wrap.** `@netscript/ai`'s
  `src/adapters/{anthropic,openai-compatible}.adapter.ts` already do this correctly — internally
  build a TanStack text adapter and wrap it in `toTanstackChatClient(...)` so no TanStack type
  crosses the public `ChatClientPort`/`ChatModelProviderPort` seam (verified anti-corruption
  pattern, `packages/ai/docs/architecture.md` "Owned chat client (D3)"). The library-composition
  shape matches `@netscript/ai`'s own zero-dependency-core design philosophy far better than
  Vercel's platform framing would.
- **Risk to record:** pre-1.0 breaking-change exposure sits inside a caret range for 3 of 4 pinned
  subpaths. If F-ai roadmap work adds new TanStack subpaths (structured output, realtime, media),
  extend the exact-pin discipline already applied to `ai-mcp` rather than trusting caret ranges,
  and budget a recurring "TanStack AI bump" review slice given the observed release cadence.

## 3. Model Context Protocol (MCP) — TS SDK and NetScript's own port

- **Sources:** https://github.com/modelcontextprotocol/typescript-sdk ·
  https://ts.sdk.modelcontextprotocol.io/ · https://www.npmjs.com/package/@modelcontextprotocol/sdk ·
  https://modelcontextprotocol.io/docs/sdk
- **What it is:** the official TS SDK for building MCP servers (expose resources/prompts/tools) and
  clients (connect to any MCP server) over `stdio`, `Streamable HTTP` (recommended for remote), or
  legacy `HTTP+SSE`. High-level `Client` class exposes `listTools`/`callTool`/`readResource`.
  Requires Web Crypto (`globalThis.crypto`) and a peer dep on Zod (v4 internally, back-compat to
  Zod ≥3.25).
- **Maturity/versioning:** MIT (main package); repo moving new contributions to Apache-2.0. A v2
  release is targeted alongside the `2026-07-28` MCP spec revision; v1.x stays supported (bugfixes
  + security) for ≥6 months after v2 ships — i.e., a live spec-version transition is in flight
  during this roadmap window.
- **Deno/JSR fit:** not independently re-verified by direct import (NetScript doesn't import this
  package today), but the transport model (stdio/HTTP) and Web-Crypto-only requirement suggest good
  Deno fit in principle. **NetScript's actual MCP path today is indirect**: `@tanstack/ai-mcp` is
  the concrete adapter TanStack AI (and by extension `@netscript/ai`) uses, per
  `mcp-transport.ts`'s own module doc ("Concrete adapters may wrap `@tanstack/ai-mcp`. No upstream
  SDK type leaks through this public seam.").
- **In-repo grounding:** `packages/ai/src/ports/mcp-transport.ts` defines `McpTransportPort` with a
  connection-state machine (`disconnected`/`connecting`/`connected`/`reconnecting`/`closed`),
  backoff config, transport-kind union (`stdio`/`streamable-http` — matching the official SDK's
  transport vocabulary), and tool descriptor/result shapes tagged with `serverId`/`remoteName`.
  This is a well-formed anti-corruption port even without a direct SDK dependency. The default
  (`createUnconfiguredMcpTransport`) throws `AiNotConfiguredError` on every operation — MCP is not
  wired end-to-end by default.
- **Scaffolding status:** `plugins/ai/README.md` explicitly states `--mcp` / skill-loader
  scaffolding is **deferred** (tracked in issue #290), pending a `SkillLoaderPort`. So while the
  *port* exists in the core, the CLI does not yet scaffold an MCP connection for an app.
- **Wrap-vs-reinvent verdict:** keep MCP behind `@tanstack/ai-mcp` for the primary path (consistent
  with the rest of the provider-adapter strategy); the official SDK becomes relevant only if a
  future slice needs an MCP transport TanStack doesn't cover, or needs to build the **server** side
  (exposing NetScript-authored tools as an MCP server to external clients) — the TS SDK's `Server`
  class is the natural wrap target for that direction, which TanStack AI (a client-side chat SDK)
  does not obviously address.

## 4. Provider-adapter architecture patterns

- **Sources:** TanStack AI vs Vercel AI SDK comparison threads (see entry 2) ·
  https://github.com/BerriAI/litellm · https://docs.litellm.ai/docs/
- **Library-composition pattern (TanStack AI / `@netscript/ai`):** one adapter per provider behind
  a shared port; self-registration via import side effect (`registerModelProvider`, mirroring
  `@netscript/kv/redis`); zero-dependency core; consumer imports only the subpath(s) needed.
  **This is the pattern already implemented correctly** in `@netscript/ai` — no action needed
  beyond continuing it for new providers.
- **Gateway/proxy pattern (LiteLLM):** a single `completion()` call normalizes 100+ providers to
  the OpenAI wire format; adds spend-tracking, guardrails, load-balancing, virtual keys — i.e. an
  **operational** layer on top of normalization, not just a type-safety concern. Python-only, no TS
  port exists, so it is not directly importable — but the *normalization* half of the pattern is
  already present in NetScript's own `openai-compatible.adapter.ts` (point any OpenAI-Chat-
  Completions-or-Responses-shaped endpoint at it: DeepSeek, Together, vLLM, a local gateway).
- **Verdict:** NetScript's architecture already draws the correct lines — library-composition for
  the SDK layer (TanStack), OpenAI-compatible normalization as its own adapter for
  gateway-style endpoints. The LiteLLM-style *operational* features (spend tracking, guardrails,
  load balancing) are legitimately out of scope for an SDK-wrap decision and should be tracked
  separately if ever needed (they are ops/platform concerns, not AI-engine concerns).

## 5. OpenTelemetry GenAI semantic conventions

- **Sources:** https://opentelemetry.io/docs/specs/semconv/gen-ai/ (redirect notice) ·
  https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-spans.md ·
  https://opentelemetry.io/blog/2026/genai-observability/ ·
  in-repo: `matrix/B-telemetry/INDEX.md`, `analysis/B-telemetry/eis-chat-real-pipeline-map.md` §2a.
- **Status:** the GenAI (and MCP) semantic conventions **moved to their own repository**
  (`open-telemetry/semantic-conventions-genai`) and remain in **Development** status — not stable,
  no public stabilization date as of this check. Instrumentations opt into the newest experimental
  shape via `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`.
- **Core span shape:** required — `gen_ai.operation.name` (e.g. `chat`, `generate_content`),
  `gen_ai.provider.name`. Conditionally required — `gen_ai.request.model`, `error.type`.
  Recommended — `gen_ai.usage.input_tokens`/`output_tokens`, `gen_ai.response.finish_reasons`,
  `gen_ai.response.id`/`model`. Span name SHOULD be `{gen_ai.operation.name} {gen_ai.request.model}`
  (or the data-source id for retrieval spans). Span kind is CLIENT (remote model calls).
  `gen_ai.system_instructions` and `gen_ai.tool.definitions` are Opt-In (PII-sensitivity).
- **This already exists, running, in the same monorepo family:** eis-chat's
  `apps/dashboard/lib/otel.ts` wires `chatOtelMiddleware` from `@tanstack/ai/middlewares/otel` —
  confirmed by direct read of `analysis/B-telemetry/eis-chat-real-pipeline-map.md` §2a — which
  emits a `chat <model>` root span, one `chat <model> #N` span per agent-loop iteration
  (carrying `gen_ai.usage.*`/`finish_reasons`), and an `execute_tool <name>` span per tool call
  (`gen_ai.tool.name` + outcome). It deliberately uses `@opentelemetry/api`'s raw `trace.getTracer`
  instead of NetScript's typed telemetry facade so its `Tracer` type matches the TanStack
  middleware's peer dependency — both still resolve to the same global provider Deno registers, so
  spans stitch correctly into the rest of the trace. `captureContent` is `false` (no prompt/PII on
  spans by default), consistent with the semconv's Opt-In guidance on sensitive attributes.
- **Confirmed gap, not solved by the middleware:** `tools/legacy-archeo-mcp.ts` (a real MCP server
  in eis-chat) currently has **zero telemetry** — the GenAI span chain stops at the `execute_tool`
  boundary on the client/agent-loop side and does not cross into MCP-server-side instrumentation.
  Any F-ai + Topic-B joint design should treat MCP-server-side spans as new work, not something the
  TanStack middleware already provides.
- **Wrap-vs-reinvent verdict:** wrap `@tanstack/ai/middlewares/otel` for the client/agent-loop half
  of GenAI telemetry — do not hand-write `gen_ai.*` span emission in `@netscript/ai`'s
  `TelemetryPort` when the underlying TanStack adapter already emits semconv-shaped spans for free.
  Budget separate work for MCP-server-side spans (a real reinvent target, since no existing
  middleware covers it) and for tracking the Development→stable semconv transition
  (`OTEL_SEMCONV_STABILITY_OPT_IN` pin).
