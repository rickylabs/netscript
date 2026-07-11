# Issue #448: docs(positioning): AI-stack + MCP stories — GATED

Part of #401 · Depends on #433 (S0 IA-reconciliation)

**Handle:** D9 · **Milestone:** `0.0.1-beta.7` · **Lane:** Opus-medium authoring workflow. **GATED on `@netscript/ai` publish state.**

## Scope — AI-stack + MCP stories

**Pages:** `ai/{index,mcp}.md` · **Competitor angle:** Medusa Build/Optimize/Operate + Convex "LLMs love"; Encore MCP blog. Author against the shipped surface only (proposal §3.5).

> The new `ai/mcp.md` leaf stub is created by S0 (#433); D9 fills it. Cross-epic: coordinate with `epic:ai-stack` (#238) on which surface is shipped.

## D-common bar

- [ ] Story template: elevator pitch → story spine → mechanism (cross-linked) → one factual competitor comparison (T1/2) → cross-links.
- [ ] Positioning law: no throughput/benchmark, no superlatives, no unshipped claims (deno doc-traceable), no honesty framing, no fabricated %.
- [ ] Do NOT lift `_plan/*` prose verbatim.
- [ ] Diátaxis respected — link, never duplicate.
- [ ] `deno task verify` green; no orphan page.

Design source: `design/CD-docs/epic-and-issues.md` (§4, D9).



---
## Issue comment (2026-07-11T07:30:16Z)

## beta.6 context pack — AI-stack + MCP stories (from the beta6-ship orchestrator, `fb43bc3e`)

Positioning input as of the beta.6 release-ready state (`main` @ `720fcb7e`). **Shipped surface only.**

### ⚠️ Gate status: `@netscript/ai` publish state

**The `@netscript/ai` beta surface is NOT published.** JSR has only a stale `0.0.1-alpha.0` (`@jsr/netscript__ai` dist-tags); the entire beta line skipped the package in the cut publish set — tracked as #609, flagged for inclusion in the beta.6 cut. Until a cut publishes it, this issue's gate is NOT satisfied: any published-facing AI-stack positioning must either wait for the cut or scope itself to what installs today. Note `docs/site` currently claims `@netscript/ai` "arrives from `0.0.1-beta.2`" — that claim is wrong on both version and availability and needs correcting in this docs cut.

### Shipped surface (in-repo at beta.6; publishable by the cut)

- **`@netscript/ai`**: agent loop with injected `TelemetryPort` (`gen_ai.chat` run span, `gen_ai.chat.turn` per-turn, `gen_ai.tool.call` events — PR #568); tools incl. the `render_ui` schema (`RenderUiToolInput`); **MCP client stack** under `./mcp` — `createMcpTransportPool`, `StreamableHttpMcpTransport`/stdio, TanStack streamable-HTTP connector, `uiResources` extraction from tool-call content; providers: openrouter, ollama, openai-embeddings.
- **`@netscript/fresh-ui`**: `./ai/render-ui` safe generative-UI renderer (curated layout/viz/data vocabulary, `RENDER_UI_MAX_DEPTH = 6`, type whitelist, safe fallbacks, no raw-HTML path — PR #594, adversarial IMPL-EVAL) and the `McpUiWidget` island (sandbox sanitization, themed src, `no-referrer`); both install via `netscript ui:add ai`.
- **Proven end-to-end by merge gates, not claims**: `scaffold.runtime` gates cover `ui:add ai` install + generated type-check + nested `render_ui` render with XSS/depth fallbacks (PR #597) and a real MCP streamable-HTTP round trip through the actual TanStack client into `McpUiWidget` (PR #600 / FAI-9).

### Explicitly NOT shipped (do not position)

- **No scaffolded MCP server** — NetScript's MCP surface is client-side (consume external MCP servers). The FAI-9 gate uses a test fixture server; do not present NetScript as an MCP server host.
- **No provider-tool-calling loop wiring beyond the listed providers**; the beta.7 depth seams (FAI-10…17) and the stable OTel adapter (#248) are future tiers.
- The `render_ui` path is renderer + schema seam; there is no end-user agent-builds-UI product story yet beyond the primitive.

### Canonical reference

`packages/ai/README.md` fully rewritten against the shipped surface in PR #610 (deno-doc-verified; MCP/uiResources/agent-telemetry vocabulary consistent with fresh-ui/plugin-ai-core/plugins-ai READMEs from the same pass). Use those READMEs as the terminology source; treat #609's resolution (ai actually published by the beta.6 cut) as this issue's entry condition.