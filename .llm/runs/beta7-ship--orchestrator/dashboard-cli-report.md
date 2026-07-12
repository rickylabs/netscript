# CLI Coverage ⇄ Dashboard Design Correlation Report

**To:** the dashboard-design orchestrator (run `.llm/runs/dashboard-design--orchestrator/`, merged to main via PR #685)
**From:** the CLI-features-coverage consolidation (epic #701)
**Date:** 2026-07-12
**Companion artifacts:** `cli-coverage-matrix.md` (full resource × verb matrix, 58 evidence anchors), `cli-coverage-issues.json` (10 child-issue drafts for #701, each with a `### Dashboard capability unlock` subsection citing your artifacts).

Your design's central trust device — "confirm-with-CLI-equivalent on every mutation" (`screen-catalog.md`, cross-cutting patterns) — is only as honest as the CLI beneath it. This report maps every write-action and read seam your merged artifacts specify to its CLI dependency and the #701 child issue that delivers it, and lists the assumptions currently unbacked by any verb (fold these into your design prompts / issue augmentations).

Issue numbers are `#703`…`#7030` placeholders in filing order of `cli-coverage-issues.json`; fill real numbers when #701's children are filed.

## (a) CLI coverage top priorities (summary)

1. **Streams is declared-but-dead end to end** — all five runtime commands are stubs documented as shipped; no scaffolder exists for schemas/producers/consumers. (p1)
2. **No runtime-backed execution surface for workers and sagas** — executions list/trigger, saga instance list/inspect, and message publish are fully-specified HTTP contracts (:8091/:8092) the CLI never wraps; docs teach raw curl. (p1)
3. **Contract evolution is hard-locked to v1** while docs make `versions/v2/` the required breaking-change mechanism — versioning/remove/add-route/inspect all missing (extends #702). (p1)
4. **Trigger CLI is functionally hollow at three points** — `--job` scaffold emits a drop-everything stub, enable/disable writes a file nothing reads, no event-ledger inspection. (p1)
5. **Runtime-config override lifecycle is `cat > vX.json` + `printf > current`** — publish/rollback/pointer have zero CLI; `inspectConfig()` has zero wiring. (p1)
6. **No route/page/island generators** — scaffold-from-UI has no CLI substrate for the web layer. (p1)
7. **Config seams docs call CLI-owned are hand-exported env** — auth backend/provider/secrets; AI models/providers/MCP (add tool/agent output is inert). (p1)
8. **Add-without-inverse is systemic** — update/remove missing for jobs, tasks, sagas, triggers, services, contracts, datasources, UI items, AI resources. (p1/p2)
9. **Docs-adoption gap** — workers/triggers ship real add-* verbs that zero tutorials use. (p2)
10. **Machine-readable list/inspect (`--json`) missing almost everywhere** the dashboard needs a read seam. (p2)

## (b) Mapping: dashboard design surface → CLI dependency → status → delivering issue

Surfaces cite your merged artifacts (`design-prompts/03..06`, `screen-catalog.md`, `coverage-matrix.md`). Status is from the CLI coverage matrix (exists / partial / missing / stub).

| # | Dashboard design surface (artifact) | CLI verb it depends on | Status | Issue |
|---|---|---|---|---|
| 1 | Streams console delivery/fan-out/topic feeds — `/streams` tree (03, Streams; S10) | `streams list-topics / subscribe / stats` | stub | #703 |
| 2 | "Redeliver to failed subscriber" / "Pause subscriber" / clear writes (03, Streams) | streams runtime write verbs | stub/missing | #703 |
| 3 | Streams teaching empty state — "show the scaffold command" (03, States) | `streams add-schema / add-producer / add-consumer` | missing | #703 |
| 4 | `/streams/:streamId` health + wiring tabs (03) | `streams inspect` (inspectStreamTopic bridge) | missing | #703 |
| 5 | Workers "Run now" confirm printing `netscript workers run reserve-inventory` (03, Workers) | queue-backed trigger (not in-process import) | partial | #704 |
| 6 | Recent-executions tables + `/executions/:executionId` leaves (03; coverage-matrix #428) | `workers executions` list | missing | #704 |
| 7 | Polyglot Tasks showpiece (Deno/Python/Shell/PowerShell rows, `?runtime=`) (03) | `workers run-task` via MultiRuntimeTaskExecutor + `show-task` metadata | missing | #704 |
| 8 | "Pause schedule" / "Edit retry policy" / "Re-run from step" writes (03) | `workers update-job` / rerun seam | missing | #704 |
| 9 | Saga instance tables + `/sagas/:sagaName/:correlationId` leaves (03, Sagas; coverage-matrix #429) | `sagas list --instances` (runtime) | missing | #704 |
| 10 | "Retry failed step" / "Force-complete compensation" / publish-message actions (03) | `sagas publish` + instance ops | missing | #704 |
| 11 | Trigger per-row enable/disable switch, confirm+CLI `netscript triggers disable payment-webhook` (03, Triggers) | authoritative enable/disable | partial (hollow — writes a file nothing reads) | #705 |
| 12 | Headline future-fire preview "Next: 02:00 · 03:00 · 04:00 (Europe/Zurich)" (03) | correct 5-field cron preview | partial (2-field parser gives wrong times) | #705 |
| 13 | Events tab + `/triggers/:triggerId/events/:eventId` leaf (03; coverage-matrix #430) | `triggers events` (trigger_events ledger) | missing | #705 |
| 14 | Trigger-builder save (typed form, confirm+CLI) (03) | `triggers update` | missing | #705 |
| 15 | AI-drafted automations landing as reviewable trigger drafts (05, form 3) | dynamic (api-source) trigger registration | missing | #705 |
| 16 | Webhook test-delivery form (ingress simulation) (03) | runtime-backed fire (HMAC, persisted) | partial (synthetic in-process only) | #705 |
| 17 | Catalog "Bind route…" scaffold write on unbound rows (04, Catalog) | `contract add-route` + `service add-handler` | missing | #706 |
| 18 | `/catalog/procedures/:procedureId` detail (schema/duality/coverage/provenance) (04; coverage-matrix #417) | `contract inspect --json` introspection | missing | #706 |
| 19 | Extension quarantine story "held: built for contract v1, host at v2" (06, Panels tab) | `contract version add` (v2) | missing (hard-locked `ContractVersion = 'v1'`) | #706 |
| 20 | Catalog retire/decommission actions | `contract remove` / `service remove` | missing | #706 |
| 21 | Scaffold-from-UI keystone loop "one generator, two callers"; "New X from template" everywhere (coverage-matrix #432; 06 create-from-template) | `ui:add page / island` generators (web layer) | missing | #707 |
| 22 | Template/component gallery + registry browser | `ui:list --json` | missing | #707 |
| 23 | Component update/remove actions (non-destructive) | `ui:update` / `ui:remove` | missing | #707 |
| 24 | S3 flagship write-back confirm printing `netscript config override set flags.checkout-v2 --rollout 30` (04, Runtime Config; S3) | runtime override set/publish CLI | **missing — the prototype prints a command that does not exist** | #708 |
| 25 | "Rollback to version…" / "Restore this version" / "Clear override" writes (04) | `config runtime rollback` etc. | missing | #708 |
| 26 | Config topology provenance ("why a value won"), "Re-resolve", `/config/nodes/:nodeId` (04; coverage-matrix #416) | `config inspect / get` (inspectConfig wiring) | missing | #708 |
| 27 | Stack-Map/resource mutation, otel endpoint read, deployments target catalog | `generate aspire`, `service ref/set`, `config get telemetry.*`, `deploy list` | missing | #708 |
| 28 | Auth Sessions writes "Revoke session" / "Revoke all for user" (04, Auth Sessions; authc screen) | `plugin auth session list / revoke` | missing | #709 |
| 29 | Auth configure tabs (backend selector, provider form, generate-secret) + doctor remediation | `plugin auth backend set / provider set / secret generate` | missing | #709 |
| 30 | AI console Tools tab — "every contract procedure exposed as an agent tool, grouped by plugin" (05, form 4) | `plugin ai list tools/agents/models --json` | missing | #710 |
| 31 | "Add tool/agent" actions producing runnable resources (05) | self-wiring `add tool/agent` | partial (output inert until hand-wired) | #710 |
| 32 | MCP-backed tool sources / models-providers panel (05) | `plugin ai mcp add/list`, `model/provider` verbs | missing | #710 |
| 33 | `/plugins` Available-tab Install write printing `netscript plugin add crons` (06) | `plugin install` | exists — **verb-name drift** (`add` vs `install`) | #711 + #7030 |
| 34 | Plugin update write "confirm with changelog diff" (06) | `plugin update <installed-name>` re-pin semantics | partial (pass-through, no re-pin) | #711 |
| 35 | Doctor tab "per-check remediation writes" (06) | remediation verbs (backend set, bind route, …) | missing (spread across issues) | #709 / #711 / #706 |
| 36 | Create-from-template printing `netscript plugin create --template capability my-plugin` (06) | `plugin new` (+ `--register`) | partial — **verb-name drift** (`create` vs `new`), no registration | #711 + #7030 |
| 37 | `/extensions` manager + 7-member `DashboardContribution` family (06; coverage-matrix #427/#420) | dashboard-panel contribution axis (framework precondition) | missing | #711 (item 4; may split to framework issue) |
| 38 | Migrations "Apply migrations" write printing `netscript db migrate` (04, Migrations) | `db migrate` / prod apply-pending / drift resolve | exists / missing / missing | — / #711 |
| 39 | Home pending-migration stat card + datasource-scoped panels (S1; 04) | `db list --json` | missing | #711 |
| 40 | DLQ "Reprocess selected" printing `netscript queue dlq reprocess --backend redis` (04, DLQ) | DLQ CLI + contract API | missing — **owned by your already-filed co-req #555, NOT epic #701** | #555 |

40 rows; 37 depend on #701 children, 1 on your co-req #555, 2 are exists-with-naming-drift.

## (c) Dashboard-side assumptions currently unbacked by any CLI verb

Corrections to fold into your design prompts / issue augmentations:

1. **The S3 confirm dialog prints a fictional command.** `netscript config override set …` (04-control-plane.md, prototype S3) has zero command-side writers in the repo. Either keep the syntax and make #708 implement exactly it, or update the prompt — but decide the canonical verb NOW so prompt, CLI, and confirm dialogs converge. (#708 currently proposes `config runtime set`; we flagged the naming-alignment need in its body.)
2. **Verb-name drift is inside your merged prompts.** `netscript plugin add crons` (shipped: `plugin install`) and `netscript plugin create --template …` (shipped: `plugin new`) in 06-extension-platform.md. Same drift exists in the auth plugin README. Canonicalize before design screens bake the wrong strings.
3. **Streams console has no CLI at all beneath it.** All five runtime verbs are stubs; there is no scaffold verb for the mandated teaching empty state ("show the scaffold command"). Until #703, any Streams write or empty-state CLI line is invented.
4. **The polyglot Tasks showpiece has no run path.** No `run-task` verb exists; python/shell/powershell tasks are unreachable from the CLI (and the `--entrypoint` flag is dead). The `?runtime=` filter also has no metadata source (list verbs return file paths only).
5. **"Run now" semantics differ from what the design implies.** Today's `workers run` is an in-process import bypassing the durable queue — a dashboard "Run now" backed by it would not appear in the executions feed. #704 adds a queue-backed `trigger`.
6. **The trigger enable/disable switch would lie.** The current verb writes a local file no runtime reads; the DB `enabled` column is untouched. The designed operable switch requires #705's authoritative toggle.
7. **The future-fire preview would show wrong times.** The current cron previewer parses only minute+hour; your headline "nobody else computes forward schedules" feature needs the real evaluator.
8. **Trigger events tab / event leaf have no data verb.** trigger_events is curl-only today; CLI `test`/`fire` events are synthetic and never persisted.
9. **AI-drafted automations have nowhere to land.** Dynamic (api-source) trigger registration has no CLI/write path — the reviewable-draft loop in 05-ai-surface.md form 3 ends at a wall.
10. **The v1→v2 quarantine story is undemonstrable.** `ContractVersion` is hard-locked to `'v1'` and every code path throws on anything else — no project can ever contain the "built for contract v1, host at v2" state until #706.
11. **Procedure-detail introspection has no source.** No verb emits per-contract routes/methods/schemas; `/catalog/procedures/:procedureId` and the coverage explanations need `contract inspect --json`.
12. **The AI Tools tab has no enumerable source.** No `list tools/agents/models` verb; also "add tool/agent" currently produces files that are inert until hand-wired into the composition root — a dashboard add-action would create dead resources.
13. **Auth Sessions writes have no commands.** No session list or revoke verb exists (docs: "no audit surface"); the two authc writes cannot print a real CLI line. (Your coverage matrix already flags authc as ownerless on the dashboard side; the CLI side is #709.)
14. **"Update plugin with changelog diff" needs semantics that don't exist.** `plugin update` is a pass-through taking a JSR specifier, not an installed-name re-pin — no installed-vs-latest fact to diff.
15. **Teaching empty states, generally.** 03-capability-consoles.md mandates every console's empty state show the create command — verify per console which command actually exists (streams: none; workers/triggers: exist but docs never use them; sagas: config-only stub). The docs-adoption issue (#7030) is the cheap half of this fix.
16. **DLQ reprocess is outside #701.** `netscript queue dlq reprocess` is your co-req #555's scope; no #701 child duplicates it — keep it sequenced with #553/#554/#555.

## (d) Epic pointer and issue placeholders

Epic: **#701** (CLI features coverage — framework completeness for the road to stable; the CLI is the foundation the Dev Dashboard's write-actions build on). Contract-add scope is already filed as **#702** (referenced, not duplicated, by #706).

| Placeholder | Draft title (short) | unblocks-dashboard |
|---|---|---|
| #703 | Streams end-to-end CLI (stubbed runtime verbs + scaffolders) | true |
| #704 | Durable-execution parity: workers & sagas | true |
| #705 | Triggers CLI completion | true |
| #706 | Contract & service lifecycle extensions (extends #702) | true |
| #707 | Fresh web-layer scaffolding & UI registry management | true |
| #708 | Runtime & project configuration operations | true |
| #709 | Auth configuration & session CLI | true |
| #710 | AI stack configuration CLI | true |
| #711 | Host lifecycle symmetry: plugin & db groups | true |
| #7030 | Docs adopt the existing scaffold verbs | false (protects, not unblocks) |

Full bodies (context, evidence anchors, scope, dashboard-unlock, acceptance) in `cli-coverage-issues.json`. When filing, replace `#TBD-n` here and cross-link each child from your issue augmentations (#416/#417/#428/#429/#430/#431/#551 etc. per the mapping table).
