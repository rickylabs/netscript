# Topic F-ai — NetScript AI Suite — Design Proposal (Opus 4.8 deep-dive)

> Depth layer. Builds on the Stage-B F-ai corpus (cited inline as `F/NN`, `ctx/…`, `matrix/…`) and
> the Stage-C synthesis working positions (`analysis/FABLE-STAGE-C-SYNTHESIS-F-ai.md`). Planning
> only; no framework code, no GitHub mutations. **Headline verdict up front, evidence below.**

## 0. Locked design headline

- **Verdict: EVALUATE-AND-HARDEN, not rebuild.** The corpus is unanimous and I re-verified the
  load-bearing claims against source: NetScript already ships a correctly-shaped, doctrine-aligned
  **five-home AI stack** — `@netscript/ai` (alpha.0, zero-`@netscript/*`-dep engine wrapping TanStack
  AI, `F/01 §2`), `@netscript/plugin-ai-core` (beta.2, a real precisely-typed oRPC `/v1/ai` contract
  with `aiContractV1`/`AiRouter`, `F/01 §3`), `plugins/ai` (beta.2, thin scaffolder, **`publish:false`**,
  `F/01 §4.3`), `@netscript/fresh/ai` (FA0–FA2 landed, FA3 skeleton, `F/01 §5`), and the
  `@netscript/fresh-ui` `ai` registry (FB0–FB2 landed). The shape is sound; **the gaps are capability
  depth, concentrated in five seams that are correctly named but empty** (`analysis/F-ai/02`). The
  roadmap is a **parity + hardening + doctrine-backstop** play. I do not propose rebuilding any
  correctly-shaped surface.

- **Three spines** (Stage-C, confirmed):
  - **S1 — close flagship parity #388** (the load-bearing near-term work). `plugins/ai` has no e2e, no
    `verify-plugin.ts`, no scaffolder golden tests, no `plugin doctor` coverage, and the scaffolded
    `stream-proxy.stub.ts` **bypasses the `/v1/ai` contract** — it hand-writes a raw
    `Request→Response` POST calling `@netscript/ai/agent` directly and never binds `aiContractV1`
    (`F/01 §4.2`, `stream-proxy.stub.ts:16-64`). This is the exact defect #388 names, confirmed by
    direct source read. Publishing readiness (`publish:false`→publishable) is part of parity.
  - **S2 — build the empty-but-correctly-named capability seams**: generative-UI renderer, MCP
    pooling, reasoning/token-cap/BYOK passthrough, SkillLoaderPort, MemoryPort/RetrieverPort.
  - **S3 — promote the flagship-quality-parity law into doctrine** so it survives #388 closing. Today
    the "thin ≠ lower quality bar" law lives only as GitHub #238-comment-10 → #388 (`F/04 §1.10`);
    `docs/architecture/doctrine/11-plugin-thinness-and-base-seams.md` governs *where convention lives*,
    not *test-coverage/quality parity*. Cheap, protects the law immediately — beta.5.

- **Wrap stack — REAFFIRM TanStack AI** (Stage-C WP1). `@netscript/ai` already wraps TanStack behind
  the `ChatClientPort` anti-corruption seam; Vercel AI SDK is Node-22-only with Deno/`npm:` friction
  — the wrong tradeoff. Keep `@tanstack/ai-mcp@0.2.1` behind `McpTransportPort`; reach for
  `@modelcontextprotocol/sdk` **only** if NetScript must expose tools *as* an MCP server. Telemetry:
  **wrap `@tanstack/ai/middlewares/otel` (`chatOtelMiddleware`)** — it already emits real
  `gen_ai.*`-semconv spans in eis-chat's running code (`ctx/F-ai/02 §3`); do NOT hand-roll GenAI
  spans. **Load-bearing caveat:** TanStack AI is pre-1.0 (`@tanstack/ai@^0.39.0`), fast breaking
  cadence — **exact-pin discipline is a gate**, not a nicety (owner-fork 5, confirmed accept-with-pin).

- **The tightest cross-topic coupling is the AI `TelemetryPort` seam.** It is genuinely **co-owned
  with Topic-B**: Topic-B **T6** (beta.6) makes the seam *live* by invoking the injected
  `TelemetryPort` in `packages/ai/src/runtime/mod.ts` with a minimal real span; Topic-B **T9**
  (stable) is scoped as the *full* GenAI-semconv OTel adapter. That T9 scope is **the same work** as
  charter item (g) / E9 / #248. I resolve the boundary in §6 (do not double-build) and raise it as
  OQ-1. This is the single place I most sharply detail beyond Stage-C.

- **Generative-UI scope decision (owner-fork 4): ship the recursive renderer + a MINIMAL catalog +
  the sandboxed-HTML escape hatch at beta.6; defer the full 30+-component vocabulary to stable.** The
  *renderer* (recursive JSON→component-tree + zero-network HTML fallback) is the load-bearing gap
  (`analysis/F-ai/02 §1`); vocabulary breadth is additive and does not rework the renderer. §3.

---

## 1. Flagship parity #388 — the load-bearing near-term spine (beta.5)

### 1.1 The verified defect chain

`F/01 §3` confirms `plugin-ai-core`'s `/v1/ai` contract is **already correct and precisely typed**:
`aiContract`, `aiContractV1 = implement(aiContractDefinition)`, and `AiRouter` are real oRPC values
with zero erasure casts on the implementer path (`ai.contract.ts:355-409`); the `chat` route is
SSE-framed (`eventIterator(chatChunkZodSchema)`), forcing any connector handler to be an
async-generator/stream implementation (F-13). **Nothing about the contract needs rebuilding.**

The defect is that the *plugin scaffolder never binds it*: `stream-proxy.stub.ts:16-64` emits a raw
`export async function handler(request: Request): Promise<Response>` that calls `createAgentLoop()`
from `@netscript/ai/agent` directly and returns `toNetScriptChatResponse(...)`, never constructing
`aiContractV1`/`AiRouter` (`F/01 §4.2`). So the published contract surface is **unexercised** end to
end, and `plugins/ai` has none of the parity hardening its `workers`/`sagas`/`triggers` siblings have.

### 1.2 What parity requires (four slices, FAI-0…3)

Per #388's own scope (`F/04 §2`), decomposed for one-agent-per-surface:

1. **FAI-0 — in-repo `/v1/ai` contract implementation + bind the scaffolder + soundness test.** An
   in-repo router that *implements* `aiContractV1` (the SSE `chat` async-generator handler, `models`,
   `invokeTool`, `embed`, `transcribe`), and rewrite `stream-proxy.stub.ts` (+ the `chat-route`
   emitter) so the **scaffolded** output binds `AiRouter` rather than a raw POST. A contract-soundness
   test mirroring `workers-core`'s base-seam test (only the 2 accepted casts — MEMORY
   e2e-type-soundness). This is the correctness heart of #388.
2. **FAI-1 — `verify-plugin.ts` + scaffolder golden tests + `plugin doctor` test + parity review.**
   Golden tests for all emitters (`models`, `barrel`, `tool`, `agent`, `stream-proxy`, `chat-route` —
   `F/01 §4.1`; #388 says "7 emitters", reconcile the count during the slice), a `plugin doctor`
   coverage test, and a recorded parity review vs `workers`/`sagas`.
3. **FAI-2 — `scaffold.runtime` `ai` e2e case** (default + `--persist-threads` + `--mcp`), joining the
   suite alongside `workers`/`sagas`/`triggers`/`streams`. `gate:e2e`.
4. **FAI-3 — `plugins/ai` `publish:false` → publishable + jsr-audit surface.** Flip the `deno.json`
   `publish` flag, confirm JSR-safe asset embedding (import attributes, never `readTextFile`/
   `fromFileUrl` — MEMORY jsr-safe-asset-embedding), `deno doc --lint` clean on the full export map,
   `deno publish --dry-run` green. `gate:jsr`. **Caveat:** first publish of a prerelease-only package
   yields `latest: null` on JSR (MEMORY jsr-prerelease-latest-null) — cosmetic, self-heals; not a
   blocker (OQ-4).

**Milestone: beta.5.** #388 currently sits at beta.3 (`F/04 §2`) — i.e. *behind* the A–E train. It
must move up so the parity floor exists before any consumer leans on it. **Correction (F1AI-01):** the
ratified Topic-A design does **not** contain a beta.6 dashboard "AI panel." Topic-A's only AI edges are
(a) the **stable** DDX-19 "codegen-from-UI" handshake, cross-labelled `⇄ #238`
(`design/A-dashboard/epic-and-issues.md:52-55`, `:307-316`), and (b) the integrated A–E owner fork
**OF-6 "AI-invocation-at-beta.6"**, which is a *telemetry seam* choice (pull the minimal AI
`TelemetryPort` invocation forward), not a dashboard panel issue (`plan.md:195`). So beta.5 parity is
the honest floor for the OF-6 telemetry seam and the stable DDX-19 handshake — not a hard-dep of a
Topic-A beta.6 panel that the ratified graph does not carry.

---

## 2. Doctrine backstop (beta.5)

The "thin ≠ lower quality bar" flagship law is the whole reason #388 exists, yet it lives **only** as
issue prose (#238-comment-10 → #388; `plugins/ai/README.md:3` still reads "a **thin** NetScript
plugin" unqualified — the exact phrasing the correction calls out, `F/02 §5.5`). **Biggest structural
risk: if #388 closes without promotion, the law has no durable home** and the next thin plugin
repeats the pattern.

**FAI-4 — doctrine backstop.** Promote the flagship-quality-parity rule into
`docs/architecture/doctrine/11-plugin-thinness-and-base-seams.md`. I **recommend a dedicated new
section** ("Thinness is a layering choice, not a quality-bar exemption") over inlining, because
quality-parity is a distinct axis from where-convention-lives and deserves its own citable heading
(owner-fork 2). Also correct the `plugins/ai/README.md` framing. **Lane: Opus workflow (docs)** — this
is doctrine/README prose touching no `packages/`/`plugins/` source, squarely inside the CLAUDE.md
documentation-authoring exception; validation stays with OpenHands. Milestone beta.5 (cheap, immediate
protection).

---

## 3. Generative-UI renderer (beta.6) — the biggest visible gap

**Current state (verified):** `renderUiTool`'s input is a generic `{ component, props?, title? }`
envelope carrying **no design vocabulary** (`render-ui.ts`, `F/01 §2.4`: dispatch validates input and
returns `deferred: true` with no renderer running in core); the intended downstream renderer,
`@netscript/fresh/ai`'s MCP-sandbox subpath, is a **literal FA3 skeleton** (`sandbox.ts`, every export
throws "not implemented"). **eis-chat reference:** a model composes a full recursive component *tree*
in one ` ```ui ` fence from a 30+-type catalog + a hard-sandboxed zero-network HTML escape hatch
(`analysis/F-ai/02 §1`). This is the difference between "an AI can call one widget" and "an AI can
compose a dashboard" — the single largest capability delta.

**Two slices:**

- **FAI-5 — generative-UI catalog/vocabulary in the `@netscript/fresh-ui` `ai` registry (FB5/#258).**
  Lift eis-chat's `ui-spec.ts` contract verbatim (#258's own scope note). **beta.6 ships a MINIMAL
  catalog** — layout + core visualization (chart/stat/table) + the interactive `button` that drives
  the next turn — not the full 30+ vocabulary (owner-fork 4). `gate:jsr` (new registry subpath).
- **FAI-6 — recursive renderer + sandboxed-HTML fallback in `@netscript/fresh/ai` FA3 (#252).** Turn
  the `sandbox.ts` skeleton into a real recursive JSON→component-tree renderer over the FAI-5 catalog,
  with the zero-network sandboxed-HTML escape hatch. `gate:jsr` (new `@netscript/fresh/ai` export).
  This renderer — not vocabulary breadth — is the load-bearing part; the full 30+ catalog is a stable
  follow-on that is purely additive.

**Non-gap guard:** the durable-chat one-projection law (FA1/FA2) already encodes eis-chat's own #52
regression lesson (`analysis/F-ai/02 secondary`) — do **not** touch it "to match" eis-chat.

---

## 4. MCP pooling + interactive widgets (beta.6)

**Current state (verified):** `createMcpTransport` builds a *single* stdio-or-HTTP transport from a
discriminated config (`factory.ts`, `F/01 §2.3`); no pooling primitive, no keep-alive-across-turns
sharing, no `ui://`-resource extraction wired to the render-ui seam. **eis-chat reference:**
`createMCPClients` pools multiple servers keyed by id, auto-prefixes tool names, extracts linked
`ui://` widget resources as native AG-UI `ui-resource` events, and shares a keep-alive singleton
across the chat turn *and* a separate widget-call handler (`analysis/F-ai/02 §2`).

**Two slices:**

- **FAI-7 — MCP pooling primitive + `ui://` resource extraction** in `packages/ai/src/mcp`. A
  multi-server pool keyed by id (over the existing two transports, which already carry reconnect
  backoff + lifecycle state — `F/01 §2.3`), keep-alive across turns, tool-name prefixing, and
  `ui://`-resource extraction surfaced to the render-ui seam. Build once in core so no downstream
  `plugins/ai` consumer re-hand-rolls it. `gate:jsr` (`@netscript/ai/mcp` surface).
- **FAI-8 — interactive widget round-trip: `createMcpAppCallHandler` (FA4/#379) + `mcp-ui-widget`
  (FB4/#257).** The ACT half of interactive MCP Apps — widget action → `tools/call` (allowlist, stdio
  fallback, OTel), in `@netscript/fresh/ai`, plus the themed sandboxed `ui://` iframe widget in
  fresh-ui. **Folds #257 into #379's landing** (they are the render + act halves of one feature).
  `gate:jsr`. FB6/#272 (bidirectional bridge) stays a stable follow-on, dependency-superseded by this.

- **FAI-9 — beta.6 capability e2e** (merge-readiness): extend the FAI-2 `ai` e2e with a generative-UI
  render assertion + an MCP widget round-trip smoke. `gate:e2e`.

---

## 5. Reasoning/BYOK, system-prompt, skills, memory/retriever (beta.7 / stable)

These five seams are **correctly seamed but unimplemented** — each is a scoped reference-adapter
slice, not a design problem (`analysis/F-ai/02` net verdict).

### 5.1 Reasoning-effort / token-cap / BYOK passthrough (beta.7)

**Current state:** the provider factories take a *static* `apiKey`/`baseURL` at construction; there is
no per-call reasoning/effort/token-cap options bag and no BYOK seam (`analysis/F-ai/02 §4`). **Nuance
I add over Stage-C:** `@netscript/ai/openrouter` **already** ships an `openRouterReasoningModelOptions`
normalizer + a `ReasoningEffort` type that normalizes the cross-provider wire shapes (OpenRouter
`{reasoning:{effort}}`, OpenAI flat `reasoning_effort`, Anthropic `thinking`/`output_config`, Ollama
emits nothing) — `F/01 §2.3`. So this is **extend-and-lift-to-the-port**, not greenfield.

- **FAI-10 — reasoning-effort/token-cap per-call `modelOptions` passthrough.** Lift the existing
  OpenRouter normalizer to a first-class per-call options bag on `ChatClientPort.stream`, cover all
  adapters (Anthropic adaptive-thinking + effort, OpenAI/OpenRouter `reasoning.effort`, OpenRouter's
  distinct `maxCompletionTokens`), and **reject the deprecated Anthropic `enabled`+`budget_tokens`
  shape** models now 400 on (eis-chat scar tissue). `gate:jsr`.
- **FAI-11 — BYOK per-request key/baseURL resolution seam.** A per-request override seam so multi-
  tenant apps supply user keys + an Ollama base URL without hand-rolling an override layer. `gate:jsr`.

**These two seams have NO existing GitHub issue** (gap 4 in `analysis/F-ai/02` is un-issued) — they
must be **filed new** (OQ-2).

### 5.2 System-prompt assembly + skills (beta.7)

- **FAI-12 — E15 composable system-prompt assembly seam (#380).** Ordered SYSTEM sections
  (catalog / skills / memory / instructions). This is the prerequisite that lets skills + memory
  inject into the prompt, so it sequences before FAI-13/15. Re-sequence #380 beta.3→beta.7.
- **FAI-13 — SkillLoaderPort L1/L2/L3 reference loader (#246 E7).** Today `SkillLoaderPort` is a
  no-op (`createNoopSkillLoader`, "no skills are ever returned" — `analysis/F-ai/02 §3`). Ship a
  **filesystem-backed** L1/L2/L3 progressive-disclosure loader (SKILL.md metadata catalog + tag/
  embedding trigger + the `use_skill`/`read_skill_resource`/`create_skill` tool triad per #246's
  scope correction, `F/04 §3`). The semantic-embedding tier may start optional; even the FS tier
  closes most of the gap. The **write-side approval-gate** (#271 E12) stays stable. `gate:jsr`.
- **FAI-14 — `plugins/ai` `--mcp`/skill scaffolder + e2e variant (#290 P2-follow).** Extends the
  plugin scaffolder with the `--mcp`/skill flags that were deferred pending E7 (`F/01 §4.4`). Depends
  on FAI-7 (MCP pooling) + FAI-13 (skill loader). Re-sequence #290 beta.4→beta.7.

### 5.3 Memory + retriever (beta.7 / stable)

- **FAI-15 — MemoryPort.recall reference adapter (#269 E10).** `AgentMemoryPort.recall?` is optional
  and explicitly unbuilt (`memory.ts`, `analysis/F-ai/02 §5`). Ship a vector-recalled distilled-memory
  adapter: pre-turn top-k relevance recall injected as a "relevant context" system-prompt block
  (via FAI-12), post-turn distill-and-write-back, fully fail-soft — eis-chat's *primary* context
  strategy. **beta.7** (re-sequence #269 beta.4→beta.7). `gate:jsr`.
- **FAI-16 — RetrieverPort hybrid retrieval + citation provenance (#270 E11).** Chunk store + hybrid
  vector+keyword fusion + title-boost + citation mapping; lift eis-chat's scorer/chunker/query-cache
  (`F/04 §3`). **beta.7/stable** (deeper than memory recall; the citation-provenance half can trail to
  stable). `gate:jsr`.

---

## 6. The AI `TelemetryPort` GenAI-span adapter — co-owned with Topic-B (stable)

**FAI-17 — `@netscript/ai/otel` GenAI-span adapter (E9/#248).** `TelemetryPort` is deliberately tiny
(`startSpan`/`recordEvent`, no-op default — `telemetry.ts:33`, `ctx/F-ai/02 §1`). The richer adapter
wraps `@tanstack/ai/middlewares/otel`'s `chatOtelMiddleware` — which **already emits spec-correct
`gen_ai.*` spans in eis-chat's running code** (`ctx/F-ai/02 §3`) — and surfaces it through
`@netscript/ai`'s own `TelemetryPort` so consumers get correct spans by *injecting the port* instead
of hand-wiring TanStack's middleware. New `./otel` subpath → `gate:jsr`.

**Ownership boundary (I detail this sharply — it is the sharpest push-back on the corpus framing).**
Topic-B's design (`design/B-telemetry/epic-and-issues.md`) already scopes this work across two of its
own slices: **T6 (beta.6)** invokes the injected `TelemetryPort` in `packages/ai/src/runtime/mod.ts`
with a *minimal real span* to make the seam live (F→C), and **T9 (stable)** is the *full*
`TelemetryPort` OTel adapter with GenAI-semconv spans gated behind `gen_ai_latest_experimental`. **T9
is the same work as FAI-17.** To avoid a double-build, I resolve:
- **FAI-17 co-owns T9.** The `@netscript/ai/otel` adapter is an `@netscript/ai` (`area:ai-core`)
  source change, so F-ai is the **implementation lane owner**; Topic-B contributes the semconv
  *attribute correctness* (`SpanNames`/`createGenAiAttributes` from Topic-B **T1**) and the dashboard
  *views*. File it **once**, cross-labelled `epic:ai-stack` + `epic:telemetry-revamp`.
- **Hard-deps:** FAI-17 → Topic-B **T3** (thin-vs-SDK provider adapters + flush-on-exit; the OTel
  adapter shape and runtime-dep boundary the GenAI adapter is built on) and Topic-B **T6** (the
  live-seam invocation must exist first). This matches Topic-B T9's own declared deps
  (`design/B-telemetry/epic-and-issues.md:156`; DAG `:168` reads `T3, T6 → T9`). Topic-B **T1** is a
  *transitive* prerequisite — it supplies the `SpanNames`/`createGenAiAttributes` attribute conventions
  consumed through T3, not a direct hard-dep. Milestone **stable** (matching T9); the beta.6 AI
  telemetry seam (OF-6) is served by T6's live minimal span, not the full adapter.

Raised as **OQ-1** for owner ratification (do not let it be built twice).

---

## 7. Cross-topic gates (hard-deps, by intent)

1. **Topic-A AI edges are the stable DDX-19 handshake + the OF-6 beta.6 telemetry seam — NOT a
   ratified beta.6 dashboard "AI panel" (F1AI-01).** The ratified Topic-A graph contains no beta.6 AI
   panel issue; its AI edges are (a) **stable DDX-19** "codegen-from-UI" `⇄ #238`
   (`design/A-dashboard/epic-and-issues.md:52-55`, `:307-316`) and (b) **OF-6 "AI-invocation-at-beta.6"**,
   a *telemetry-seam* choice to make the AI `TelemetryPort` invocation live at beta.6 (`plan.md:195`).
   The parity floor **FAI-0…3 (beta.5)** is the honest prerequisite for either to be real — any AI
   consumer needs a contract-bound, e2e-covered, publishable `plugins/ai` first — but FAI-0…3 is a
   *parity floor*, **not** a hard-dep injected into Topic-A's beta.6 DAG. If the owner later reopens
   Topic-A with a genuinely new beta.6 AI panel, that is a Topic-A scope change with its own DAG edits;
   F-ai does not assume it (OQ-3).
2. **AI `TelemetryPort` adapter co-lands with Topic-B GenAI-span work.** FAI-17 == Topic-B T9; hard
   dep on Topic-B **T3** (adapters/SDK posture) + **T6** (live seam); T1 attribute conventions are
   transitive through T3. §6 / OQ-1.
3. **Generative-UI + MCP (FAI-5…8, beta.6) stand on their own #238 issues** (#258/#252/#379/#257), not
   on a Topic-A panel. Should the owner later add a Topic-A beta.6 AI surface that *renders*
   generative-UI, FAI-6 would become its hard-dep; absent that ratified surface, FAI-5…8 are gated only
   by their own DAG. OQ-3.

---

## 8. jsr-audit surface deltas

Every slice changing a **published** public surface carries `gate:jsr` + a `deno doc --lint` (full
export map, not `mod.ts` alone — MEMORY jsr-doc-lint-full-export-set) + `deno publish --dry-run`
acceptance bullet:

| Package | Surface change | Slices |
|---|---|---|
| `@netscript/plugin-ai-core` | in-repo `/v1/ai` impl (contract surface already beta.2) | FAI-0 |
| `plugins/ai` | **`publish:false` → publishable** (first JSR publish) + scaffolder output | FAI-3 (primary), FAI-0/FAI-14 |
| `@netscript/ai` | new `./otel` subpath; `modelOptions`/BYOK types; skill-loader; memory/retriever ports; MCP pool exports | FAI-7, FAI-10, FAI-11, FAI-13, FAI-15, FAI-16, FAI-17 |
| `@netscript/fresh/ai` | FA3 sandbox renderer export; FA4 `createMcpAppCallHandler` | FAI-6, FAI-8 |
| `@netscript/fresh-ui` `ai` registry | FB5 generative-UI catalog; FB4 mcp-ui-widget | FAI-5, FAI-8 |

`plugins/ai` moving off `publish:false` (FAI-3) is the highest-risk jsr delta — it is the first
publish and must pass the full doc:lint + dry-run + JSR-safe-asset checks before the beta.5 cut.

### 8.1 Archetype gate matrix (F1AI-05)

`gate:jsr`/`gate:e2e` are the *labels*; the **required gate set** for each slice is selected from the
archetype gate matrix (`.llm/harness/gates/archetype-gate-matrix.md:18-80`) per the surface it touches,
so the Plan-Gate "gate set selected" box (`.llm/harness/gates/plan-gate.md:29-30`) is checkable. Every
slice additionally runs the scoped static gates (`.llm/tools/run-deno-{check,lint,fmt}.ts --root <pkg>
--ext ts,tsx`; targeted `deno check` with `--unstable-kv`).

| Surface (archetype) | Slices | Required gates beyond scoped check/lint/fmt |
|---|---|---|
| `plugin-ai-core` `/v1/ai` **contract** (Archetype 1) | FAI-0 | contract-soundness test (2 accepted casts only); `arch:check`; full-export `deno doc --lint`; `deno publish --dry-run` |
| `@netscript/ai` **package** public surface (Archetype 2) | FAI-7, FAI-10, FAI-11, FAI-13, FAI-15, FAI-16, FAI-17 | full-export `deno doc --lint`; `deno publish --dry-run`; `deps:prod-install` consumer-import where a new subpath ships (`./otel`, `./mcp`, `./ports`) |
| `@netscript/fresh/ai` **runtime** behavior (Archetype 3) | FAI-6, FAI-8 | `./ai/sandbox` / `createMcpAppCallHandler` export `deno doc --lint`; runtime render/round-trip unit + `deno publish --dry-run` |
| `@netscript/fresh-ui` `ai` **registry** (Archetype 2) | FAI-5, FAI-8 | registry-subpath `deno doc --lint`; `deno publish --dry-run` |
| `plugins/ai` **plugin** (Archetype 5) | FAI-1, FAI-2, FAI-3, FAI-9, FAI-14 | `verify-plugin.ts` + plugin `doctor`; `scaffold.runtime` `ai` e2e; FAI-3 first-publish `deno doc --lint` full map + `deno publish --dry-run` + JSR-safe-asset check |
| **doctrine/README** prose (docs) | FAI-4 | `arch:check` doctrine fitness; `check:links`; no `packages/`/`plugins/` source change |

The doctrine fitness gates (F-1…F-19 in the matrix) apply where a slice changes a doctrine-governed
package/plugin surface; `arch:check` is the runnable proxy. This matrix is the authority for the
per-slice `gate:*` labels above.

---

## 9. Push-back on Stage-C (with evidence)

1. **#248/E9 is NOT an independent F-ai slice at beta.4 — it is Topic-B T9 (stable), co-owned.**
   Stage-C's WP and the DAG treat the `TelemetryPort` adapter as the F-ai↔Topic-B shared seam but do
   not name that Topic-B's own T9 *already scopes the full adapter*. I resolve the boundary (§6) and
   pull the milestone to **stable**, not beta.6 — the beta.6 dashboard is served by Topic-B T6's live
   minimal span. This is my sharpest override (OQ-1).
2. **Generative-UI at beta.6 = renderer + minimal catalog + HTML fallback, NOT the full 30+
   vocabulary.** Stage-C left the density knob open (owner-fork 4). I decide: the recursive renderer
   is load-bearing; vocabulary breadth is additive and reworks nothing later. Ship minimal at beta.6,
   full at stable (§3).
3. **Reasoning passthrough is extend-not-greenfield.** Stage-C frames gap 4 as fully un-built; source
   shows `openRouterReasoningModelOptions` + `ReasoningEffort` already exist (`F/01 §2.3`). FAI-10
   *lifts* them to the port rather than inventing them.
4. **Reasoning/BYOK (FAI-10/11) have no existing issue and must be filed new** — Stage-C's supersession
   fork assumed an additive layer over existing issues; two of the five gaps are un-issued (OQ-2).
5. **#262 (gateway) and #247 (orchestration) go back to stable, not beta.4.** The flagship-correction
   comment bumped them to beta.4 as a unit (`F/04 §5`), but neither is parity-critical nor a dashboard
   dependency; keeping them at beta.4 pads the near-term train. Re-sequence to stable (§ supersession).

---

## 10. Discipline note

Contract-first, wrap-don't-reinvent, doctrine-first for `packages/`/`plugins/`. The verdict is
evaluate-and-harden: no correctly-shaped surface is rebuilt. Every slice cites a `file:line` or issue
(`epic-and-issues.md`). Slice count = **18** (FAI-0…17), well under the harness `< 30` bound; genuinely
stable-tier capabilities (#262 gateway, #247 orchestration, #271 skill-write approval-gate, #256
paced-reveal, #272 MCP-app bridge) are **deferred explicitly**, not padded into beta.6.
