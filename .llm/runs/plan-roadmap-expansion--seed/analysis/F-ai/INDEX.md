# analysis/F-ai/ — INDEX (Stage-B)

Synthesis for Topic F (the AI suite). Grounds eis-chat's real AI usage (see `context/F-ai/`) against
the current NetScript AI surface (`packages/ai`, `packages/plugin-ai-core`, `plugins/ai`,
`packages/fresh/src/runtime/ai`) and enumerates the flagship-quality capability gap the
meet-or-exceed mandate requires closing.

| file | description |
| --- | --- |
| `01-archetype-thin-plugin-vs-fat-core-grounding.md` | Maps each of eis-chat's AI patterns (chat/agent substrate, MCP pool, generative-UI catalog, skills, memory recall, durable persistence) onto the fat-core (`@netscript/ai`) / contract-only plugin core (`@netscript/plugin-ai-core`) / thin plugin (`@netscript/plugin-ai`) / Fresh runtime plane (`@netscript/fresh/ai`) split. Confirms eis-chat is the reference/proof-of-pattern (it consumes TanStack AI directly, not any `@netscript/*` AI package). Includes cross-topic seams to Topic-B (GenAI telemetry spans via `TelemetryPort`) and Topic-A/OF-6 (dashboard AI panel — chat-shaped vs. single-tool-invocation-shaped). |
| `02-flagship-quality-gap-vs-eis-chat.md` | Ranked top-5 concrete capability gaps vs. the flagship mandate: (1) no generative-UI design vocabulary/renderer (FA3 is an FA0 skeleton stub), (2) MCP is a single-transport port with no pooling/widget-awareness, (3) `SkillLoaderPort` is a no-op with no reference L1/L2/L3 loader, (4) no per-provider reasoning-effort/token-cap passthrough convention or BYOK seam, (5) `AgentMemoryPort.recall` is optional and unimplemented. Also records where the current suite already meets or exceeds the reference (bundle isolation, agent-loop typestate/cancellation/real usage accounting, the durable-chat "one-projection law"). |

## Headline (2 lines)

The suite's three-layer shape (fat `@netscript/ai` core → contract-only `plugin-ai-core` → thin
`plugins/ai` scaffolder, with `@netscript/fresh/ai` owning the durable-chat UI runtime) is sound and
already grounds eis-chat's hardest-won lesson (the seed/live "one-projection law"); the flagship gap
is concentrated in capability depth — generative-UI vocabulary/renderer and MCP pooling/widgets are
the two gaps that most directly gate "does this feel like eis-chat," with skills, reasoning/BYOK
passthrough, and memory recall seamed but unimplemented behind them.
