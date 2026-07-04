# Stage C — Fable synthesis of the F-ai B corpus (working positions into the Opus deep-dive)

Supervisor synthesis after reading the full F-ai B corpus (4 agents, 14 files across
`research/F-ai`, `context/F-ai`, `analysis/F-ai`, `matrix/F-ai`). These are **working positions**,
not the locked design — the Opus 4.8 deep-dive (Stage D) details/validates/pushes-back with
evidence; I lock in Stage E; adversarial (F1) + PLAN-EVAL (G) still gate. Topic F-ai is the sixth
roadmap topic (the AI suite), folded in after the A–E plan passed Plan-Gate and the owner ratified.

## Cross-cutting shape of Topic F-ai

- **F-ai is EVALUATE-AND-HARDEN, not rebuild.** The corpus is unanimous: NetScript already ships a
  substantial, correctly-shaped AI stack — the **five-home split** under epic **#238**:
  `@netscript/ai` (alpha.0) zero-`@netscript/*`-dep engine wrapping **TanStack AI** with 6
  self-registering adapters (anthropic, openai-compatible, openrouter, ollama, openai-embeddings,
  mcp); `@netscript/plugin-ai-core` (beta.2) fully-typed oRPC `/v1/ai` contract; `plugins/ai`
  (beta.2, **unpublished — `publish:false`**) thin scaffolder/connector; `@netscript/fresh/ai`
  durable-chat runtime (FA0–2 landed, FA3 skeleton); `@netscript/fresh-ui` `ai` registry. The
  architecture is doctrine-aligned; eis-chat is the **proof-of-pattern reference** (it consumes
  TanStack AI *directly*, not any `@netscript/*` package), NOT a redesign target.
- **The roadmap is therefore a parity + hardening + doctrine-backstop play**, not a new-package
  build. Three spines: (S1) close **flagship parity #388**; (S2) build the **empty-but-correctly-named
  capability seams** (generative-UI renderer, MCP pooling, skill-loader, reasoning/BYOK, memory/
  retriever); (S3) **promote the flagship-quality law into doctrine** so it survives #388 closing.
- **Tight cross-topic coupling** (this is why F-ai enters the same program): it feeds **Topic-A
  dashboard** (the beta.6 AI panel / OF-6 AI-invocation-at-beta.6) and consumes **Topic-B telemetry**
  (GenAI spans). The telemetry `TelemetryPort` no-op (E9/#248) is the shared seam — eis-chat already
  proves the GenAI-span pattern one layer down via `@tanstack/ai/middlewares/otel`.

## Working position 1 — wrap stack (RESOLVED, provisional-lock)

**Reaffirm TanStack AI; do NOT switch to Vercel AI SDK.** Evidence: `@netscript/ai` already wraps
TanStack behind an anti-corruption `ChatClientPort`; Vercel AI SDK is more mature but is
Node-22+-only with reported Deno/`npm:`-specifier friction — the wrong tradeoff. Keep
`@tanstack/ai-mcp` as the concrete backer of `McpTransportPort`; reach for the official
`@modelcontextprotocol/sdk` **only** if NetScript must expose tools *as* an MCP **server** (TanStack
is client-side only). Telemetry: **wrap `@tanstack/ai/middlewares/otel` (`chatOtelMiddleware`)** —
it already emits real `gen_ai.*`-semconv spans in eis-chat's running code; do NOT hand-roll GenAI
spans in the engine's `TelemetryPort`. **Load-bearing caveat:** TanStack AI is pre-1.0
(`@tanstack/ai@^0.39.0`, `@tanstack/ai-mcp@0.2.1`), fast breaking cadence — **exact-pin discipline
is a gate**, not a nicety.

## Working position 2 — the five flagship gaps + priority (RESOLVED, provisional-lock)

Ordered by how much each gates user-visible parity (from `analysis/F-ai/02`):

1. **Generative-UI renderer** — the biggest visible gap. Only a generic `{component,props,title}`
   envelope exists (`packages/ai/src/tools/domain/render-ui.ts`); the downstream renderer
   (`packages/fresh/src/runtime/ai/sandbox.ts`) is a literal FA3 skeleton stub. eis-chat has a 30+
   component vocabulary + recursive Preact renderer + sandboxed-HTML fallback. **Core-owned; beta.6
   co-land with the dashboard.**
2. **MCP pooling** — single-transport factory today vs eis-chat's pooled, multi-server,
   `ui://`-widget-aware client. **Core-owned; beta.6.**
3. **Reasoning-effort / token-cap / BYOK passthrough seam** — adapters take static construction-time
   config only; eis-chat handles three divergent wire shapes (Anthropic adaptive-thinking, OpenAI/
   OpenRouter `reasoning.effort`, OpenRouter `maxCompletionTokens`) plus live per-provider key
   override. **beta.6/7.**
4. **SkillLoaderPort** — a no-op (`packages/ai/src/ports/skill-loader.ts`); `plugins/ai` defers
   skill-loader scaffolding (#290). No reference L1/L2/L3 progressive-disclosure loader. **beta.7.**
5. **AgentMemoryPort.recall + RetrieverPort** — optional/unimplemented (#269/E10, #270/E11),
   re-prioritized up in the 2026-07-04 re-sweep. **beta.7/stable.**

**Non-gaps already at/above bar (do not touch):** bundle-isolation/self-registration, the agent-loop
typestate machine with real cancellation + summed `Usage`, the durable-chat "one-projection law"
(FA1/FA2 — already encodes eis-chat's own #52 regression lesson).

## Working position 3 — flagship parity #388 is the load-bearing near-term slice

`plugins/ai` has no e2e, no `verify-plugin.ts`, no scaffolder golden tests, no `plugin doctor`
coverage; and the scaffolded `stream-proxy.stub.ts` **bypasses the `plugin-ai-core` contract**
(raw POST to `@netscript/ai/agent`, never binds `aiContractV1`). #388 (priority:p1) closes this.
It is the parity gate that must precede any dashboard AI panel. `plugins/ai` is also currently
`publish:false` — publishing readiness is part of parity.

## Working position 4 — DOCTRINE BACKSTOP (new, non-optional)

The "thin ≠ lower quality bar" flagship law currently lives **only** as GitHub #238-comment-10 →
#388. `docs/architecture/doctrine/11-plugin-thinness-and-base-seams.md` governs *where convention
lives*, not *test-coverage/quality parity*. **Biggest risk:** if #388 closes without promotion, the
law has no durable home. **Deliverable:** a doctrine slice that promotes the flagship-quality-parity
rule (extend doctrine-11 or add a dedicated section) — a docs/doctrine change, owner-ratified.

## Milestone reconciliation (the key F-ai fork)

#238/#388 currently sit at milestone **beta.3** — i.e. the AI stack epic is *behind* the A–E train
(beta.5–8). F-ai cannot silently stay at beta.3 while its consumers (dashboard AI panel) target
beta.6. Working recommendation for the DAG:
- **#388 flagship parity → beta.5** (must precede the dashboard AI panel; unblocks OF-6).
- **Generative-UI renderer + MCP pooling → beta.6** (co-land with the dashboard; they *are* the AI
  panel's substance).
- **Reasoning/BYOK, skill-loader, memory/retriever → beta.7 / stable.**
- **Doctrine backstop → beta.5** (cheap, protects the law immediately).

## Owner-facing forks (carry to ratification — do NOT self-decide)

1. **Milestone re-sequencing of #238's beta.3 children into the beta.5–8 train** (above). Rework if
   deferred: the dashboard beta.6 AI panel would have no parity floor under it.
2. **Doctrine promotion of the flagship-quality-parity law** (extend doctrine-11 vs new section) —
   owner ratifies the doctrine change.
3. **AI sub-issue DAG supersession/re-sequence** (from `research/F-ai/04`): move #262+#290+#247 as a
   unit; consider collapsing #271+#272; #258 may absorb #257/#272. Owner approves the supersession
   map **before** Phase-2 filing (no closes until approved).
4. **Generative-UI scope at beta.6:** full 30+-component recursive-renderer parity vs a minimal
   catalog + sandboxed-HTML fallback first. Density knob for Opus-F to cost.
5. **TanStack AI pre-1.0 pin-risk acceptance** — exact-pin + a documented upgrade-watch, or hold for
   1.0. Recommend accept-with-pin (eis-chat already runs it in prod).

## Opus deep-dive fan-out (Stage D)

**One Opus 4.8 agent — Opus-F (AI suite).** F-ai is a single coherent topic; mirror the
one-topic-one-Opus discipline from A–E. Opus-F writes `design/F-ai/{proposal, epic-and-issues,
open-questions, agent-briefs}.md`, converts these working positions into a concrete slice DAG
(parity #388 → generative-UI + MCP pooling → reasoning/BYOK/skill/memory → doctrine backstop),
threads the cross-topic gates (dashboard OF-6, telemetry `TelemetryPort`/#248), assigns milestones
per the reconciliation above, carries the jsr-audit surface deltas (`@netscript/ai` publish,
`plugins/ai` `publish:false`→publishable, `@netscript/fresh/ai` FA3), and advances every owner fork
with evidence. Lane law: framework/plugin/sdk slices = WSL Codex; doctrine prose = Opus workflow;
validation = OpenHands.
