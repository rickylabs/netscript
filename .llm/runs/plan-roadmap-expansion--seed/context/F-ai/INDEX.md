# context/F-ai/ — INDEX (Stage-B)

Extraction-only corpus for Topic F (the AI suite). eis-chat is NetScript's real reference
application; this cell documents its actual AI usage as the flagship bar. No analysis or
recommendation lives here — see `analysis/F-ai/` for grounding and gap synthesis.

**Sources read directly (read-only):**

- eis-chat checkout: `C:\Dev\repos\netscript-framework\.llm\tmp\eis-chat-ref` (all paths below are
  relative to this root unless stated otherwise).
- Current NetScript AI surface (this worktree,
  `C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion`): `packages/ai/`,
  `packages/plugin-ai-core/`, `plugins/ai/`, `packages/fresh/src/runtime/ai/`.
- Prior Stage-B work already on record for the AI/telemetry seam:
  `analysis/B-telemetry/eis-chat-real-pipeline-map.md` and
  `context/B-telemetry/eis-chat-pipeline-diagram.md` (cross-process/telemetry angle — this cell
  does not repeat that map; it focuses on the AI-capability angle: chat/tools/MCP/generative-UI).

| file | description |
| --- | --- |
| `01-eis-chat-ai-usage-extraction.md` | eis-chat's real AI stack: TanStack AI chat/agent loop, native MCP client pool + `ui://` widgets, the VIF→CSB investigative-assistant system prompt + generative-UI component catalog, skills (progressive disclosure), memory recall, durable-chat persistence, BYOK/reasoning-effort handling. Every claim is file:line cited. |
| `02-ai-telemetry-and-dashboard-seams.md` | The `TelemetryPort` injection seam in `@netscript/ai`, the deferred E9/#248 OTel GenAI-semconv adapter, evidence eis-chat already emits correct spans one layer down via `@tanstack/ai/middlewares/otel` (proving the pattern, not yet surfaced through NetScript's own port), and the open question of a dashboard AI-invocation panel consumer. |

## Headline (2 lines)

eis-chat runs a single Fresh BFF route (`apps/dashboard/routes/api/chat.ts`) that calls TanStack
AI's `chat()` directly with a native MCP client pool (`@tanstack/ai-mcp`), a channel-KB tool, a
skills system, and memory recall, streaming AG-UI chunks into a durable session log
(`@durable-streams/tanstack-ai-transport`); the model itself composes rich UI (30+ component
vocabulary) via fenced `chart`/`donut`/`ui`/`widget` blocks that a recursive Preact renderer mounts.
