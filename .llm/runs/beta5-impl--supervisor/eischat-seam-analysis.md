# eis-chat Production Seam-Usage Analysis — beta.5 Docs/Tutorial Precondition

**Scope:** eis-chat @ a08ebe5 (+ a08ebe55 db-aspire-deploy pass) cross-checked against netscript-framework @ 1c175990 (ancestor of main 82fc92c0). Seven domain audits: contracts-services, plugins-composition, workers-jobs, streams-realtime, ai-seams, frontend-freshui, db-aspire-deploy, docs-and-story.

**Bottom line:** eis-chat is a sophisticated, deep consumer of NetScript across all seven domains — the "well" column below is not sparse. But three specific seams are systematically under-leveraged (`@netscript/contracts`, `@netscript/ai`, `@netscript/fresh/ai`) despite being already in the workspace or a sibling of packages the app imports heavily, and the #219 closing criterion is **not yet satisfied even where the app-side workaround exists** — see §3.

---

## 1. Seam-usage map

| Framework seam | How eis-chat uses it | Quality | Evidence |
|---|---|---|---|
| `@orpc/contract`/`@orpc/server` `oc`+`implement()` (direct, not via `@netscript/contracts`) | Contract-first backbone for all v1 routers | sub-optimal | `contracts/versions/v1/*.contract.ts` — no `.errors()`, no `baseContract` |
| oRPC per-router `$context<{db}>()` | Handler context typing | well | `routers/channel.ts:51`, `routers/skills.ts:42` |
| `@netscript/service` `defineService()` | Service bootstrap (CORS/logger/OpenAPI/docs/RPC/health/db) | well (partial) | `services/eischat/src/main.ts:7-23` — `auth` stage unused, no authn/authz on v1 API |
| `@netscript/sdk` `createServiceClient` | Typed RPC client, worker→eischat callback | well (reference-quality) | `services/eischat/src/channel-client.ts:17-25` |
| `@netscript/sdk` `getServiceUrl` | Aspire service discovery for workers-api base URL | well | `services/eischat/src/jobs.ts:26,56` — but paired with hand-rolled fetch (RPC not mounted) |
| `@netscript/contracts` `baseContract` | Only to satisfy `PluginServiceContext.contracts.base` bootstrap shape | well (narrow) | `services/_shared/plugin-service-context.ts:22` — never used for app's own contracts |
| `PluginServiceContext`/`WatchableKv` (`@netscript/plugin/sdk`, `@netscript/kv`) | `LazyPluginKv` full interface implementation | well | `services/_shared/plugin-service-context.ts:38-106` |
| `defineJobHandler` (`@netscript/plugin-workers-core`) | All 3 custom worker jobs | well | `workers/jobs/{embed-document,transcribe-image,health-check}.ts` |
| `ctx.reportProgress?.()` | Chunk-by-chunk embedding progress | well | `embed-document.ts:48,75-78,94,103` |
| `defineTask(...).handler(...).build()` | Task builder, chained | well | `workers/tasks/validate-payload.ts:1-13` |
| Generated static workers registry | Runtime job loading | sub-optimal (framework gap forces app shim) | `.netscript/generated/plugin-workers/job-registry.ts` hand-patched |
| `defineStreamSchema`+`createDurableStream` | Producer scaffold + real share-registry stream | well | `streams/notifications-stream.ts` (scaffold, unused) vs `routes/api/share.ts:21-25` (real, used) |
| `buildStreamUrl`/`getStreamsUrl`/`getStreamsAuth` | Stream discovery + auth everywhere a stream is touched | well | `chat-stream.ts`, `stream-loaders.ts`, `streams/[...path].ts`, `chat.ts` |
| `createNetScriptStreamDB`+`useLiveQuery` (`@netscript/fresh/streams`,`/query`) | Reactive client subscriptions | well (minor cast needed) | `islands/SharingPanel.tsx`, `islands/KnowledgePanel.tsx` |
| `WorkerExecutionSchema` reuse | Cross-package schema import, no redefinition | well | `lib/kb-executions-stream.ts:32,56` |
| Hand-rolled durable-stream read proxy + `Accept-Encoding: identity` | Workaround for #219 gzip mislabel | hand-rolled (forced) | `chat-stream.ts:26-115`, `streams/[...path].ts:27-118`, `stream-loaders.ts:82` |
| `@netscript/fresh/ai` (FA1/FA2) | **Not imported anywhere** — app re-derives the same composition manually | **unused** (framework-side gap: hardcoded subpath) | zero hits on `@netscript/fresh/ai` despite deep `@netscript/fresh/*` usage elsewhere |
| Raw OpenAI/OpenRouter `fetch()` for embeddings/vision | Hand-rolled provider config, key resolution, error handling | hand-rolled (duplicates `@netscript/ai`) | `services/eischat/src/embeddings.ts:18-56`, `vision.ts:8-46` |
| Bespoke cosine-similarity `semanticMatch` store | Skills semantic-trigger matching | hand-rolled (legitimate gap — no `VectorStorePort` exists) | `routers/skills.ts:246-326`, `@eis-chat/skills` |
| `@netscript/fresh-ui/interactive` `Combobox`+`Dialog` | Command palette | well (correct copy-vs-import split) | `components/ui/command-palette.tsx:15-16,116-176` |
| Copy-registry components (button, badge, avatar, card, etc.) | Byte-identical vendoring | well | `components/ui/button.tsx` |
| Native `<dialog>.showModal()/.close()` hand-rolled modals | Confirm/rename/delete dialogs, 3+ sites | sub-optimal (app already proves `Dialog.Root` works one file over) | `SessionActions.tsx:155-217`, `KnowledgePanel.tsx:625-653`, `SessionScratch.tsx` |
| Hand-rolled `DataGrid<T>` | Table rendering | sub-optimal (duplicates stable root export) | `components/blocks/data-grid.tsx` vs `@netscript/fresh-ui` `mod.ts:24-33` |
| Hand-rolled drag/paste ingest | File upload in KnowledgePanel | sub-optimal (duplicates newer Dropzone ingest API) | `islands/KnowledgePanel.tsx:378-487` vs current registry `dropzone.tsx:79-186` |
| Token pipeline (`build-tokens.ts`) | App tokens generated, not hand-authored | well | `assets/tokens.json:3` |
| Prisma v7 driver-adapter (`PrismaLibSql`) + `enablePrismaTracing` | DB client + OTel tracing | well | `database/sqlite/mod.ts:7-14,27-28` |
| Generated Aspire apphost (register-*.mts family) | Two-pass resource/cross-ref registration | well (structurally intact) | `aspire/.helpers/register-{infrastructure,services,plugins,background,apps}.mts` |
| Hand-edited Aspire cross-refs (Garnet cache, desktop app type, MCP discovery env, Service PluginReferences) | 4 distinct hand-edits into "DO NOT EDIT" generated files, comment-disciplined | hand-rolled (forced by real framework gaps, each independently documented) | `register-infrastructure.mts:47-69`, `register-apps.mts:92-174`, `register-background.mts:128-135` |
| oRPC contract-first full-stack trace (contract→router→client→island) | End-to-end feature slice | well | `docs/PHASE-5-NOTES.md:17-27` traces `channel.contract.ts`→`channel.ts:324`→`channel-service.ts`→`KnowledgePanel.tsx` |

---

## 2. Push-further opportunities (ranked)

1. **[framework-side, highest evidence-weight]** Fix `plugin-workers` registry-compiler to emit `jobDefinitions`/`definitions` alongside the handler map. This is the only gap in the list with a **shipped production bug** as direct evidence (workers-API "Total jobs in registry: 1", `triggerJob('embed-document')` 404, KB ingestion silently never running). The runtime side (`loadGeneratedJobRegistry`) already reads the export; only the CLI compiler needs to emit it. Fixing this deletes eis-chat's `workers/job-definitions.ts` shim and the hand-patched generated-file re-export outright.

2. **[app-side, single highest-value adoption gap]** Swap `services/eischat/src/embeddings.ts` + `vision.ts` (~130 hand-rolled lines: raw fetch, manual `.env` parsing, hardcoded model defaults that already coincide with the framework's own defaults) onto `@netscript/ai`'s `OpenAiEmbeddingsProvider`. Zero new infrastructure needed — it's a directly-importable library, no plugin/service scaffold required. This is the most "leverage left on the table for free" finding in the whole audit.

3. **[framework-side]** Investigate why FA2 (`createNetScriptChatStreamProxy`) is unadopted, then fix root cause: FA1/FA2 hardcode the `/ai/chat` stream subpath with no override hook, which is the *concrete, named reason* eis-chat re-implemented the whole proxy/connection composition independently rather than importing a sibling subpath of a package (`@netscript/fresh`) it otherwise imports deeply (`/error`,`/form`,`/route`,`/server`,`/streams`,`/vite`). Once fixed, this deletes ~150 duplicated proxy lines and closes a real gap in RFC-9110 hop-by-hop header coverage (eis-chat's hand-rolled strip set is missing 5 headers FA2 already gets right).

4. **[framework-side, correctness-critical — blocks #219 closure]** Verify whether FA2's header-stripping fix actually addresses the *decode-time crash* eis-chat's workaround describes (`Invalid gzip header` thrown by auto-decompression), rather than only a stale-header symptom. If FA2 never disables/forces `Accept-Encoding` on the upstream request, it cannot repair this class of failure. This must be resolved **before** docs showcase FA2 as "the fix for #219."

5. **[app-side]** Consolidate the 3+ hand-rolled `<dialog>.showModal()` sites onto `Dialog.Root`/`Dialog.Content` — the app already proves the primitive works correctly in `command-palette.tsx`. Same-file-family consolidation, not a new integration; cheapest win in the list.

6. **[app-side, contingent on version bump]** Swap `components/blocks/data-grid.tsx` for the stable `DataGrid` root export, and reconcile `components/ui/icon.tsx` against the stable `Icon` export — both already declared as dependencies but bypassed via vendored parallel implementations, mostly a beta.1-pin artifact (see §5 pin-drift issue).

7. **[app-side, contingent on version bump]** Route `KnowledgePanel.tsx`'s hand-rolled `onDrop`/`onPaste`/`ingestFiles` (~80 lines) through Dropzone's current `onFile`/`onFiles`/`onReject`/`accept`/`multiple` API — the vendored copy predates the ingest API entirely.

8. **[framework-side]** Wire `WorkflowExecutor`/`defineWorkflow` (fully implemented, zero call sites in the workers service) into the workers-API behind a `POST /workflows/{id}/trigger` route. Textbook fit for eis-chat's `transcribe-image → embed-document` chain, currently a raw-HTTP `enqueueJob` hop with manual `correlationId` bookkeeping.

9. **[framework-side]** Implement real spans in `plugin-streams-core`'s `streamsInstrumentation.setup()` (currently a no-op stub) — directly explains why eis-chat's own OTel wrapping is inconsistently applied across two structurally-identical proxy routes.

10. **[app-side]** Adopt `@netscript/contracts`'s `baseContract`/`createCrudContract`/`createPaginatedOutput`/`createTransformer` family for the app's own v1 contracts. `SkillsContractV1` is an almost-exact hand-rolled CRUD shape; `EischatListInputSchemaV1` reimplements the pagination primitive exactly; the repeated row-to-DTO mapping pairs (add/list for scratch, message, feedback, knowledge) are a direct `createTransformer` fit. Lower-ranked than #2 only because the fix is more mechanical/less load-bearing than the AI-provider swap.

11. **[framework-side]** Type `NetScriptStreamDB`'s `preload`/`close` explicitly so island consumers stop duck-typing (`as unknown as {...}`) to call methods the underlying adapter already exposes.

12. **[framework-side]** `plugins/ai` ships no runnable service (no `services/src/main.ts`), unlike every other first-party plugin. Until it does, eis-chat's embed/vision jobs can't route through the same typed-RPC pattern the app already trusts for everything else (`createServiceClient`).

13. **[framework-side]** Promote or fix the Garnet/DenoKv multi-process cache workaround (#371) into the framework itself (auto-provision a Redis-compatible executable when `Cache.Mode=='External'` + multi-process topology detected) instead of per-app manual server standup.

14. **[framework-side]** Add a first-class `Type:'desktop'` Aspire app-registration primitive — eis-chat already wrote the upstream-ready spec (`aspire/PROPOSED-desktop-resource.md`); this is a "lift, don't design" opportunity.

15. **[docs-side]** Generalize the "P-LIFT feedback loop" (framework owns tokens/L2/shell chrome, app owns only L3; two real upstream registry bugs found and fixed via this app) into a documented workflow, paired with a `ui:diff`/`ui:sync-check` tool so locally-patched copy-source files don't silently drift from upstream fixes.

16. **[framework-side]** Give Service config entries `PluginReferences`/`ServiceReferences` (currently only Plugin/BackgroundProcessor entries have them), reconciling the orphaned duplicate `ServiceConfigSchema.pluginReferences` field the live codegen path never reads.

---

## 3. #219 closing-criterion status

**Accept-Encoding: identity workaround sites found: 3**, all explicitly tagged `netscript#219 pt.3` in-code:

| # | File:line | Context |
|---|---|---|
| 1 | `apps/dashboard/routes/api/chat-stream.ts:72` | durable-chat read proxy |
| 2 | `apps/dashboard/lib/stream-loaders.ts:82` | SSR snapshot/resume bootstrap |
| 3 | `apps/dashboard/routes/api/streams/[...path].ts:77` | generic stream read proxy |

**Root cause (verified in-code):** the durable-streams runtime mislabels a plain-JSON body with `content-encoding: gzip` (payload starts `[{`, not the gzip magic `1f 8b`), which crashes any standards-compliant auto-decompressing reader — Deno `fetch` throws `Invalid gzip header`; browser `DecompressionStream` throws `Decoding failed`.

**FA1/FA2 seam consumption: NOT consumed.** Zero files in eis-chat import `@netscript/fresh/ai` (repo-wide grep, confirmed against a codebase that otherwise imports six other `@netscript/fresh/*` subpaths deeply). Two independent, compounding reasons surfaced:

1. **FA1/FA2 hardcode the `/ai/chat` stream subpath** with no override — incompatible with eis-chat's own convention (`/eischat/sessions/{id}/messages`), so the app couldn't adopt the wrapper even if it wanted to.
2. **FA2's fix may not address the actual failure mode.** FA2's `sanitizeUpstreamResponse` strips headers *after* `await doFetch(...)` resolves — implicitly assuming the body already decoded successfully. But eis-chat's workaround comments describe a **decode-time crash** (the auto-decompressor throwing before a response is even usable), not a stale-header symptom. FA2 does not appear to set `Accept-Encoding: identity` or otherwise disable decompression on the upstream request.

**Verdict: #219 is not closed by the existence of FA1/FA2.** Before docs/tutorial content presents FA2 as "the fix," the framework side needs (a) a configurable subpath, and (b) verification against the real mislabeling bug — not just a synthetic stale-header test. Until then, eis-chat's 3 workaround sites remain necessary and should **not** be scrubbed from a docs example that references this history.

---

## 4. Docs/tutorial input pack

| Source file | Demonstrates | Suggested doc home |
|---|---|---|
| `services/eischat/src/channel-client.ts:1-25` | Clean `createServiceClient<Contract>` typed RPC client, worker→service callback, with doc-comment explaining when RPC works vs. 404s | `@netscript/sdk` — "typed cross-service client" how-to |
| `services/eischat/src/jobs.ts:1-24` (header comment) | Precise, verified write-up of the RPC-vs-OpenAPI split on plugin services; correct fallback when a service is OpenAPI-only | `@netscript/sdk` docs — "choosing createServiceClient vs raw fetch," contrasted with `channel-client.ts` |
| `services/eischat/src/routers/channel.ts:51,59-62,325-329` | `$context<{db}>()` + per-handler `context.db` typing | oRPC/service docs — contract-to-handler context typing |
| `services/_shared/plugin-service-context.ts:38-106` | `LazyPluginKv`, reference `WatchableKv` implementation | Plugin bootstrap / host-owned context docs |
| `services/eischat/src/embeddings.ts` + `vision.ts` (before) vs `OpenAiEmbeddingsProvider` (after) | Migrating a hand-rolled OpenAI-compatible client to `@netscript/ai` | `@netscript/ai` — migration how-to |
| `apps/dashboard/lib/llm.ts` `buildProviderAdapter` | Multi-provider TanStack AI wiring (Anthropic/OpenAI-compatible/OpenRouter/Ollama), BYOK key precedence | `@netscript/ai` ports/model-provider docs |
| `eis-chat/workers/tasks/validate-payload.ts:6-12` | Canonical one-chained-call `defineTask(id).handler(fn).build()` | `plugin-workers-core` docs, doctrine A3 illustration |
| `eis-chat/streams/notifications-stream.ts:13-58` | `defineStreamSchema` + `createDurableStream` scaffold-stub | `plugin-streams-core` docs — producer wiring (flag as scaffold-only, note it's unused in prod so far) |
| `eis-chat/services/eischat/src/sharing.ts` + `plugins/channel-sync/mod.ts` | Backend-agnostic domain interface + one swappable adapter, zero framework machinery | Recommended lightweight alternative to a full `plugin new` package |
| `apps/dashboard/lib/registry-stream.ts` + `islands/SharingPanel.tsx` + `routes/api/share.ts` | Durable stream as a live registry, full schema→producer→island lifecycle | Streams seam how-to |
| `apps/dashboard/lib/kb-executions-stream.ts` | Cross-plugin stream consumption reusing producer-owned schema verbatim; honest liveness overlay (never claims terminal state from stream) | "Consuming another plugin's stream without appropriating its source of truth" |
| `apps/dashboard/lib/stream-loaders.ts` | "Ensure-if-missing, then materialize snapshot + resume offset" SSR bootstrap | Durable-stream SSR prepare/resume pattern |
| `apps/dashboard/components/ui/message.tsx` | Flagship composition of fresh-ui primitives (Avatar, ChartBlock, Donut, ResponsiveTable, StatsGrid, CodeBlock, ToolCallCard, CitationChip, Markdown) into a production chat renderer | fresh-ui "production composition" tutorial |
| `apps/dashboard/components/ui/command-palette.tsx:15-16` | Copy-vs-import split done correctly (presentational=copy, stateful=package import) | fresh-ui docs — copy-vs-import split, shown verbatim |
| `apps/dashboard/assets/tokens.json:3` | App wiring tokens to fresh-ui's own `build-tokens.ts` pipeline instead of hand-authoring | `tokens:build` task docs |
| `docs/design/DECISIONS.md:37-52` (eis-chat's own docs) | P-LIFT doctrine in practice: full registry refresh via CLI, two real upstream bugs found and fixed | fresh-ui "consume as a copy-source registry correctly" tutorial |
| `docs/design/BUILD-CONTRACT.md:27-30` (eis-chat's own docs) | Compact "netscript idioms" cheat-sheet (`definePage().withRoute()...`, `useIslandQuery`/`useIslandMutation`, `@netscript/fresh/form`) | `@netscript/fresh` web-layer builders quickstart |
| `docs/PHASE-5-NOTES.md:17-27` (eis-chat's own docs) | File-level trace of one feature slice: contract → service handler → package → typed client → island | "Trace a feature through the stack" annotated docs example |
| `docs/DESKTOP-SHELL.md:12-93,217-296` (eis-chat's own docs) | Grounded architecture-decision narrative (native shell options a/b/c, single-writer risk, structurally-typed feature detection for `Deno.BrowserWindow`) + a ready-made upstream spec for a `Type:'desktop'` Aspire resource | "Framework limits and how a real app worked around them," feeds directly into a Type:desktop docs page once shipped |
| `aspire/.helpers/db-cli-mode.mts` (unmodified, framework-generated) | One Aspire builder entrypoint serving both `aspire run` and `netscript db <op>` CLI dispatch | Aspire+CLI co-existence how-to |
| `aspire/.helpers/register-plugins.mts` / `register-background.mts` (with `#NNN HAND-EDITED` comments) | Two-pass Aspire registration (create-all, then wire cross-refs) + interim hand-edit-discipline convention | Aspire apphost customization guide |

Note the docs-and-story audit's own strongest finding: eis-chat's **internal** docs (README/HANDOVER/INDEX/PHASE files) are themselves stale relative to the running system — a caution for the tutorial team not to mine PHASE-1..7 code samples verbatim, since they predate the contract/oRPC architecture decision and demonstrate a parallel, non-contract-based approach the app no longer follows.

---

## 5. Issue candidates (deduped, evidence-backed)

1. **plugin-workers registry-compiler never emits job `definitions`, only the handler map** — `compileWorkersRegistry` (registry-compiler.ts) renders only `jobRegistry`/`registry`; `loadGeneratedJobRegistry`/`registerGeneratedJobDefinitions` both read `module.jobDefinitions ?? module.definitions`, which is never produced. Live production consequence: `.netscript/generated/plugin-workers/job-registry.ts` hand-patched with a "re-add this export" comment; `workers/job-definitions.ts` (108-line shim) exists purely as a workaround. **Highest-confidence, evidence-richest candidate — file first.**

2. **`@netscript/contracts` primitives (`baseContract` error map, `createCrudContract`, pagination, transformers) are unused by a real production consumer's own contract layer**, despite being in the workspace root deno.json and actively imported elsewhere in the same repo, and despite the CLI scaffold's own generated contract template defaulting to exactly these primitives. Needs triage: stale/pre-dates-template gap vs. discoverability gap.

3. **`plugins/ai` ships no runnable service** (no `services/src/main.ts`), unlike every other first-party plugin (auth/sagas/streams/triggers/workers). Blocks any app from getting `embed`/`transcribe` RPC routes "for free" via `plugin add ai` today.

4. **FA1/FA2 hardcode the `/ai/chat` durable-stream subpath** with no override hook on `NetScriptChatConnectionOptions` — concrete, named reason a real consumer reimplemented the whole composition instead of importing it.

5. **FA2 may not fix the decode-time crash flavor of #219** — its header-sanitization runs after a successful fetch resolve; the actual bug is an auto-decompressor throwing before a usable response exists. Needs verification against the real mislabeling bug before being treated as sufficient to close #219's identity-workaround-removal criterion. **(See §3 — blocks docs from citing FA2 as "the fix.")**

6. **`plugin-streams-core` telemetry `instrumentation.setup()` is a no-op stub** — references its own constants only to avoid unused-var lint, never creates a span. Downstream consumers hand-roll and inconsistently apply their own OTel wrapping as a result.

7. **`NetScriptStreamDB` type surface omits `preload`/`close`**, forcing Fresh island consumers into `as unknown as {...}` duck-type casts to call lifecycle methods the underlying adapter actually returns.

8. **No framework-provided durable-stream read proxy for Fresh routes** — apps hand-roll a header-stripping, `Accept-Encoding: identity`-forcing, disconnect-bridging `ReadableStream` proxy (~150 duplicated lines across 2+ routes) to work around the #219 gzip mislabel.

9. **`plugin-add-streams` scaffold's sample stream (`notifications-stream.ts`) ships as inert, never-adopted boilerplate** in a real production consumer — no doctor/gate flags an untouched-since-scaffold sample file.

10. **`JobBuilder.retry(maxRetries, {backoff,...})` accepts a backoff strategy the runtime never consumes** — dispatch reads only a flat `retryDelay`; the builder's public type promises exponential/linear backoff it can't deliver.

11. **`WorkflowExecutor`/`defineWorkflow`** — a fully implemented durable job/task-chaining engine — **is never wired into the workers plugin service or contract.** No route exists to trigger a defined workflow over HTTP; real consequence is eis-chat's hand-chained `transcribe-image → embed-document` via raw HTTP.

12. **`createPluginHostLoader`/`resolvePluginHostState` is dead DI wiring** in the CLI's composition root — constructed but never called by any command feature. If wired to a doctor/inspect verb, would catch semantically-inert `netscript.config.ts` `plugins: [...]` entries (eis-chat's own array currently would not validate).

13. **`DbContext = object`** is too weak to avoid a double-through-`unknown` assertion at `defineService`'s db option call site, paired with a comment that misdescribes the actual framework type.

14. **Single-provider DB scaffold emits fully dead multi-provider (postgres/mysql/mssql) connection-string normalization code**, duplicated verbatim across generated `mod.ts` and `prisma.config.ts` templates, reinventing inline what already exists as richer public `@netscript/database` exports.

15. **`SharedDatabaseConfig`'s documented 'auto'-provider/Aspire-discovery contract has no implementing factory** anywhere in `@netscript/database` — either implement it or remove the promise from the docstring.

16. **Service config entries cannot declare `PluginReferences`/`ServiceReferences`** (only Plugin/BackgroundProcessor entries can), forcing hand-edited cross-map wiring in generated `register-background.mts`; a second, orphaned `ServiceConfigSchema.pluginReferences` field exists but the live codegen path never reads it.

17. **No first-class `Type:'desktop'` Aspire app-registration primitive** — eis-chat's `aspire/PROPOSED-desktop-resource.md` is a ready-made upstream spec; confirm whether already filed, file directly from that document if not.

18. **DenoKv `Mode:'External'` cache no-ops in multi-process topologies** (tracked as #371 per in-code comment) — verify the tracking issue is still open/linked; eis-chat carries a full separate-Redis-server workaround rather than a fix.

19. **Activating `plugin-workers`' `DurableStreamProducer` wiring (workers-api→streams) breaks all task processing** (every task, including the plugin's own internal cron health-check, logs "Processing task undefined" and never resolves) — eis-chat's comment claims this was filed upstream already; verify the tracking issue is still open and linked, since the feature remains permanently disabled in production rather than fixed.

20. **No in-process/link-mode transport for `@netscript/sdk`'s `createServiceClient`** — always builds an HTTP link regardless of caller; blocked a single-binary desktop deployment, forcing a multi-process Aspire topology with an HTTP loopback hop purely for this reason. eis-chat's own docs name this as an explicit out-of-scope architecture change.

21. **No registry-catalog generator for `@netscript/fresh-ui`** — apps building a component gallery hand-transcribe the registry list with a comment promising a manifest generator that doesn't exist anywhere in the framework tree.

22. **No upgrade/diff signal when a vendored copy-source component (e.g. Dropzone) gains new API surface** — a real consumer ended up hand-rolling ingest logic a newer registry version already owns, purely from a stale beta.1 pin with no `ui:diff`/`ui:sync-check` tool to catch drift.

23. **`fresh-ui`'s `parse-blocks.ts` vocabulary is narrower than what a flagship generative-UI surface needs**, while the framework's own doctrine (F-5) claims apps "never hand-roll block parsing" — eis-chat independently invented a ~30-node-type vocabulary in production. Either broaden the vocabulary or soften the doctrine claim.

24. **`DataGrid`/`Icon` are promoted to stable root exports but the reference production consumer still maintains parallel hand-rolled versions of both** — a short migration note would likely get picked up immediately.