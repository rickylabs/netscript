# Topic F-ai — Per-slice agent briefs

> One brief per slice for Phase-2 implementation hand-off. **Lane law:** framework/plugin/sdk source =
> **WSL Codex** daemon-attached (mobile-visible, steerable); doctrine/README prose = **Opus workflow**
> (docs exception, CLAUDE.md); validation = **OpenHands** (qwen 3.7 max IMPL-EVAL). Each brief carries
> a `## SKILL` chapter (be generous — MEMORY handover-prompts-need-skill-chapter). Model/effort routed
> per MEMORY claude-model-routing-cost-policy. **This is planning output — no slice launches here.**

Shared skill baseline for **every** F-ai slice (do not restate per brief unless adding to it):
`netscript-harness` (always-on), `netscript-doctrine` (any `packages/`/`plugins/` change),
`netscript-deno-toolchain` (deno doc / deps / pin discipline), `netscript-pr` (labels/milestones/
closing-keywords), `netscript-tools` (scoped check/lint/fmt wrappers, validation evidence), `rtk`.

---

## FAI-0 — in-repo `/v1/ai` impl + bind scaffolder to `aiContractV1`
- **Lane / model:** WSL Codex, high effort (contract soundness + typestate).
- **Files:** `packages/plugin-ai-core/src/contracts/v1/ai.contract.ts` (consume `aiContractV1:377`),
  new in-repo router under `packages/plugin-ai-core` (or an example app), rewrite
  `plugins/ai/src/adapter/resources/stream-proxy/stream-proxy.stub.ts:16-64` +
  `.../resources/chat-route/*`, new soundness test mirroring `packages/workers-core/tests/`.
- **Contract-first:** implement `aiContractV1`/`AiRouter` (SSE `chat` async-generator +
  `models`/`invokeTool`/`embed`/`transcribe`) BEFORE rewriting the emitter; then make the scaffolder
  emit the binding.
- **Acceptance:** golden test asserts emitted handler imports `aiContractV1`; only the 2 accepted casts
  (MEMORY e2e-type-soundness-non-negotiable); `gate:jsr` deno doc --lint clean + dry-run green.
- **## SKILL:** `netscript-doctrine` (Archetype-1 Small Contract; base-contract seam — MEMORY
  plugin-contract-service-base-seam), `netscript-cli` (scaffolder/emitter mechanics), `jsr-audit`,
  + shared baseline.
- **Pitfalls:** #157 mandate — emitter produces typesafe factory/AST glue, never string templates
  (MEMORY scaffold-surface-typesafe-codegen). Do not rebuild the contract; it is already correct.

## FAI-1 — verify-plugin.ts + scaffolder golden tests + plugin doctor + parity review
- **Lane / model:** WSL Codex, medium.
- **Files:** new `plugins/ai/verify-plugin.ts`, golden tests under `plugins/ai/tests/` (currently only
  `manifest_test.ts`), `plugin doctor` coverage test, parity-review note attached to #388.
- **Acceptance:** all 6 emitters (`aiStarterResources`; reconcile #388's "7" — OQ-6) covered; doctor
  required-config path tested; parity vs `workers`/`sagas` recorded.
- **## SKILL:** `netscript-cli` (verify-plugin + plugin doctor conventions), `netscript-tools`
  (scoped-wrapper evidence), + shared baseline.
- **Dep:** FAI-0.

## FAI-2 — scaffold.runtime `ai` e2e
- **Lane / model:** WSL Codex, medium.
- **Files:** `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts` (add `ai` alongside
  workers/sagas/triggers/auth — verified absent), supporting fixtures.
- **Acceptance:** `ai` install → generate → type-check → Aspire start → chat-route smoke (default +
  `--persist-threads`); `gate:e2e`; cleanup on `--cleanup`. Do NOT split the full runtime smoke into
  per-gate commands (AGENTS.md).
- **## SKILL:** `netscript-cli`, `netscript-tools` (e2e:cli evidence + OpenHands trigger template),
  `netscript-release` (merge-readiness posture), + shared baseline. Note MEMORY
  db-init-prisma-schema-engine-flake (bounded retry on transient db-init).
- **Dep:** FAI-0, FAI-1.

## FAI-3 — plugins/ai publish:false → publishable + jsr-audit
- **Lane / model:** WSL Codex, medium.
- **Files:** `plugins/ai/deno.json:25` (`"publish": false` → true), asset-embedding audit across
  `plugins/ai/src`.
- **Acceptance:** import-attribute asset embedding only, never `readTextFile`/`fromFileUrl` (MEMORY
  jsr-safe-asset-embedding); deno doc --lint clean on the FULL export map (MEMORY
  jsr-doc-lint-full-export-set); `deno publish --dry-run` green; document `latest:null` cosmetic caveat.
- **## SKILL:** `jsr-audit` (primary), `netscript-deno-toolchain`, `netscript-release`, + shared
  baseline.
- **Dep:** FAI-0. **Highest-risk jsr delta (first publish).**

## FAI-4 — flagship-quality-parity law → doctrine-11 + README fix
- **Lane / model:** **Opus workflow (docs exception)**, medium. NO packages/plugins source.
- **Files:** `docs/architecture/doctrine/11-plugin-thinness-and-base-seams.md` (new dedicated section —
  owner-fork 2, OQ recommended), `plugins/ai/README.md:3` (framing fix).
- **Acceptance:** citable heading "Thinness is a layering choice, not a quality-bar exemption";
  README no longer reads unqualified "thin". Validation stays with OpenHands (does not self-certify).
- **## SKILL:** `netscript-doctrine` (primary — doctrine authoring + debt), `netscript-harness`
  (docs-authoring exception conditions), `jsr-audit` (if README affects publish framing).
- **Pitfalls:** MEMORY docs-voice-no-honesty-framing (no "honestly" framing). Land early — protects the
  law before #388 closes.

## FAI-5 — fresh-ui `ai` generative-UI catalog (minimal)
- **Lane / model:** WSL Codex, medium.
- **Files:** new catalog module in the `@netscript/fresh-ui` `ai` registry; lift eis-chat `ui-spec.ts`.
- **Acceptance:** minimal set (layout + chart/stat/table + `button`); typed catalog; `gate:jsr` on the
  new registry subpath. Full 30+ vocabulary deferred to stable (OQ-5).
- **## SKILL:** `deno-fresh` (fresh-ui registry + islands), `netscript-doctrine` (fresh-ui archetype),
  `jsr-audit`, + shared baseline.
- **Blocks:** FAI-6.

## FAI-6 — @netscript/fresh/ai FA3 recursive renderer + sandboxed-HTML fallback
- **Lane / model:** WSL Codex, high (recursive renderer + sandbox isolation).
- **Files:** `packages/fresh/src/runtime/ai/sandbox.ts` (`createNetScriptMcpSandbox` returns
  `notImplemented` — verified), `packages/fresh/deno.json:16` `./ai/sandbox` (already exported),
  wire `packages/ai/src/tools/domain/render-ui.ts` envelope to the renderer.
- **Acceptance:** recursive JSON→component-tree renderer over FAI-5 catalog + zero-network
  sandboxed-HTML escape hatch; one-projection law (FA1/FA2) untouched; `gate:jsr` on `./ai/sandbox`.
- **## SKILL:** `deno-fresh` (islands/hydration + sandbox), `netscript-doctrine`, `jsr-audit`, + shared
  baseline.
- **Pitfalls:** do NOT touch the durable-chat one-projection law "to match" eis-chat (it already encodes
  the #52 regression lesson). **Dep:** FAI-5.

## FAI-7 — MCP pooling primitive + ui:// resource extraction
- **Lane / model:** WSL Codex, high.
- **Files:** `packages/ai/src/mcp/application/factory.ts` (single-transport today — verified) + new pool
  module under `packages/ai/src/mcp`.
- **Acceptance:** multi-server pool keyed by id over the existing Stdio/Http transports (which carry
  reconnect backoff — `F/01 §2.3`); keep-alive across turns; tool-name prefixing; `ui://` extraction to
  the render-ui seam; built in core; `gate:jsr` on `@netscript/ai/mcp`.
- **## SKILL:** `netscript-doctrine` (Archetype-1 engine; wrap-don't-reinvent — prefer
  `@tanstack/ai-mcp` behind `McpTransportPort`), `netscript-deno-toolchain` (exact-pin `@tanstack/ai-mcp
  @0.2.1` — OQ-7), `jsr-audit`, + shared baseline.
- **Blocks:** FAI-8, FAI-14.

## FAI-8 — createMcpAppCallHandler (FA4) + mcp-ui-widget (FB4)
- **Lane / model:** WSL Codex, high.
- **Files:** new `createMcpAppCallHandler` route in `@netscript/fresh/ai`; `mcp-ui-widget` in fresh-ui
  `ai` registry.
- **Acceptance:** widget action → `tools/call` (allowlist, stdio fallback, OTel); themed sandboxed
  `ui://` iframe; reuses FAI-7 keep-alive pool; `gate:jsr` on both surfaces. Folds #257 into #379.
- **## SKILL:** `deno-fresh`, `netscript-doctrine`, `jsr-audit`, + shared baseline.
- **Dep:** FAI-7, FAI-6.

## FAI-9 — beta.6 capability e2e
- **Lane / model:** WSL Codex, medium.
- **Files:** extend the FAI-2 `ai` e2e (`--mcp` variant) in `runtime-gates.ts`.
- **Acceptance:** generative-UI render assertion (FAI-6) + MCP widget round-trip smoke (FAI-8);
  `gate:e2e`; cleanup on `--cleanup`.
- **## SKILL:** `netscript-cli`, `netscript-tools`, `netscript-release`, + shared baseline.
- **Dep:** FAI-5, FAI-6, FAI-7, FAI-8.

## FAI-10 — reasoning-effort/token-cap per-call modelOptions passthrough  · NEW ISSUE
- **Lane / model:** WSL Codex, high (cross-provider wire-shape divergence).
- **Files:** `packages/ai/src/ports/*` (ChatClientPort.stream options bag), all adapters under
  `packages/ai/src/*/` (static-config today — verified §12), lift `openRouterReasoningModelOptions` +
  `ReasoningEffort` (`F/01 §2.3`) to the port.
- **Acceptance:** per-call `modelOptions` covering Anthropic adaptive-thinking + effort, OpenAI/
  OpenRouter `reasoning.effort`, OpenRouter `maxCompletionTokens`; **reject** deprecated Anthropic
  `enabled`+`budget_tokens` (models 400); `gate:jsr`. **File the issue first (OQ-2).**
- **## SKILL:** `netscript-doctrine`, `netscript-deno-toolchain`, `netscript-pr` (file new issue +
  labels), `jsr-audit`, + shared baseline.
- **Blocks:** FAI-11.

## FAI-11 — BYOK per-request key/baseURL resolution seam  · NEW ISSUE
- **Lane / model:** WSL Codex, medium.
- **Files:** `packages/ai/src/*/` adapter construction paths + a per-request resolution seam.
- **Acceptance:** per-request key/baseURL override (incl. Ollama host) resolved by adapters without an
  app hand-rolling it; `gate:jsr`. **File the issue first (OQ-2).**
- **## SKILL:** `netscript-doctrine`, `netscript-pr`, `jsr-audit`, + shared baseline. **Dep:** FAI-10.

## FAI-12 — E15 composable system-prompt assembly seam (#380)
- **Lane / model:** WSL Codex, medium.
- **Files:** new system-prompt assembly module under `packages/ai/src`.
- **Acceptance:** ordered SYSTEM sections (catalog/skills/memory/instructions); skills + memory inject
  through it; `gate:jsr`. Backfill #380 `status:` label.
- **## SKILL:** `netscript-doctrine`, `netscript-pr`, `jsr-audit`, + shared baseline.
- **Blocks:** FAI-13, FAI-15.

## FAI-13 — SkillLoaderPort L1/L2/L3 reference loader (#246)
- **Lane / model:** WSL Codex, high.
- **Files:** `packages/ai/src/ports/skill-loader.ts` (`createNoopSkillLoader` today — verified) + new FS
  loader + `use_skill`/`read_skill_resource`/`create_skill` tool triad.
- **Acceptance:** filesystem-backed L1/L2/L3 progressive disclosure (SKILL.md catalog + tag trigger;
  embedding tier may start optional); read-side triad; write-side approval-gate (#271) stays stable;
  `gate:jsr`.
- **## SKILL:** `netscript-doctrine`, `netscript-deno-toolchain`, `jsr-audit`, + shared baseline.
- **Dep:** FAI-12. **Blocks:** FAI-14.

## FAI-14 — plugins/ai --mcp/skill scaffolder + e2e variant (#290)
- **Lane / model:** WSL Codex, medium.
- **Files:** `plugins/ai/src/adapter/*` scaffolder flags, e2e variant in `runtime-gates.ts`.
- **Acceptance:** `--mcp`/skill flags emit typesafe glue (#157 — codegen not templates); e2e variant
  green; `gate:e2e`.
- **## SKILL:** `netscript-cli`, `netscript-tools`, + shared baseline. **Dep:** FAI-7, FAI-13.

## FAI-15 — MemoryPort.recall reference adapter (#269)
- **Lane / model:** WSL Codex, high.
- **Files:** `packages/ai/src/ports/memory.ts` (`recall?` optional, omitted — verified `:70`) + new
  recall adapter.
- **Acceptance:** vector top-k pre-turn recall injected via FAI-12 system-prompt block; post-turn
  distill-and-write-back; fully fail-soft; `gate:jsr`.
- **## SKILL:** `netscript-doctrine`, `jsr-audit`, + shared baseline. **Dep:** FAI-12. **Blocks:** FAI-16.

## FAI-16 — RetrieverPort hybrid retrieval + citation provenance (#270)
- **Lane / model:** WSL Codex, high.
- **Files:** `packages/ai/src/ports/*` retriever + chunk store; lift eis-chat scorer/chunker/query-cache.
- **Acceptance:** hybrid vector+keyword fusion + title-boost + citation mapping; `gate:jsr`.
  Citation-provenance half may trail to stable.
- **## SKILL:** `netscript-doctrine`, `jsr-audit`, + shared baseline. **Dep:** FAI-15.

## FAI-17 — @netscript/ai/otel GenAI-span adapter (== Topic-B T9) · CO-OWNED
- **Lane / model:** WSL Codex, high. **Cross-topic co-own — coordinate with Topic-B owner (OQ-1).**
- **Files:** new `@netscript/ai/otel` subpath in `packages/ai` (`./otel` absent — verified §10), wraps
  `@tanstack/ai/middlewares/otel` `chatOtelMiddleware`, surfaces through `TelemetryPort`
  (`telemetry.ts:33`).
- **Acceptance:** GenAI-semconv attributes from Topic-B **T1** `SpanNames`/`createGenAiAttributes`;
  gated behind `gen_ai_latest_experimental`; consumers get spans by injecting the port; `gate:jsr` on
  `./otel`. File ONCE, cross-labelled `epic:ai-stack` + `epic:telemetry-revamp`.
- **## SKILL:** `netscript-doctrine`, `netscript-deno-toolchain` (exact-pin `@tanstack/ai`), `jsr-audit`,
  `netscript-pr` (cross-epic labels), + shared baseline.
- **Dep (HARD, cross-topic):** Topic-B T1 + T6. **Milestone stable.** Do NOT build if Topic-B T9 is
  already staged — reconcile ownership first (OQ-1).
