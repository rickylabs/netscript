# NetScript CLI Features Coverage Matrix

Epic #701 consolidation. Source: 13 structured deep dives (12 resource domains + one docs-manual-steps mining pass), Opus-medium workflow, 2026-07-12. Every non-`exists` cell carries one evidence anchor from the dives; two load-bearing claims (streams stubs, contract v1 hard lock) were spot-verified against a main checkout.

Legend: **E** exists · **P** partial (verb exists but hollow, filtered-down, or side-effect-incomplete) · **M** missing · **S** stub (command registered, returns not-implemented) · `—` not applicable to the resource.

## Matrix: resource type × lifecycle verbs

| Resource | add | update | version | inspect | list | remove | run |
|---|---|---|---|---|---|---|---|
| **Services** | E | M¹ | — | P² | E | M³ | — |
| **Contracts** | E (v1 only)⁴ | M⁵ | M⁴ | P⁶ | E | M⁷ | — |
| **DB datasources** | E | P⁸ | E (init/migrate) | P⁹ | M¹⁰ | M¹¹ | E (seed/generate/reset) |
| **Workers: jobs** | E | P¹² | P¹³ | M¹⁴ | P¹⁵ | M¹⁶ | P¹⁷ |
| **Workers: tasks (polyglot)** | P¹⁸ | M¹² | P¹³ | M¹⁴ | P¹⁵ | M¹⁶ | M¹⁹ |
| **Workers: executions** | — | — | — | P²⁰ | M²⁰ | — | M²⁰ |
| **Sagas: definitions** | E | M²¹ | M²² | P²³ | P²³ | M²⁴ | — |
| **Sagas: instances/messages** | — | — | — | M²⁵ | M²⁵ | — | M²⁶ |
| **Triggers: definitions** | P²⁷ | P²⁸ | — | P²⁹ | E | M³⁰ | P³¹ |
| **Triggers: events (ledger)** | — | — | — | M³² | M³² | — | — |
| **Streams: schemas/producers/consumers** | M³³ | M³³ | — | M³⁴ | — | — | — |
| **Streams: topics (runtime)** | — | — | — | S³⁵ | S³⁵ | S³⁵ | S³⁵ |
| **Auth: backend/providers/secrets** | P³⁶ | M³⁷ | — | P³⁸ | — | — | — |
| **Auth: sessions** | — | — | — | M³⁹ | M³⁹ | M³⁹ | — |
| **AI: tools/agents** | P⁴⁰ | M⁴⁰ | — | M⁴¹ | M⁴¹ | M⁴¹ | — |
| **AI: models/providers** | M⁴² | M⁴² | — | M⁴² | M⁴² | M⁴² | — |
| **AI: MCP servers / skills** | M⁴³ | — | — | M⁴³ | M⁴³ | M⁴³ | — |
| **UI: registry components** | E | M⁴⁴ | — | M⁴⁵ | M⁴⁵ | M⁴⁴ | — |
| **UI: routes/pages/islands** | M⁴⁶ | M⁴⁶ | — | — | — | M⁴⁶ | — |
| **UI: theme tokens** | E (init-time) | M⁴⁷ | — | — | — | — | — |
| **Plugins (host lifecycle)** | E install / P new⁴⁸ | P⁴⁹ | P⁴⁹ | E (doctor/info) | E | E (manifest-only) | P⁵⁰ |
| **Plugin custom items** | M⁵¹ | — | — | — | — | — | — |
| **Runtime-config overrides** | M⁵² | M⁵² | M⁵² | M⁵² | M⁵² | — | P⁵³ |
| **Project config (netscript.config.ts)** | — | M⁵⁴ | — | M⁵⁴ | M⁵⁴ | — | — |
| **Aspire graph / appsettings** | P⁵⁵ | M⁵⁵ | — | — | — | M⁵⁵ | P⁵⁶ |
| **Deploy targets** | — | — | — | M⁵⁷ | M⁵⁷ | — | E (rich verb set) |
| **Marketplace** | S⁵⁸ | — | — | — | S⁵⁸ | — | — |

### Evidence anchors

1. `--refs` honored only at `service add` (packages/cli/src/public/features/services/add/add-service-command.ts:33,46); refs/port/enabled changes are hand-edits of aspire/appsettings.json (docs/site/how-to/discover-services.md Step 1).
2. `service list` prints Name/Port/Enabled/Workdir/References only (list-services-command.ts:17-48); no per-service detail/JSON.
3. services-group.ts:12-36 wires add/list/generate only; decommission is hand-delete + hand-edit + regen.
4. `ContractVersion = 'v1'` (packages/cli/src/kernel/adapters/contracts/types.ts:11,14); add-contract-command.ts:80-84 and list-contracts-command.ts:37-42 throw for non-v1; version-registry.ts:20-24 throws "Unsupported contract version" — while docs/site/explanation/contracts.md:205-207 makes `versions/v2/` the REQUIRED breaking-change mechanism. Spot-verified.
5. No procedure-append verb; contract.ts.template says "Extend this with your own procedures"; docs/site/how-to/add-a-service.md:97-126 hand-authors procedures.
6. `contract list` prints only `name  service paired|contract only` (list-contracts-command.ts:48-55); no routes/methods/schemas.
7. contracts-group.ts:18-19 wires only add + list; ContractVersionRegistry.regenerate (version-registry.ts:44-56) exists but is unreachable for removal.
8. `db migrate` is dev-style create+apply only; `db:migrate:deploy`/`db:push` tasks exist in the generated workspace (generate-db-deno-json.ts:55-57) but the DbOperation union (kernel/domain/db-engine.ts:112-121) excludes them.
9. `db status`/`introspect` exist but `db:validate`/`db:format`/`migrate resolve` are unreachable (generate-db-deno-json.ts:74-79 vs db-group.ts).
10. db-group.ts has no `list`; DbWorkspaceResolver.discoverDatabases() already returns the data but never surfaces it.
11. No `db remove`; use-a-second-database.md documents the hand-edit footgun ("If you skipped db add and only edited appsettings").
12. Only Add*/List*/Run/Logs/Config*/Enable/Disable/CompileRegistry command classes exist (plugins/workers/src/cli/commands.ts); enable/disable is the sole mutable attribute.
13. `compile-registry` exists but add-job does NOT chain regeneration — docs/site/tutorials/workspace/04-provision-job.md:160-166 requires a separate manual registry step.
14. `logs <execution-id>` needs an id no CLI verb can enumerate; list-* return file paths only, no `show <id>` metadata.
15. listFiles returns relative paths; declared filters `--topic/--enabled-only/--type` are ignored by the backend.
16. No remove-job/remove-task in WORKERS_CLI_COMMANDS (command-types.ts:6).
17. `run` dynamic-imports the job module in-process, bypassing the durable queue/scheduler (local-runtime-backend.ts runJob()).
18. add-task advertises `--entrypoint` but parseTaskInput never reads it (dead flag); python/shell stubs read stdin while the runtime contract is argv+env (docs/site/how-to/run-a-polyglot-task.md steps 1-2).
19. No run-task verb; docs hand-write a runner module over createDefaultTaskExecutor (run-a-polyglot-task.md step 3).
20. Executions are HTTP-only: docs/site/tutorials/workspace/04-provision-job.md:183-197 instructs raw curl of :8091 jobs/trigger/executions endpoints.
21. add-saga is create-only; defineSagaConfig builder methods (.description/.topic/.tags, define-saga-config.ts:42-50) reachable only by hand-editing the generated .config.ts.
22. No saga-definition version concept: no .version() builder, no version verb, registry keyed by bare id; the existing `version` field is per-instance optimistic concurrency (sagas.contract.ts:132), not definition identity.
23. `ns-sagas inspect`/registry are STATIC source scans (saga-inspector.ts:34); no runtime state/status/version.
24. SAGAS_CLI_COMMANDS (command-types.ts:5) has no remove; add-saga has no inverse.
25. Runtime contract exposes list-sagas/list-instances/SSE (sagas.contract.ts:182,189,168) on :8092 with no CLI wrapper.
26. PublishMessageInput fully specified (sagas.contract.ts:138) but local-runtime-backend.ts:47 handles only generate-registry/inspect/codemod/add-saga — publish requires hand-written TS or curl.
27. `add webhook --job=x` silently emits an accept-and-drop stub — parseWebhookInput never reads `job`, stubs have no JOB token (plugins/triggers/src/adapter/resources/input.ts; webhook.stub.ts) though commands.ts:78 advertises the flag.
28. enable/disable writes .netscript/runtime/triggers.json which NO runtime code reads (the DB `enabled` column the processor uses is untouched) — hollow toggle; no field-mutation verb (no update case in local-runtime-backend.ts handleChecked).
29. `preview` cron parser reads only minute+hour fields, ignoring dom/month/dow (triggers-cli-backend-support.ts previewCron) — wrong fire times for `0 2 * * 1`.
30. No remove case in handleChecked; delete = hand-delete + manual registry recompile.
31. test/fire share one synthetic in-process path — no HMAC, no persistence, no :8093 dispatch.
32. TriggerEvent model + GET /api/v1/events exist (plugins/triggers/database/triggers.prisma; capabilities/triggers.md) but the only documented inspection is raw curl; CLI has nothing.
33. No streams scaffolder at all — the biggest asymmetry vs workers/triggers: docs hand-author schema (publish-a-durable-stream.md:26-44), producer (capabilities/streams.md:113; defineStreamProducer is itself a throwing stub, stream-api.ts:45-52), and consumer/StreamDB/island (tutorials/live-dashboard/05-live-stream.md:61-178).
34. inspectStreamTopic() ships in core (capabilities/streams.md:262) but no verb or doctor calls it.
35. All five streams commands are stubs: list-topics returns empty "not implemented yet", subscribe/publish/stats/clear return code 1 (plugins/streams/src/cli/streams-cli.ts:59-70) — yet docs/site/reference/streams/index.md:82-90 documents them as shipped. Spot-verified.
36. `plugin install auth` emits only the typed re-export barrel — no backend config, provider, or secrets (plugins/auth/src/adapter/plugin.ts).
37. Backend selection is called "a CLI-owned config seam" by the barrel's own doc (barrel.stub.ts) yet no command owns it; docs hand-export NETSCRIPT_AUTH_BACKEND + ~10 provider env vars (how-to/add-authentication.md Steps 2/4); no secret generator despite boot-failure on a wrong hand-encoded key (backend-registry.ts resolveKvOAuthKey).
38. doctor only checks env presence of NETSCRIPT_AUTH_BACKEND (packages/plugin/src/adapter/commands/doctor.ts:35) — cannot set it, cannot report active backend.
39. Session revoke exists only as POST /api/v1/auth/signout; capabilities/auth.md:264 "no audit surface"; grep of packages/cli for session list/revoke = nothing.
40. `plugin ai add tool|agent` writes the file but nothing wires it: barrel hard-codes `createToolRegistry([echoTool])` (barrel.stub.ts:26,36) and the generated registry has zero consumers repo-wide — output is inert until hand-wired.
41. plugin-cli-runner.ts routes only add/generate — no list/inspect/remove of the project's actual AI resources.
42. ai/models.ts is a fixed hand-edit stub (models not in plugin.resources); 5 runtime providers with no CLI to select among them (packages/ai/deno.json exports).
43. Full MCP runtime ships (packages/ai/src/mcp/*) with NO scaffolder/verb in plugins/ai; skills reachable only by hand-implementing the skill-loader port.
44. installUiRegistryItems only copies or `--force` clobbers; no diff/sync, no removal, no deno.json import pruning (packages/cli/src/kernel/application/ui/registry.ts) — the classic shadcn update problem.
45. No ui:list; the ~60-item machine-readable manifest (packages/fresh-ui/registry.manifest.ts) is unexposed; docs keep a hand-maintained prose table (customize-fresh-ui.md:258).
46. No route/page/island generator anywhere: docs hand-author full definePage routes (customize-fresh-ui.md:137), islands (:162), and the definePage/QueryIsland/loaders trio (tutorials/live-dashboard/04-definePage-QueryIsland.md:66-199); public-command-tree.ts registers only ui:add/ui:init.
47. tokens.css/tokens.json + per-component CSS are hand-edited (customize-fresh-ui.md:198-214).
48. `plugin new` writes files only — Step 5 of author-a-plugin.md hand-edits netscript.config.ts plugins[]; `plugin install` auto-registers via workspaceMutator (install-plugin.ts:76). Asymmetric.
49. `plugin update` is a pass-through of the update verb with a JSR specifier ("not an installed plugin name", add-a-plugin.md:237); no re-pin/re-resolve/re-scaffold of an installed plugin.
50. enable/disable/setup dispatch generically but e.g. auth declares no such spec — inert for some plugins (dispatch-plugin-verb.ts; plugins/auth adapter/plugin.ts).
51. Generated custom plugins ship an ItemScaffolder but no host verb surfaces it — only official workers exposes add-* (author-a-plugin.md Step 4 hand-writes contributions).
52. Operators hand-author versioned JSON under runtime/{features,jobs,sagas,triggers,tasks}/vX.json + a hand-edited `current` pointer (capabilities/runtime-config.md; how-to/roll-out-runtime-overrides.md:22,80 uses `cat >`/`printf >`); runtime-config-writer.ts:22-24 seeds once then leaves all mutation manual; zero command-side writers found.
53. workers config-edit/config-publish exists but is workers-scoped, writing .netscript/runtime/<topic>.json only (local-runtime-backend.ts:143-160).
54. inspectConfig() is documented as "a JSON-stable diagnostic report for CLI rendering" (capabilities/runtime-config.md) with ZERO CLI wiring; no `config` command in public-command-tree.ts.
55. deploy-local-aspire.md:60-67 callout literally titled "There is no netscript generate aspire": edits to the resource graph, otel/dashboard ports are hand-edits of appsettings.json; GenerateAspireUseCase exists but is not a generate subcommand (generate-group.ts).
56. `service generate` regenerates helper files only — not AppHost/appsettings.
57. deploy-group.ts hardcodes target keys with no `deploy list`/targets enumeration; `secrets` is a single reconcile verb, no get/set/list.
58. marketplace publish/search print static guidance (marketplace-publish-command.ts).

## Adoption gap: docs teach manual work despite existing verbs

A distinct pattern from the docs-mining dive — the verb EXISTS but every tutorial hand-authors the file instead, so users (and future dashboard write-actions modeled on the docs) never learn the CLI path:

| Existing verb | Docs that hand-author instead | Extra defect |
|---|---|---|
| `ns-workers add-job` / `add-task` | tutorials/workspace/04-provision-job.md:105 "Add a new file in plugins/workers/jobs/"; tutorials/erp-sync/02-import-job.md:66; how-to/tune-worker-runtime.md:164 — **0 doc references to add-job/add-task** | stub lacks the payload-Zod/handler shape the tutorials teach |
| `ns-triggers add-webhook` / `add-file-watch` / `add-scheduled` | tutorials/erp-sync/02-import-job.md:131; tutorials/storefront/05-shipping-webhook.md:74 — **zero tutorial references to any add-\* verb** | scaffold emits a non-functional accept-and-drop stub (anchor 27), so docs are arguably right to avoid it today |
| `ns-sagas add-saga` | tutorials/storefront/04-checkout-saga.md hand-authors the whole saga | add-saga emits config + starter only; no handler/compensation stub |
| `netscript plugin install` (auth) | plugins/auth/README.md says "plugin add auth" vs how-to says "plugin install" | naming drift only |

Counter-example done right: `netscript db add` — how-to/use-a-second-database.md:122 explicitly tells readers NOT to hand-edit appsettings ("let the CLI own it"). This is the model the other domains should follow.

## Top priorities

1. **Streams is declared-but-dead end to end** — all five runtime commands are stubs documented as shipped, AND there is no scaffolder for schemas/producers/consumers (worst asymmetry vs workers/triggers, which both have add-* verbs). Every dashboard streams panel action lands on nothing. (p1, anchors 33-35)
2. **No runtime-backed execution surface for workers and sagas** — executions list/trigger, saga instance list/inspect, and saga message publish are all fully specified runtime HTTP contracts (:8091/:8092) that the CLI never wraps; docs teach raw curl. The cross-cutting Run Inspector panel has no command seam. (p1, anchors 20, 25-26)
3. **Contract evolution is hard-locked to v1** while the docs make `versions/v2/` the required breaking-change mechanism — versioning, remove, add-route, and real inspect are all missing (extends already-filed #702). (p1, anchor 4-7)
4. **Trigger CLI is functionally hollow at three points** — the scaffold's `--job` flag silently emits a drop-everything stub, enable/disable writes a file nothing reads, and there is no event-ledger inspection despite a persisted trigger_events store. (p1, anchors 27-28, 32)
5. **Runtime-config override lifecycle is `cat > vX.json` + `printf > current`** — publish/rollback/pointer management has zero CLI, and the documented inspectConfig() report has zero wiring; project config is equally unreadable. (p1, anchors 52-54)
6. **No route/page/island generators** — the web layer's create path is entirely hand-authored, so scaffold-from-UI has no CLI substrate for the layer users see first. (p1, anchor 46)
7. **Config seams the docs call CLI-owned are hand-exported env** — auth backend/provider/secrets (~10 export lines, boot-failure on a bad hand-encoded key) and AI models/providers/MCP (add tool/agent emits inert files; MCP runtime has no verb). (p1, anchors 36-43)
8. **The add-without-inverse pattern is systemic** — update and remove are missing for jobs, tasks, sagas, triggers, services, contracts, datasources, UI items, and AI resources; nearly every create verb has no mutation or teardown counterpart. (p1/p2 per surface)
9. **Docs-adoption gap** — workers and triggers ship real add-* verbs that zero tutorials use; fixing the stubs and rewriting the tutorials converts existing code into perceived coverage cheaply. (p2, adoption table above)
10. **Machine-readable list/inspect (`--json`) is missing almost everywhere** the dashboard needs a read seam — db list, ui:list, contract inspect, worker show-job, deploy targets — mostly thin wrappers over data resolvers that already exist. (p2)
