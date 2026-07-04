# Topic F-ai — AI-suite epic + sub-issues (draft text only — NO GitHub mutations)

> **F-ai is additive/organizing over the existing Epic #238, not a replacement.** The corpus verdict
> (`F/04 §5`) is unanimous: no open #238 child warrants outright supersession/close; the roadmap
> re-sequences milestones, folds two pairs, and files a few new slices. **NEVER put a closing keyword
> on #238** (umbrella). Labels per netscript-pr taxonomy; every draft carries exactly one `status:`
> (= `status:plan` in this planning run). Milestones `0.0.1-beta.5`/`beta.6`/`beta.7`/`0.0.1-stable`
> — **note: `beta.5`/`beta.6`/`beta.7` milestones do not exist yet; owner must create them at
> ratification** (Stage-C owner fork 1; shared with Topics A–E).

## Epic — reuse the existing `#238` umbrella (do NOT file a new epic)

- **Existing:** `#238` "NetScript AI Stack — first-class AI runtime, chat & plugin seams (anchor
  #219)", `type:umbrella`, `epic:ai-stack`, milestone `0.0.1-beta.3`.
- **Action at ratification:** re-milestone the umbrella from `beta.3` → the cut its last child lands
  in (**beta.7**), backfill `priority:`/`status:` on children (taxonomy gap, `F/04 §6`), and record
  the F-ai re-sequencing as a new epic comment. **No closing keyword anywhere.** `Part of #301`
  (road-to-stable umbrella).
- **Do NOT** create a parallel `epic:f-ai` label — every AI issue already carries `epic:ai-stack`
  and the negative sweep (`F/04 §4`) confirms no orphan AI issue exists outside it.
- **Taxonomy/label-file sync (owner action, before Phase-2 filing — F1AI-04).** `.github/labels.yml`
  currently declares only `type:`/`status:`/`priority:`/`area:`/`ci:`/`gate:` blocks — it has **no**
  `epic:` or `wave:` label definitions (`.github/labels.yml:14-151`), yet the canonical taxonomy
  (`.agents/skills/netscript-pr/SKILL.md:190-210`) requires `wave:v1`/`wave:v1-min`/`wave:defer` and
  the F-ai drafts use `epic:ai-stack` + `epic:telemetry-revamp`. Before any F-ai issue is filed, the
  owner must add `epic:ai-stack`, `epic:telemetry-revamp`, and the `wave:*` block to `.github/labels.yml`
  (this folds into the shared A–E owner action OF-1 and F-ai OQ-4). **Wave→milestone rule:** beta.5/6/7
  slices carry `wave:v1` (they are the v1 train); only the stable-tier adapter FAI-17 carries
  `wave:defer` — the F-ai drafts were corrected to honor this (no `wave:defer` on a beta milestone).

## DAG (dependency edges)

```
PARITY SPINE S1 (beta.5, WSL Codex) ─────────────────────────────────────────────
  FAI-0  in-repo /v1/ai impl + bind stream-proxy to aiContractV1 + soundness test  (#388)
  FAI-1  verify-plugin.ts + scaffolder golden tests + plugin doctor + parity review (#388)  [needs FAI-0]
  FAI-2  scaffold.runtime `ai` e2e (default + --persist-threads + --mcp)            (#388)  [needs FAI-0, FAI-1]
  FAI-3  plugins/ai publish:false → publishable + jsr-audit                         (#388)  [needs FAI-0]
DOCTRINE BACKSTOP S3 (beta.5, Opus workflow) ─────────────────────────────────────
  FAI-4  flagship-quality-parity law → doctrine-11 + README framing fix             (extends closed #263)
GENERATIVE-UI (beta.6, WSL Codex) ────────────────────────────────────────────────
  FAI-5  fresh-ui `ai` generative-UI catalog (minimal)                              (#258 FB5)
  FAI-6  @netscript/fresh/ai FA3 recursive renderer + sandboxed-HTML fallback       (#252 FA3)  [needs FAI-5]
MCP POOLING (beta.6, WSL Codex) ──────────────────────────────────────────────────
  FAI-7  MCP pooling primitive + ui:// resource extraction                          (new; over #240-cluster)
  FAI-8  createMcpAppCallHandler (FA4) + mcp-ui-widget (FB4) interactive round-trip (#379 + #257)  [needs FAI-7, FAI-6]
BETA.6 MERGE-READINESS ────────────────────────────────────────────────────────────
  FAI-9  beta.6 capability e2e (generative-UI render + MCP widget round-trip)       (extends FAI-2)  [needs FAI-5..8]
DEPTH SEAMS (beta.7, WSL Codex) ───────────────────────────────────────────────────
  FAI-10 reasoning-effort/token-cap per-call modelOptions passthrough              (NEW ISSUE — gap 4)
  FAI-11 BYOK per-request key/baseURL resolution seam                              (NEW ISSUE — gap 4)  [needs FAI-10]
  FAI-12 E15 composable system-prompt assembly seam                                (#380)
  FAI-13 SkillLoaderPort L1/L2/L3 reference loader + tool triad                    (#246 E7)  [needs FAI-12]
  FAI-14 plugins/ai --mcp/skill scaffolder + e2e variant                           (#290)  [needs FAI-7, FAI-13]
  FAI-15 MemoryPort.recall reference adapter                                       (#269 E10) [needs FAI-12]
  FAI-16 RetrieverPort hybrid retrieval + citation provenance                      (#270 E11) [needs FAI-15]
TELEMETRY SEAM — CO-OWNED WITH TOPIC-B (stable) ──────────────────────────────────
  FAI-17 @netscript/ai/otel GenAI-span adapter (wraps chatOtelMiddleware)          (#248 E9 == Topic-B T9)
         [HARD dep: Topic-B T3 (adapters/SDK posture) + T6 (live seam, beta.6); T1 attrs transitive]
```

Critical path to a shippable beta.5 parity floor: **FAI-0 → FAI-1 → FAI-2**, with FAI-3 (publish) and
FAI-4 (doctrine) parallel. Beta.6 flagship substance: **FAI-5 → FAI-6** and **FAI-7 → FAI-8** → FAI-9.
Beta.7 depth: FAI-12 gates the skills/memory injection (FAI-13/15).

---

## Parity spine S1 — flagship #388 (beta.5, WSL Codex)

### FAI-0 — in-repo `/v1/ai` impl + bind scaffolder to `aiContractV1` + soundness test
- **Labels:** `type:feat`, `area:plugin-ai`, `area:ai-core`, `gate:jsr`, `epic:ai-stack`, `priority:p1`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.5`
- **Justification:** `plugins/ai/src/adapter/resources/stream-proxy/stream-proxy.stub.ts:16-64` emits
  a raw `Request→Response` POST to `@netscript/ai/agent`, never binding `aiContractV1`
  (`packages/plugin-ai-core/src/contracts/v1/ai.contract.ts:377-379`; the `chat` route uses
  `eventIterator(chatChunkZodSchema)` at `:332`); the published contract is unexercised
  (`F/01 §4.2`, verified). This is the correctness heart of #388.
- **Acceptance:**
  - An in-repo router *implements* `aiContractV1`/`AiRouter` (SSE `chat` async-generator handler +
    `models`/`invokeTool`/`embed`/`transcribe`).
  - The **scaffolded** `stream-proxy`/`chat-route` emitters produce output that binds `AiRouter`, not a
    raw POST. Regression: a golden test asserts the emitted handler imports `aiContractV1`.
  - Contract-soundness test mirroring `workers-core/tests/contracts/*` — only the 2 accepted casts
    (MEMORY e2e-type-soundness).
  - **`gate:jsr`:** `deno doc --lint` clean on the full `plugin-ai-core` export map; `deno publish --dry-run` green.
- **Dep:** none. **Blocks:** FAI-1, FAI-2, FAI-3. **Issue:** update #388.

### FAI-1 — `verify-plugin.ts` + scaffolder golden tests + `plugin doctor` + parity review
- **Labels:** `type:feat`, `area:plugin-ai`, `epic:ai-stack`, `priority:p1`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.5`
- **Justification:** `plugins/ai` has **no `verify-plugin.ts`** and only a `manifest_test.ts`
  (verified); siblings ship full parity harness.
- **Acceptance:**
  - `plugins/ai/verify-plugin.ts` present and green.
  - Golden tests for every scaffold emitter (`models`, `barrel`, `tool`, `agent`, `stream-proxy`,
    `chat-route`; reconcile #388's "7 emitters" count against the 6 in `aiStarterResources`, `F/01 §4.1`).
  - `plugin doctor` coverage test (`ANTHROPIC_API_KEY` required-config path).
  - A recorded parity review vs `workers`/`sagas` attached to #388.
- **Dep:** FAI-0. **Blocks:** FAI-2. **Issue:** #388.

### FAI-2 — `scaffold.runtime` `ai` e2e case
- **Labels:** `type:test`, `gate:e2e`, `area:plugin-ai`, `area:cli`, `epic:ai-stack`, `priority:p1`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.5`
- **Justification:** `runtime-gates.ts` includes workers/sagas/triggers/auth but **no AI gate**
  (verified). #388 scopes default + `--persist-threads` + `--mcp` variants.
- **Acceptance:** `ai` joins `scaffold.runtime` alongside workers/sagas/triggers/streams; install →
  generate → type-check → Aspire start → chat-route smoke green (default + `--persist-threads`;
  `--mcp` variant lands with FAI-7/8 or is stubbed-then-filled); cleanup on `--cleanup`.
- **Dep:** FAI-0, FAI-1. **Blocks:** FAI-9. **Issue:** #388.

### FAI-3 — `plugins/ai` `publish:false` → publishable + jsr-audit
- **Labels:** `type:feat`, `area:plugin-ai`, `gate:jsr`, `epic:ai-stack`, `priority:p1`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.5`
- **Justification:** `plugins/ai/deno.json:25` sets `"publish": false` (verified) — unlike its
  siblings; publishing readiness is part of parity.
- **Acceptance:**
  - `deno.json` `publish` flag flipped; JSR-safe asset embedding (import attributes, never
    `readTextFile`/`fromFileUrl` — MEMORY jsr-safe-asset-embedding).
  - `deno doc --lint` clean on the **full export map** (`.`, `./adapter-cli`, `./public`, `./plugin`,
    `./adapter`, `./scaffold`, `./contracts`); `deno publish --dry-run` green.
  - Prerelease `latest: null` cosmetic caveat documented, not treated as a blocker (OQ-4).
- **Dep:** FAI-0. **Issue:** #388.

---

## Doctrine backstop S3 (beta.5, Opus workflow)

### FAI-4 — flagship-quality-parity law → doctrine-11 + README framing fix
- **Labels:** `type:docs`, `area:docs`, `area:plugin-ai`, `epic:ai-stack`, `priority:p1`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.5`
- **Justification:** the law lives only as #238-comment-10 → #388; doctrine-11 has **no** quality/
  test-parity section (verified); `plugins/ai/README.md:3` still reads "a **thin** NetScript plugin"
  unqualified (`F/02 §5.5`). If #388 closes without promotion the law has no durable home.
- **Acceptance:**
  - A dedicated new section in `docs/architecture/doctrine/11-plugin-thinness-and-base-seams.md`
    ("Thinness is a layering choice, not a quality-bar exemption") — owner-ratified wording
    (owner-fork 2).
  - `plugins/ai/README.md` framing corrected.
  - No `packages/`/`plugins/` **source** change (docs/README only) — Opus-workflow-eligible.
- **Dep:** none (land early). **Lane:** Opus workflow (docs); validation = OpenHands. **Issue:** new,
  references closed #263 (P6 doctrine) as precedent.

---

## Generative-UI (beta.6, WSL Codex)

### FAI-5 — `@netscript/fresh-ui` `ai` generative-UI catalog (minimal)
- **Labels:** `type:feat`, `area:fresh-ui`, `gate:jsr`, `epic:ai-stack`, `priority:p1`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.6`
- **Justification:** `renderUiTool` carries no design vocabulary (`render-ui.ts:9`, verified); eis-chat
  composes from a 30+-type catalog (`analysis/F-ai/02 §1`).
- **Acceptance:**
  - Lift eis-chat's `ui-spec.ts` contract verbatim (#258's own scope note) into the fresh-ui `ai`
    registry as a typed catalog.
  - **beta.6 minimal set:** layout + core viz (chart/stat/table) + interactive `button`
    (owner-fork 4); full 30+ vocabulary is a stable follow-on (additive, no renderer rework).
  - **`gate:jsr`:** new registry subpath added to `@netscript/fresh-ui` exports; `deno doc --lint`
    clean on the full export set; `deno publish --dry-run` green.
- **Dep:** none. **Blocks:** FAI-6. **Issue:** #258 (re-sequence stable→beta.6, minimal scope).

### FAI-6 — `@netscript/fresh/ai` FA3 recursive renderer + sandboxed-HTML fallback
- **Labels:** `type:feat`, `area:fresh`, `gate:jsr`, `epic:ai-stack`, `priority:p1`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.6`
- **Justification:** `packages/fresh/src/runtime/ai/sandbox.ts:71-77` is a literal FA0/FA3 skeleton —
  `createNetScriptMcpSandbox` throws `notImplemented(...)` (verified); `packages/fresh/deno.json:15-16`
  already exports `./ai/sandbox`.
- **Acceptance:**
  - `createNetScriptMcpSandbox` (and the render entrypoint) implement a **recursive
    JSON→component-tree renderer** over the FAI-5 catalog + a **zero-network sandboxed-HTML escape
    hatch** for one-off visuals.
  - The `render_ui` tool envelope (`packages/ai/src/tools/domain/render-ui.ts`) is wired to the
    renderer (dispatch still returns `deferred: true` in core; the renderer runs in `fresh/ai`).
  - One-projection law (FA1/FA2) untouched.
  - **`gate:jsr`:** `./ai/sandbox` export surface `deno doc --lint` clean; `deno publish --dry-run` green.
- **Dep:** FAI-5. **Blocks:** FAI-8, FAI-9. **Issue:** #252 (FA3).

---

## MCP pooling (beta.6, WSL Codex)

### FAI-7 — MCP pooling primitive + `ui://` resource extraction
- **Labels:** `type:feat`, `area:ai-core`, `gate:jsr`, `epic:ai-stack`, `priority:p1`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.6`
- **Justification:** `createMcpTransport` builds a single transport, no pooling (`factory.ts:16-21`,
  verified); eis-chat pools multi-server keyed by id + keep-alive + `ui://` extraction
  (`analysis/F-ai/02 §2`).
- **Acceptance:**
  - A multi-server pool keyed by id over the existing `StdioMcpTransport`/`StreamableHttpMcpTransport`
    (which already carry reconnect backoff + lifecycle state, `F/01 §2.3`); keep-alive across turns;
    tool-name prefixing; `ui://`-resource extraction surfaced to the render-ui seam.
  - Built in `@netscript/ai` core (no `plugins/ai` consumer re-hand-rolls it).
  - **`gate:jsr`:** `@netscript/ai/mcp` surface `deno doc --lint` clean; `deno publish --dry-run` green.
- **Dep:** none. **Blocks:** FAI-8, FAI-14. **Issue:** new (over the #240 ENGINE cluster).

### FAI-8 — `createMcpAppCallHandler` (FA4) + `mcp-ui-widget` (FB4) interactive round-trip
- **Labels:** `type:feat`, `area:fresh`, `area:fresh-ui`, `gate:jsr`, `epic:ai-stack`, `priority:p1`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.6`
- **Justification:** #379 FA4 (ACT half: widget action → `tools/call`) + #257 FB4 (themed sandboxed
  `ui://` iframe) are the act + render halves of one feature; #257 "now depends on FA4 to be
  interactive" (`F/04 §3`).
- **Acceptance:**
  - `createMcpAppCallHandler` route in `@netscript/fresh/ai` (widget action → `tools/call`, allowlist,
    stdio fallback, OTel).
  - `mcp-ui-widget` (themed sandboxed `ui://` iframe) in fresh-ui `ai` registry.
  - Uses the FAI-7 keep-alive pool so discovery + widget round-trips hit the same connected server.
  - **`gate:jsr`:** both new surfaces `deno doc --lint` clean; `deno publish --dry-run` green.
- **Dep:** FAI-7, FAI-6. **Issue:** **fold #257 into #379's landing**; #272 (FB6 bidirectional bridge)
  stays a stable follow-on, dependency-superseded by this.

### FAI-9 — beta.6 capability merge gate
- **Labels:** `type:test`, `gate:e2e`, `area:plugin-ai`, `area:cli`, `epic:ai-stack`, `priority:p1`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.6`
- **Scope note:** FAI-9 is the **beta.6** capability merge gate only — it proves the generative-UI +
  MCP-widget capabilities land, not the beta.7 depth seams or the stable OTel adapter. The beta.7 and
  stable tiers carry their own gates (see the per-milestone gate row in the Milestone summary); do not
  read FAI-9 as gating FAI-10…17.
- **Acceptance:** extend the FAI-2 `ai` e2e (`--mcp` variant) with a generative-UI render assertion
  (a `render_ui` tree renders through FAI-6) + an MCP widget round-trip smoke (FAI-8). Fails if
  FAI-5…8 did not land. Cleanup on `--cleanup`.
- **Dep:** FAI-5, FAI-6, FAI-7, FAI-8. **Issue:** new (beta.6 gate, sibling to FAI-2).

---

## Depth seams (beta.7, WSL Codex)

### FAI-10 — reasoning-effort/token-cap per-call `modelOptions` passthrough  · **NEW ISSUE**
- **Labels:** `type:feat`, `area:ai-core`, `gate:jsr`, `epic:ai-stack`, `priority:p2`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.7`
- **Justification:** adapters take static construction-time config only, no per-call options bag
  (verified §12); but `openRouterReasoningModelOptions` + `ReasoningEffort` already exist (`F/01 §2.3`)
  — this is **extend-and-lift-to-the-port**, not greenfield. Gap 4 has **no existing issue** (OQ-2).
- **Acceptance:** a per-call `modelOptions` bag on `ChatClientPort.stream` covering Anthropic
  adaptive-thinking + effort, OpenAI/OpenRouter `reasoning.effort`, OpenRouter `maxCompletionTokens`;
  reject the deprecated Anthropic `enabled`+`budget_tokens` shape (400s); `gate:jsr` on the changed
  `@netscript/ai/ports` + adapter surfaces.
- **Dep:** none. **Blocks:** FAI-11. **Issue:** file new under `epic:ai-stack`.

### FAI-11 — BYOK per-request key/baseURL resolution seam  · **NEW ISSUE**
- **Labels:** `type:feat`, `area:ai-core`, `gate:jsr`, `epic:ai-stack`, `priority:p2`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.7`
- **Justification:** provider factories take static `apiKey`/`baseURL` at construction (verified §12);
  multi-tenant/user-supplied keys need a per-request override the current config cannot express
  (`analysis/F-ai/02 §4`). No existing issue.
- **Acceptance:** a per-request key/baseURL override seam (incl. Ollama host) that adapters resolve
  without an app hand-rolling an override layer; `gate:jsr`.
- **Dep:** FAI-10. **Issue:** file new under `epic:ai-stack`.

### FAI-12 — E15 composable system-prompt assembly seam
- **Labels:** `type:feat`, `area:ai-core`, `gate:jsr`, `epic:ai-stack`, `priority:p2`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.7`
- **Justification:** ordered SYSTEM sections (catalog/skills/memory/instructions) — the injection point
  skills + memory need. #380, freshly filed, `status:` unlabeled (backfill).
- **Acceptance:** an ordered composable system-prompt assembly API; skills (FAI-13) + memory (FAI-15)
  inject through it; `gate:jsr`.
- **Dep:** none. **Blocks:** FAI-13, FAI-15. **Issue:** #380 (re-sequence beta.3→beta.7, add `status:`).

### FAI-13 — SkillLoaderPort L1/L2/L3 reference loader + tool triad
- **Labels:** `type:feat`, `area:ai-core`, `gate:jsr`, `epic:ai-stack`, `priority:p2`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.7`
- **Justification:** `SkillLoaderPort` is a no-op (`createNoopSkillLoader` returns `[]`, verified);
  no reference loader (`analysis/F-ai/02 §3`).
- **Acceptance:** a **filesystem-backed** L1/L2/L3 progressive-disclosure loader (SKILL.md metadata
  catalog + tag trigger; embedding-semantic tier may start optional) + the `use_skill`/
  `read_skill_resource`/`create_skill` read-side tool triad (#246 scope correction). Write-side
  approval-gate (#271 E12) stays stable. `gate:jsr`.
- **Dep:** FAI-12. **Blocks:** FAI-14. **Issue:** #246 (E7; re-sequence beta.4→beta.7).

### FAI-14 — `plugins/ai` `--mcp`/skill scaffolder + e2e variant
- **Labels:** `type:feat`, `area:plugin-ai`, `gate:e2e`, `epic:ai-stack`, `priority:p2`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.7`
- **Justification:** `--mcp`/skill scaffold flags deferred pending E7 (`F/01 §4.4`, README).
- **Acceptance:** the `--mcp`/skill scaffolder flags emit typesafe glue (#157 — codegen not string
  templates, MEMORY scaffold-surface-typesafe-codegen); e2e variant added to FAI-2/9.
- **Dep:** FAI-7, FAI-13. **Issue:** #290 (P2-follow; re-sequence beta.4→beta.7).

### FAI-15 — MemoryPort.recall reference adapter
- **Labels:** `type:feat`, `area:ai-core`, `gate:jsr`, `epic:ai-stack`, `priority:p2`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.7`
- **Justification:** `AgentMemoryPort.recall?` optional + explicitly omitted ("see slice E10",
  `memory.ts:70`, verified); eis-chat's *primary* context strategy (`analysis/F-ai/02 §5`).
- **Acceptance:** a vector-recalled distilled-memory adapter — pre-turn top-k relevance recall injected
  as a system-prompt block (via FAI-12), post-turn distill-and-write-back, fully fail-soft. `gate:jsr`.
- **Dep:** FAI-12. **Blocks:** FAI-16. **Issue:** #269 (E10; re-sequence beta.4→beta.7).

### FAI-16 — RetrieverPort hybrid retrieval + citation provenance
- **Labels:** `type:feat`, `area:ai-core`, `gate:jsr`, `epic:ai-stack`, `priority:p2`, `status:plan`, `wave:v1`
- **Milestone:** `0.0.1-beta.7` (citation-provenance half may trail to `0.0.1-stable`)
- **Justification:** `RetrieverPort` unimplemented (#270/E11); lift eis-chat's scorer/chunker/
  query-cache (`F/04 §3`).
- **Acceptance:** chunk store + hybrid vector+keyword fusion + title-boost + citation mapping; `gate:jsr`.
- **Dep:** FAI-15. **Issue:** #270 (E11; re-sequence beta.4→beta.7/stable).

---

## Telemetry seam — CO-OWNED WITH TOPIC-B (stable)

### FAI-17 — `@netscript/ai/otel` GenAI-span adapter (== Topic-B T9)
- **Labels:** `type:feat`, `area:ai-core`, `area:telemetry`, `gate:jsr`, `epic:ai-stack`, `epic:telemetry-revamp`, `priority:p2`, `status:plan`, `wave:defer`
- **Milestone:** `0.0.1-stable`
- **Justification:** `TelemetryPort` no-op default, no `./otel` subpath (verified §10); wraps
  `chatOtelMiddleware` which already emits `gen_ai.*` spans in eis-chat (`ctx/F-ai/02 §3`).
  **This is the same work as Topic-B T9** — file ONCE, cross-labelled.
- **Acceptance:**
  - New `@netscript/ai/otel` subpath surfacing `chatOtelMiddleware` through `TelemetryPort`;
    GenAI-semconv attributes from Topic-B **T1**'s `SpanNames`/`createGenAiAttributes`; gated behind
    `gen_ai_latest_experimental`.
  - **`gate:jsr`:** new `./otel` export `deno doc --lint` clean; `deno publish --dry-run` green.
- **Dep (HARD, cross-topic):** Topic-B **T3** (thin-vs-SDK provider adapters + flush-on-exit — the
  OTel adapter shape and runtime-dep boundary FAI-17 builds on) + Topic-B **T6** (the beta.6 live-seam
  invocation in `packages/ai/src/runtime/mod.ts` must exist first). This matches Topic-B T9's own
  declared deps (`design/B-telemetry/epic-and-issues.md:156` + DAG `:168` = `T3, T6 → T9`). Topic-B
  **T1** is a *transitive* prerequisite (it supplies the `SpanNames`/`createGenAiAttributes` attribute
  conventions consumed through T3), not the direct hard-dep.
- **Ownership:** F-ai = implementation lane (it is `@netscript/ai` source); Topic-B = semconv-attribute
  correctness (T1) + adapter/SDK posture (T3) + dashboard views. **OQ-1 — owner ratifies the co-own so
  it is not built twice.**
- **Issue:** #248 (E9); re-sequence beta.4→stable; add `epic:telemetry-revamp` cross-label.

---

## Supersession map (DRAFT — owner approves before any Phase-2 filing; NO closes until approved)

> Recommendation only. `F/04 §5` verdict: **no outright supersession/close** — every open child was
> freshly filed post-re-sweep (2026-07-04) or explicitly re-validated. **NEVER a closing keyword on
> #238.**

| Issue | Title (short) | Recommendation | F-ai slice | Milestone move |
|---|---|---|---|---|
| #238 | AI-stack umbrella | **KEEP open** (re-milestone beta.3→beta.7; no close) | — | beta.3 → beta.7 |
| #219 | anchor (durable-CHAT) | **KEEP open** (anchor; closes when fresh/ai doc lands) | — | beta.3 (unchanged) |
| #388 | plugins/ai flagship parity | **KEEP** (load-bearing) | FAI-0…3 | **beta.3 → beta.5** |
| #263 | P6 doctrine (closed) | precedent for FAI-4 | FAI-4 | — |
| #258 | FB5 generative-ui-renderer | **KEEP** (promote up, minimal scope) | FAI-5 | **stable → beta.6** |
| #252 | FA3 MCP `ui://` sandbox | **KEEP** | FAI-6 | beta.3 → beta.6 |
| #379 | FA4 createMcpAppCallHandler | **KEEP** (+ backfill `status:`) | FAI-8 | **beta.3 → beta.6** |
| #257 | FB4 mcp-ui-widget | **FOLD** into #379's landing | FAI-8 | beta.4 → beta.6 |
| #272 | FB6 interactive MCP-App bridge | **KEEP stable** (dependency-superseded by FAI-8/#379; NOT counted as a fold) | — (stable follow-on) | stable (unchanged) |
| #380 | E15 system-prompt assembly | **KEEP** (+ backfill `status:`) | FAI-12 | **beta.3 → beta.7** |
| #246 | E7 SkillLoaderPort | **KEEP** | FAI-13 | beta.4 → beta.7 |
| #290 | P2-follow --mcp/skill scaffolder | **KEEP** | FAI-14 | beta.4 → beta.7 |
| #269 | E10 MemoryPort | **KEEP** | FAI-15 | beta.4 → beta.7 |
| #270 | E11 RetrieverPort | **KEEP** | FAI-16 | beta.4 → beta.7/stable |
| #248 | E9 OTel adapter | **KEEP** (co-own Topic-B T9; cross-label) | FAI-17 | **beta.4 → stable** |
| #247 | E8 orchestration | **KEEP stable** (re-sequence back down; not parity-critical) | — | beta.4 → **stable** |
| #262 | P5 --gateway | **KEEP stable** (re-sequence back down) | — | beta.4 → **stable** |
| #271 | E12 skill-authoring approval-gate | **KEEP stable** | — (FAI-13 note) | stable (unchanged) |
| #256 | FB3 paced-reveal | **KEEP** deferred | — | beta.4 → stable |
| #266 | usage/cost analytics | **KEEP track-only** (out of F-ai issue set) | — | Backlog/Triage |
| #387 | process guardrail | **CROSS-REF only** (harness lane, not F-ai) | — | — |
| — | reasoning/token-cap passthrough | **NEW ISSUE** (gap 4, un-issued) | FAI-10 | beta.7 |
| — | BYOK per-request keys | **NEW ISSUE** (gap 4, un-issued) | FAI-11 | beta.7 |
| — | doctrine backstop | **NEW ISSUE** (extends closed #263) | FAI-4 | beta.5 |

**Headline: 15 KEEP (12 re-sequenced) · 1 FOLD (#257 into #379) · 0 supersede/close · 3 NEW
issues (FAI-4, FAI-10, FAI-11).** #272 is **KEEP stable, dependency-superseded by FAI-8** — it is not
counted as a fold (it retains its own stable issue). This is the single authoritative headline;
`plan.md` mirrors it verbatim.

## Milestone summary

> **Slice count: 18** (FAI-0…17) — under the harness `< 30` bound. Stable-tier capabilities (#262
> gateway, #247 orchestration, #271 skill-write, #256 paced-reveal, #272 MCP-app bridge) are deferred
> explicitly, not padded into beta.6.

| Milestone | Slices |
|---|---|
| **0.0.1-beta.5** | FAI-0, FAI-1, FAI-2, FAI-3 (#388 parity) · FAI-4 (doctrine backstop) |
| **0.0.1-beta.6** | FAI-5, FAI-6 (generative-UI) · FAI-7, FAI-8 (MCP pooling + widgets) · FAI-9 (capability e2e) |
| **0.0.1-beta.7** | FAI-10, FAI-11 (reasoning/BYOK) · FAI-12 (system-prompt) · FAI-13 (skills) · FAI-14 (scaffolder) · FAI-15 (memory) · FAI-16 (retriever) |
| **0.0.1-stable** | FAI-17 (`@netscript/ai/otel`, co-own Topic-B T9) · FAI-16 citation-provenance half · deferred: #262, #247, #271, #256, #272 |

**Per-milestone merge gates (F1AI-07 — FAI-9 is not the whole-epic gate):**

| Milestone | Merge gate |
|---|---|
| beta.5 | FAI-2 `ai` scaffold.runtime e2e green + FAI-3 `gate:jsr` (`plugins/ai` first publish dry-run) |
| beta.6 | **FAI-9** (generative-UI render + MCP widget round-trip) |
| beta.7 | FAI-14 `--mcp`/skill e2e variant green (exercises FAI-10…13/15) + per-slice `gate:jsr` on the changed `@netscript/ai` surfaces |
| stable | FAI-17 `gate:jsr` (`./otel` publish dry-run) + co-land under Topic-B **T8** real-e2e assertion |

## Owner-facing forks (carry to ratification)

1. **Milestone re-sequencing of #238's beta.3/beta.4 children into the beta.5–stable train** (above +
   supersession map). Rework if deferred: the dashboard beta.6 AI panel would have no parity floor.
2. **Doctrine promotion** — new dedicated section in doctrine-11 (recommended) vs inline. FAI-4.
3. **AI sub-issue supersession map** — owner approves before Phase-2 filing (no closes until approved;
   never a closing keyword on #238). See table.
4. **Generative-UI scope at beta.6** — minimal catalog + renderer + HTML fallback (recommended) vs full
   30+ vocabulary. FAI-5/6.
5. **TanStack AI pre-1.0 pin-risk** — accept-with-exact-pin + upgrade-watch (recommended). Gate on FAI-*.
6. **E9/#248 ownership boundary** (F-ai FAI-17 vs Topic-B T9) — co-own, F-ai implements. **OQ-1.**
7. **Two new issues (FAI-10/11) to file** — reasoning/BYOK gap is un-issued. **OQ-2.**
8. **beta.5/6/7 milestones must be created** before filing (shared with Topics A–E). **OQ-4.**
