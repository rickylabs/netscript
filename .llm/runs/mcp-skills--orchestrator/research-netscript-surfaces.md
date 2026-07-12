# NetScript surfaces inventory — first-party MCP server + public skills

Research sub-agent (Opus 4.8). Scope: what the planned `netscript` MCP server (monitoring, debugging,
doctor, docs search/get, CLI-verb triggering, NetScript-aware trace intelligence) will build on. All
paths relative to repo root `/home/codex/repos/netscript-547-lffix/.claude/worktrees/mcp-skills-orchestrator`.
**Governing constraint: MCP wraps the CLI + typed read ports; it never reimplements CLI logic.**

---

## 1. packages/telemetry — TelemetryQueryPort read surface + `netscript.*` conventions

### 1.1 The typed read port (this is the MCP monitoring/trace-intelligence backbone)

`packages/telemetry/query.ts` re-exports the whole read surface. The port interface lives in
`packages/telemetry/src/ports/telemetry-query-port.ts:16`:

```ts
interface TelemetryQueryPort {
  queryTraces(filter?: TraceQueryFilter): Promise<readonly TelemetryTrace[]>;
  getTrace(traceId: string): Promise<TelemetryTrace | undefined>;
  querySpans(filter?: TraceQueryFilter): Promise<readonly TelemetrySpan[]>;
  queryLogs(filter?: TraceQueryFilter): Promise<readonly TelemetryLog[]>;
  queryMetrics(filter?: MetricQueryFilter): Promise<readonly TelemetryMetric[]>;
  queryResources(filter?: ResourceQueryFilter): Promise<readonly TelemetryResource[]>;
  exportTraces(filter?: TraceQueryFilter): Promise<TelemetryOtlpJson>;
}
```

Read models (`packages/telemetry/src/domain/query.ts`):
- `TelemetryTrace { traceId, spans[] }`; `TelemetrySpan { traceId, spanId, parentSpanId?, name, kind,
  startTimeUnixMs, endTimeUnixMs?, statusCode (0 unset/1 ok/2 error), statusMessage?, attributes:
  Record<string, string|number|boolean>, events[], links[] }`.
- `TelemetryLog { timeUnixMs, severity, body, traceId?, spanId?, attributes }`.
- `TelemetryMetric { name, type: 'counter'|'histogram'|'gauge', unit?, description?, resource?, points[] }`;
  `TelemetryMetricPoint { timeUnixMs, value, attributes }`.
- `TelemetryResource { serviceName, serviceInstanceId?, attributes }`.
- `TelemetryOtlpJson { resourceSpans[] }` — portable export.
- `TelemetrySpanKind = internal|server|client|producer|consumer`. `TelemetryAttributeValue = string|number|boolean`.

Filters are narrow (`packages/telemetry/src/domain/query.ts`):
- `TraceQueryFilter { resource?/serviceName?, sinceUnixMs?, limit?, follow? }` (also used for spans + logs).
- `MetricQueryFilter { resource?/serviceName?, metricName?, sinceUnixMs?, limit?, follow? }`.
- `ResourceQueryFilter { resource?/serviceName? }`.
- Standard-Schema validators + schemas exported: `validateTraceQueryFilter`, `traceQueryFilterSchema`,
  etc., and `TelemetryQueryValidationError` (`packages/telemetry/src/application/query/mod.ts`).

### 1.2 Where the data lives at runtime — Aspire dashboard, NOT Deno KV

The only shipped adapter is `AspireTelemetryQuery` (`packages/telemetry/src/adapters/aspire-query/
aspire-telemetry-query.ts:51`). It wraps the **Aspire dashboard HTTP telemetry read endpoints**
(`GET {endpoint}/api/telemetry/{traces|spans|logs|metrics|resources}`, line ~143), default endpoint
`http://localhost:18888` (line 39), supports an API key, `fetch` override, `AbortSignal`, and live
NDJSON `follow`. `createTelemetryQuery(options)` / `createAspireTelemetryQuery(options)` are the
factories (`query.ts`). **Implication:** MCP trace intelligence reads from the Aspire dashboard the
scaffolded app already runs — it does not open its own KV store. The `--no-aspire` path keeps the read
side wired without a local dashboard (comment at adapter line 49). The MCP layer must discover the
dashboard endpoint (ephemeral port from the AppHost launcher) the same way dashboards do.

### 1.3 `netscript.*` semantic attribute conventions

Central module: `packages/telemetry/attributes.ts` → `packages/telemetry/src/attributes/mod.ts`, split
by domain: `execution.ts, genai.ts, helpers.ts, job.ts, kv.ts, messaging.ts, saga.ts, scheduler.ts,
spans.ts, sse.ts, trigger.ts, worker.ts`. This is the typed constant source the MCP should import rather
than string-match. Enumerated namespaces (grep of `packages/` + `plugins/`):

- **Correlation/exec:** `netscript.correlation.id`, `netscript.idempotency.key`,
  `netscript.execution.{id,started_at,completed_at,duration_ms}`, `netscript.outcome`,
  `netscript.retry.max_attempts`, `netscript.durability`, `netscript.operation`, `netscript.concurrency.key`.
- **Jobs:** `netscript.job.{id,name,status,attempt,max_retries,duration_ms,exit_code,entrypoint,
  priority,source,step,tags,target.id,timeout_ms,timezone,trigger}`.
- **Workers:** `netscript.worker.{id,concurrency,active_jobs,queue,jobs.processed,jobs.failed,job.duration}`.
- **Sagas:** `netscript.saga.{id,status,attempt,instance.id,child.id,child.instance.id,correlation_key,
  durability_tier,delay_ms,scheduled_for,event.type,handle.duration_ms,replay.duration_ms,
  compensation.reason,compensation.cascade_size,compensations.total,dlq.total,idempotency_hits.total,
  concurrency_throttled.total,instances.active}`.
- **Triggers:** `netscript.trigger.{id,name,type,kind,topic,status,attempt,durability_tier,
  idempotency_key,idempotency_source,error_class,event.{id,kind,status},action.{type,kind,target,status,
  count,duration_ms},file.{name,path,extension,hash,size},lifecycle.{stage,staged_path,archive_path},dlq.reason}`.
- **Streams/SSE:** `netscript.stream.{collection,path,outcome,producer.id}`,
  `netscript.sse.{client_id,event_type,event.{data_size,related_trace},events_sent,duration_ms,
  subscription.channel,watch_keys,metrics.{active_connections,total_events_sent,avg_events_per_connection}}`.
- **Scheduler:** `netscript.scheduler.{id,cron,enabled,tick_time,last_run,next_run,job_count,
  new_job_count,previous_job_count,due_jobs,due_job_ids}`.
- **Messaging:** `netscript.messaging.{destination.kind,destination.dlq,message.{priority,delay_ms,
  delivery_count},requeue}`.
- **KV:** `netscript.kv.{operation,key,key_count,atomic,value_size_bytes}`.
- **AI/GenAI:** `netscript.ai.{step,max_steps,tool_calls,tool_count,usage.total_tokens}`.
- **RPC/HTTP:** `netscript.rpc.{procedure,transport}`, `netscript.http.{method,service,status_code}`.

### 1.4 What the "smart" MCP queries need (gap analysis)

The port gives raw traces/spans/logs/metrics/resources filtered by resource+time+limit only. The
NetScript-aware questions require **client-side aggregation over `netscript.*` attributes** — no server
does it:
- *"last job result"* → `querySpans({limit})` filtered by `netscript.job.id`, read `netscript.job.status`
  + `netscript.job.exit_code` + `netscript.execution.completed_at`; pick most recent.
- *"avg perf of service X"* → `queryMetrics({resource:X})` or aggregate span `endTime-startTime` /
  `netscript.*.duration_ms` grouped by span name.
- *"recent db bottlenecks"* → `querySpans` where `netscript.kv.*` or db spans present, rank by duration /
  `statusCode===2`. There is **no DB-latency metric convention** beyond generic spans — MCP must derive it.
The trace-intelligence tool is therefore a thin analytics layer the MCP owns on top of the raw port;
it should live in the MCP package, keyed off the exported `netscript.*` attribute constants.

---

## 2. packages/cli — command tree, registration manifest, target verb surface (#701)

### 2.1 Two binaries
- Public: `packages/cli/bin/netscript.ts` (`runNetscriptCli`, re-exported from `mod.ts`) — published surface.
- Contributor/maintainer: `packages/cli/bin/netscript-dev.ts` → `netscript-dev` (maintainer tree,
  `src/maintainer/features/root/maintainer-command-tree.ts`: `init, sync, probe, test, release`).

### 2.2 Structured command manifest — YES, enumerable

`src/public/composition/cli-command-registry.ts` defines `CliCommandRegistry<TContext>` (extends kernel
`Registry`) with `register(id, factory)`, `get`, `entries()`, `commandNames()`, and `program(opts)` that
materializes a Cliffy `Command`. Top-level commands are registered in
`src/public/features/root/public-command-tree.ts` (`createPublicCommandRegistry`): **`deploy, init,
contract, db, generate, marketplace, plugin, service, ui:add, ui:init`**. Each factory has a stable
`id`. **An MCP layer can enumerate `commandNames()` for a machine list of top-level verbs**, though
sub-verbs (e.g. `db init|generate|migrate|seed|status|studio|introspect|reset`, see
`src/public/features/db/db-group.ts:33`) are only inside the built Cliffy tree — no flat manifest of
leaf verbs+flags exists yet. Sub-command groups: `db` (8), `service` (list + ops), `plugin` (incl.
`doctor`, `new`), `generate`, `contract`, `marketplace`, `ui`.

### 2.3 Output modes / exit codes

Commands are Cliffy actions that `print`/render (e.g. plugin doctor uses `renderDoctorReports(reports,
print)` in `src/public/features/plugins/doctor/doctor-plugin-command.ts:41`). There is **no uniform
`--json`/`--format` machine-output flag across the public tree** and no centralized structured exit-code
map found — MCP cannot yet rely on parseable stdout for most verbs. Errors flow through typed errors
(`ScaffoldValidationError`, kernel `src/kernel/domain/errors.ts`). **This is the single biggest MCP
integration risk: wrapping the CLI means either (a) invoke use-cases programmatically via the registry/
factories rather than shelling out, or (b) push a `--json` output mode as part of the MCP work.** Option
(a) is doctrine-aligned — the CLI already separates commands (presentation) from `*-use-case.ts` /
dependency objects (application), e.g. `doctor-plugin-use-case.ts` returns typed `PluginDoctorReport[]`.

### 2.4 Epic #701 (beta.9, milestone 11) — TARGET CLI verb surface the MCP must wrap

Epic **#701** "CLI features coverage — every resource type manageable end-to-end from the CLI"
(`area:cli`, `type:umbrella`, `wave:v1`, `priority:p1`, milestone `0.0.1-beta.9`). Owner directive
2026-07-12: every resource type must be add/update/version/inspect/remove from the CLI, because the
future Dev Dashboard (epic #400) mirrors each CLI write-action. Children in flight (all open):

- **#702** cli(contracts): contract lifecycle — add / update / version / inspect.
- **#703** feat(cli): streams end-to-end — implement the five stubbed runtime verbs + schema/producer/
  consumer scaffolders.
- **#704** feat(cli): durable-execution parity for workers & sagas — runtime-backed run/list/inspect,
  publish, update, remove.
- **#705** feat(cli): triggers completion — functional scaffold, event-ledger inspection, update/remove,
  authoritative enable/disable, real cron preview.
- **#706** feat(cli): contract & service lifecycle extensions — v2 versioning, remove, add-route,
  inspect, handler scaffolds (extends #702).
- **#707** feat(cli): Fresh web-layer scaffolding & UI registry — page/route/island generators, ui:list,
  ui:update, ui:remove.
- **#708** feat(cli): runtime & project configuration ops — runtime-config publish/rollback, config
  inspect/get/set, Aspire graph mutation, deploy target discovery.
- **#709** feat(cli): auth configuration & session CLI — backend select, provider config, secret
  generation, session list/revoke.
- **#710** feat(cli): AI stack configuration — self-wiring add tool/agent, model/provider mgmt, MCP
  server lifecycle, list/remove.
- **#711** feat(cli): host lifecycle symmetry for plugin & db groups — registration, re-pin update, db
  list/remove/deploy/validate, item scaffolding.
- **#712** docs(cli): adopt existing scaffold verbs in tutorials (workers/triggers/sagas teach manual
  file authoring despite shipped add-* commands).

**MCP-relevant read/inspect verbs to wrap once shipped:** `*/list`, `*/inspect`, `run/list/inspect`
(workers/sagas #704), triggers event-ledger inspection + cron preview (#705), `config inspect/get`
(#708), `session list` (#709), `db list/validate` (#711), streams runtime verbs (#703). Note #710 adds a
*separate* MCP-server-lifecycle CLI for the app's own AI MCP servers — distinct from the framework MCP
being designed here; keep the naming disambiguated.

---

## 3. Doctor / diagnostics tooling the MCP doctor tool can reuse

- **Plugin doctor** (public, shippable): `netscript plugin doctor` →
  `src/public/features/plugins/doctor/doctor-plugin-command.ts` +
  `doctor-plugin-use-case.ts` returns typed `PluginDoctorReport[]` from `PluginDoctorInput
  { projectRoot }`. Reuse the use-case directly for the MCP doctor tool (typed, no stdout parsing).
- **Aspire inspection:** `packages/aspire/mod.ts:22` exports `inspectAspire()` + types
  `InspectableAspireBuilder`, `InspectableAspireResource`, `InspectionReport`
  (`packages/aspire/src/diagnostics/inspect-aspire.ts`). Good source for "is the AppHost/resource graph
  healthy" without spawning Aspire.
- **Agentic runtime doctor** (`deno task agentic:runtime doctor`): `.llm/tools/agentic/runtime/` —
  `contract.ts` defines command kinds `doctor|status|...` with `doctor: ['inspect']` modes. This is a
  *repo/agent-tooling* health surface (Codex/OpenHands lanes), NOT product-facing; do not wire it into
  the shipped MCP, but it is the pattern reference for a desired-state doctor.
- **CLI env doctor via `mcp__aspire__doctor`** already exists (Aspire's own MCP) — see §7; the NetScript
  MCP doctor should complement (plugin/telemetry/project wiring), not duplicate Aspire env checks.
- No unified `netscript doctor` command exists today — an opportunity: aggregate plugin doctor +
  inspectAspire + telemetry-endpoint reachability into one MCP `doctor` tool / future CLI verb.

---

## 4. Docs corpus — Lume + Pagefind

- Site root: `docs/site/`, built with **Lume** (`docs/site/_config.ts:1`, `import lume from "lume/mod.ts"`).
  Plugins used: `base_path`, **`pagefind`** (search index — line 3), `code_highlight`, `anchor`
  (slugify, levels 1–4), plus a local `_plugins/ai-tooling.ts`.
- Content tree (Diátaxis-style): `docs/site/{tutorials, how-to, reference, explanation, capabilities}`
  plus domain folders `data-persistence, identity-access, web-layer, orchestration-runtime,
  background-processing, observability, services-sdk, durable-workflows, ai`. Support dirs `_data,
  _components, _includes, _diagrams, _plan, styles, assets`.
- **Search index = Pagefind** (generates `pagefind/` static index at build). A docs-search MCP tool has
  two options: (a) query the built Pagefind index (needs a built site), or (b) index the raw Markdown
  under `docs/site/**` directly (source-of-truth, no build). For a `docs get` tool, resolve slug →
  Markdown file under `docs/site/`. Published site location: built via Lume to the standard `_site/`
  output (Lume default); the doc set that ships is `docs/site/` source. `docs/architecture/doctrine/` and
  `docs/ROADMAP.md` are internal (doctrine + roadmap), NOT part of the public site content — keep the
  docs MCP scoped to `docs/site/` to avoid leaking internal doctrine/PR-process wording (see MEMORY:
  public-docs-no-internal-wording).

---

## 5. Skill patterns — authoring, mirroring, and scaffold emission

- **Source of truth:** `.agents/skills/<name>/SKILL.md`. Frontmatter is YAML `name:` + `description:`
  only (see `.agents/skills/netscript-cli/SKILL.md` head; `netscript-doctrine` uses a folded `>` block
  description). Body is Markdown: "When to Use / When Not to Use", tables, command maps. Skills are
  navigators — they point to authoritative files, they don't duplicate them.
- **Mirror to Claude:** `.agents/skills/README.md:23` — Claude Code consumes a generated mirror at
  `.claude/skills/`; keep `.agents/skills/` authoritative and run `deno task agentic:sync-claude`
  (`.llm/tools/agentic/claude/sync-claude-skills.ts`) after changes. Do NOT hand-edit `.claude/skills/`
  (CLAUDE.md rule). Validation: `.llm/tools/agentic/claude/validate-claude-surface.ts` (`runSyncCheck`
  asserts the mirror is in sync). This mirror mechanism is **repo-internal agent tooling** — it governs
  how NetScript's own dev skills reach Claude; it is not the consumer-facing skill delivery path.
- **Consumer-facing skills / agent files in scaffolded apps:** `netscript init` (app scaffold via
  `src/kernel/templates/app/` + `src/kernel/application/scaffold/plan-init*.ts`) does **NOT** currently
  emit `AGENTS.md`, `CLAUDE.md`, `.claude/skills/`, `.cursor`, or `.mcp.json` into generated projects.
  The only `AGENTS.md` generator is `src/maintainer/features/release/eject/producer-root-files.ts:47`
  (`['AGENTS.md', agents()]`) — that is the **repo eject** path (producing the framework repo itself),
  not consumer app scaffold. **This is a green-field opportunity:** shipping public skills + an
  `.mcp.json` (pointing at the NetScript MCP) into scaffolded apps would be a new scaffold contribution,
  with no existing convention to conflict with. There is no shipped public-facing skill today.

---

## 6. Doctrine constraints for a new `packages/mcp`

Read `docs/architecture/doctrine/06-archetypes.md` (Archetype 6) + skill `netscript-doctrine`.

- **Archetype:** A framework MCP server that ships a runnable binary is **Archetype 6 (CLI/Tooling)**;
  `06-archetypes.md:216`. It is a thin presentation/router over lower layers — same shape the CLI uses.
  Because MCP "wraps the CLI + telemetry port," it is a **router with no business logic** (A9 "pick the
  larger, fold the smaller"): presentation parses MCP tool calls → application flows → adapters that call
  CLI use-cases / `TelemetryQueryPort` / plugin-doctor use-case / `inspectAspire`. If it grows a real
  port seam (e.g. an `McpToolPort` with multiple transports) the core is Archetype 2 with a thin
  Archetype-6 edge — mirror the deploy split (`06-archetypes.md:285`).
- **Archetype-6 folder law:** `mod.ts` (optional lib entry), `cli.ts`/binary entry (the MCP stdio/HTTP
  server), `README.md`, `deno.json`, `src/{domain, application/{flows,runner}, presentation, infrastructure}`,
  `tests/`. **Presentation parses input only — no fs, no process spawn, no Aspire/telemetry calls in
  `presentation/`.** Application owns flows; infrastructure owns adapters (telemetry HTTP, CLI use-case
  calls, MCP transport). Command/tool names use `<concern>.<flow>` style.
- **Layering (doctrine 05):** `domain` → `ports` → `application` → `adapters` → `presentation`; no
  generic `utils/helpers/common/lib/interfaces` folders (doctrine finding otherwise).
- **Public surface / gates:** doctrine 02 + 09 (F-1..F-18, AP-1..AP-20). New package needs: A1 public
  types first, README with the public API, `deno doc --lint` clean (publish bar per netscript-deno-toolchain),
  `deno task arch:check` passing, JSR-ready `deno.json`.
- **Naming / publish:** `@netscript/mcp` (all first-party packages are `@netscript/*`; cf. `@netscript/cli`,
  `@netscript/telemetry`, `@netscript/aspire`). JSR publish expected (repo publishes the workspace to
  JSR; `jsr-audit` + `deno task publish:dry-run` gate it). If it is instead scaffolded *into apps* as a
  plugin rather than a standalone published package, it would be Archetype 5 — but the brief ("first-party
  MCP server") points to a standalone `packages/mcp` Archetype-6 package.
- **Rule:** doctrine-first for `packages/` — identify archetype, public surface, gates, debt before
  writing framework code (AGENTS.md operating rule 1). Contract-first: define the MCP tool schemas
  (Standard Schema, reuse telemetry's `*QueryFilterSchema`) before implementation.

---

## 7. Aspire integration points — complement, do not duplicate

- **Scaffold wires Aspire:** `netscript init` generates the AppHost/Aspire config via
  `src/kernel/templates/aspire/` (`generate-aspire-config.ts`, `generate-appsettings.ts`,
  `generate-global-json.ts`, `helpers/register/generate-register-apps.ts`). The generated app runs the
  Aspire dashboard (default query endpoint `http://localhost:18888`), which is exactly what
  `AspireTelemetryQuery` reads. So the NetScript MCP's telemetry tools ride on the same Aspire dashboard
  the scaffolded app already stands up.
- **Aspire ships its own MCP** (present in this environment: `mcp__aspire__*` — `doctor`, `list_resources`,
  `list_traces`, `list_structured_logs`, `list_trace_structured_logs`, `list_console_logs`,
  `execute_resource_command`, docs search/get, `list_integrations`). **The NetScript MCP must NOT
  re-expose generic Aspire trace/resource/log listing or env-doctor** — Aspire's MCP already does that.
  NetScript's differentiator is **`netscript.*`-aware intelligence**: job/saga/trigger/stream/worker
  lifecycle read models, "last job result / avg service perf / db bottlenecks", CLI-verb triggering
  (scaffold + lifecycle from #701), plugin doctor, and docs search/get over `docs/site/`. Treat Aspire's
  MCP as the low-level telemetry substrate; NetScript's MCP is the framework-semantic layer above it.
- `inspectAspire()` (`packages/aspire`) lets the NetScript doctor validate the *NetScript-generated*
  Aspire resource graph specifically (register-apps helpers), which Aspire's generic MCP cannot judge.

---

## Design inputs — 10 constraints/opportunities the designer must honor

1. **Wrap, don't reimplement.** Call CLI *use-cases* programmatically via the command registry /
   `*-use-case.ts` objects (typed returns like `PluginDoctorReport[]`), not by shelling out — the public
   CLI has no uniform `--json`/exit-code contract yet (§2.3). If shelling out is unavoidable, land a
   `--json` output mode as part of the MCP work.
2. **Telemetry reads go through `TelemetryQueryPort` (Aspire-backed), never a private KV.** Use
   `createTelemetryQuery({endpoint,apiKey})`; the designer must solve **dashboard endpoint discovery**
   (ephemeral AppHost port), default `http://localhost:18888`.
3. **The "smart" trace tools are client-side aggregation the MCP owns.** The port only filters by
   resource+time+limit; last-job-result / avg-perf / db-bottleneck logic groups spans/metrics by
   `netscript.*` attributes in the MCP application layer.
4. **Import `netscript.*` attribute constants** from `@netscript/telemetry` `attributes.ts` (per-domain
   modules) — never hardcode attribute strings; that keeps the MCP in lockstep with the conventions.
5. **Do not duplicate Aspire's own MCP** (generic traces/logs/resources/env-doctor). Position NetScript's
   MCP as the framework-semantic layer (jobs/sagas/triggers/streams/workers + CLI verbs + docs); reuse
   Aspire's MCP / `inspectAspire()` underneath.
6. **CLI-verb surface is a moving target (epic #701, beta.9).** Design the CLI-triggering tools against
   the enumerable registry (`commandNames()`) and the #702–#712 lifecycle verbs (add/update/version/
   inspect/remove per resource); prefer read/inspect verbs first (workers/sagas run-list-inspect #704,
   triggers ledger #705, config inspect #708, db list/validate #711).
7. **Package shape = Archetype 6 (`@netscript/mcp`)**, thin router: `presentation` parses tool calls only;
   `application/{flows,runner}` owns logic; `infrastructure` holds telemetry-HTTP/CLI/Aspire adapters.
   No `utils/helpers` folders. Contract-first: define tool schemas (reuse `*QueryFilterSchema`).
8. **Doctor tool = aggregation of existing diagnostics**, not new checks: plugin-doctor use-case +
   `inspectAspire()` + telemetry-endpoint reachability. Consider promoting this to a real `netscript
   doctor` CLI verb so the MCP mirrors a CLI action (DDX "CLI mirror" law from #701).
9. **Docs tools scope to `docs/site/` only** (Lume + Pagefind). Options: query the built Pagefind index or
   index raw Markdown; `docs get` = slug→Markdown resolve. **Exclude** `docs/architecture/doctrine/`,
   ROADMAP, and any internal/PR-process wording (public-docs hygiene rule).
10. **Public skills + agent-file emission into scaffolded apps is green-field.** `netscript init` emits no
    `AGENTS.md`/skills/`.mcp.json` today. Shipping consumer skills + an `.mcp.json` that registers the
    NetScript MCP is a new scaffold contribution (`src/kernel/templates/app/`) with no legacy convention
    to fight; keep authoring conventions consistent with `.agents/skills/` (name+description frontmatter,
    navigator style) but deliver via the scaffold, distinct from the repo-internal `.claude/skills/` mirror.
