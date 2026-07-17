# Design — NetScript agentic combo: `@netscript/mcp` × public skills × CLI

Tier-A design (Fable 5 supervisor), doctrine-first, 2026-07-12. Inputs:
`research-aspire-combo.md`, `research-netscript-surfaces.md`. Refs #302 (positioning/bench: this
combo + revamped docs is the agentic-benchmark lever). Umbrella PR #715.

## 1. Positioning (one sentence)

NetScript ships the Aspire model — CLI × SKILL × MCP as one version-locked agentic surface — where
the MCP server is the **framework-semantic layer** (jobs/sagas/triggers/streams/workers/docs/CLI
verbs) that rides above Aspire's generic MCP, and every tool exists to turn a multi-call,
token-heavy agent chore into one call.

## 2. Doctrine decisions

- **Package**: new `packages/mcp` → `@netscript/mcp`, JSR-published. **Archetype 6 (CLI/Tooling,
  thin router)** per `docs/architecture/doctrine/06-archetypes.md:216`. Folder law:
  `mod.ts` (lib entry: tool registry + server factory), `cli.ts` (stdio server entry), `README.md`,
  `deno.json`, `src/{domain,application/{flows,runner},presentation,infrastructure}`, `tests/`.
  Presentation parses MCP tool calls ONLY; application owns flows; infrastructure owns adapters
  (telemetry HTTP, CLI use-cases, docs corpus, MCP transport). No utils/helpers folders.
- **One binary, three faces**: the runnable path is a CLI subcommand — `netscript agent mcp`
  (stdio) and `netscript agent init` (installer) — registered in `packages/cli`'s
  `CliCommandRegistry`. `@netscript/mcp` is the engine; the CLI is the spine. MCP/skill/CLI are
  version-locked by construction (Aspire lesson #1).
- **Wrap, never reimplement**: tools call CLI *use-cases* programmatically (typed returns, e.g.
  `PluginDoctorReport[]`) and `TelemetryQueryPort` (`createTelemetryQuery`); no stdout scraping.
  Where a use-case seam is missing, the slice adds the seam in `packages/cli` (small, reviewed),
  not a reimplementation in MCP.
- **Contract-first**: every tool's input/output is a Standard Schema in `src/domain/` (reuse
  telemetry's `*QueryFilterSchema`). Tool registry is data (name, description, schema, flow ref) so
  the CLI twin table and the skill can be generated/validated against it.
- **Transport**: STDIO only for v1. No ports, no API keys except the outbound dashboard apiKey
  option. Data boundary documented in README: telemetry + project metadata + docs; never source,
  env values, or secrets.
- **Complement Aspire**: no generic trace/log/resource listing duplication. Aspire's MCP covers
  raw telemetry + env doctor; NetScript's tools are `netscript.*`-aware or NetScript-project-aware.

## 3. MCP tool surface (v1)

Read-heavy, one mutation gate, search→get funnels. Names follow Aspire's `list_/get_` verbs.
Every tool description carries token-discipline text ("don't print full logs…"). Server-side
truncation defaults (limit caps, body truncation) live in the runner.

### monitoring / status
| Tool | Collapses | Backing |
|---|---|---|
| `get_app_status` | "is my NetScript app healthy" — services, workers, sagas, triggers, streams with state + recent error counts, one call | TelemetryQueryPort resources + spans grouped by `netscript.*` + `inspectAspire()` graph |
| `list_runs` | recent executions (jobs/saga instances/trigger firings), filterable by domain/status/service | spans grouped by `netscript.execution.id` / `netscript.job.id` / `netscript.saga.instance.id` / `netscript.trigger.id` |

### debugging
| `get_run` | one execution end-to-end: spans + logs + outcome + error, by execution/job/saga/trigger id | getTrace + queryLogs by traceId |
| `get_recent_errors` | last N errors across the app grouped by service/domain, with root span + message | querySpans statusCode=2 + queryLogs severity>=error |

### trace intelligence (the Aspire-can't-do layer)
| `get_last_job_result` | "did my job run, what happened" | spans by `netscript.job.*`, most recent by `netscript.execution.completed_at` |
| `analyze_service_performance` | avg/p50/p95 duration + error rate + throughput for service X over window | span durations + `netscript.*.duration_ms` grouped by span name |
| `analyze_db_bottlenecks` | slowest/most frequent KV+DB operations, ranked | spans with `netscript.kv.*` / db semconv, ranked by duration/count |

### doctor
| `doctor` | env + project diagnostics: plugin doctor + NetScript Aspire graph validation + telemetry endpoint reachability + version/config checks; pass/warn/fail + fix suggestions; works without a running app | plugin-doctor use-case + `inspectAspire()` + probe |

### docs
| `search_docs` / `list_docs` / `get_doc(slug, section?)` | search→get funnel over the public docs corpus (`docs/site/**` Markdown; published site as fallback) | Markdown index; exclude doctrine/ROADMAP/internal (public-docs law) |

### CLI trigger
| `list_commands` | machine list of available CLI verbs + args (from `CliCommandRegistry` + Cliffy tree walk) | registry `commandNames()` + tree introspection |
| `execute_command` | ONE mutation gate: run an allowlisted CLI verb ("add a service X", "run the migration") with structured result | spawns `netscript <verb>` (own process = correct lock/fs semantics), captures exit code + tail; allowlist blocks deploy/publish/destructive verbs |

Note: `execute_command` shells the CLI (not use-cases) deliberately — mutations must behave exactly
like a user-run CLI; read tools use typed use-cases. #701 (#702–#712) grows the verb surface; the
tool enumerates the registry dynamically, so new verbs appear without MCP changes.

### meta
`refresh_tools` deferred (static v1 surface). Endpoint discovery: dashboard endpoint from
`--endpoint` flag → env (`NETSCRIPT_TELEMETRY_ENDPOINT` / Aspire dashboard env) → apphost config
scan in cwd → default `:18888`; surfaced in `doctor`.

## 4. Public skills (consumer-facing bundle)

New top-level dir `skills/` in the repo (published artifact source, distinct from repo-internal
`.agents/skills/`), emitted into consumer apps by `netscript agent init`:

- **`netscript`** (router): USE FOR / DO NOT USE FOR / INVOKES / hand-offs (aspire skill, docs
  site); "not useful alone". Prefers CLI when a CLI twin exists (Aspire #14619 lesson); MCP for
  telemetry-heavy/interactive loops.
- **`netscript-operate`**: monitoring/debugging/trace-intelligence workflows (task→tool/command
  tables, safety rules: never edit generated registries, lock hygiene…).
- **`netscript-build`**: scaffold/add/generate workflows wrapping CLI verbs (contract-first flow,
  db init→generate→seed, plugin add→sync→doctor).
- `netscript agent init` writes: `.mcp.json` (Claude Code) / `.vscode/mcp.json` (host-detected),
  `skills/` copies, and appends/creates `AGENTS.md`. Bundle content SHA-verified at copy (v1:
  simple manifest hash).

Public-docs law applies to every skill/doc string: no internal app names, PR numbers, process
wording. Grep gate in each authoring slice: `eis|VIF|CSB|PR #|dogfood|harness`.

## 5. Epic + child slices (filed under milestone Backlog / Triage; epic label `epic:agentic-combo`)

- **S1** `packages/mcp` skeleton: Archetype-6 layout, domain tool contracts (all schemas), tool
  registry, stdio server runner over `@modelcontextprotocol/sdk` (or minimal stdio JSON-RPC if the
  npm dep violates catalog law — decide in-slice per netscript-deno-toolchain), `doctor` v0
  (telemetry reachability only). Gates: arch:check, doc --lint, publish dry-run.
- **S2** docs tools: corpus indexer over `docs/site/**` (front-matter title/desc + heading
  sections), `search_docs`/`list_docs`/`get_doc`, exclusion list, truncation.
- **S3** telemetry adapters + monitoring/debugging tools: endpoint discovery, `get_app_status`,
  `list_runs`, `get_run`, `get_recent_errors`.
- **S4** trace intelligence: `get_last_job_result`, `analyze_service_performance`,
  `analyze_db_bottlenecks` (aggregation layer keyed off `@netscript/telemetry` attribute constants).
- **S5** doctor aggregation: plugin-doctor use-case + `inspectAspire()` + config/version checks.
- **S6** CLI trigger: `list_commands` (registry introspection) + `execute_command` gate + allowlist
  policy; small CLI seams as needed.
- **S7** CLI integration: `netscript agent mcp` + `netscript agent init` commands in
  `packages/cli`; host detection; `.mcp.json`/AGENTS.md emission; wire `@netscript/mcp` dep.
- **S8** public skill bundle: `skills/netscript{,-operate,-build}` + manifest + init-copy +
  scaffold emission option; public-docs grep gate.
- **S9** docs + polish: docs/site page ("Agent tooling"), READMEs, JSR audit, e2e smoke
  (spawn `netscript agent mcp`, initialize, call `doctor`+`search_docs` over stdio).

Dependency notes: S3/S4 depend on S1; S6/S7 touch `packages/cli` (coordinate with #701 siblings —
different files: registry additions are additive; `agent` is a NEW command group so no collision
with #702–#712 resource groups). S8 depends on S7. All slices Tier-D (WSL Codex) except S8 skill
prose (Tier-B Opus authoring allowed under the docs exception) — final call per slice.

## 6. Risks / drift watch

- **MCP SDK dep**: `@modelcontextprotocol/sdk` is npm; catalog law says `catalog:` is npm-only —
  fine, but evaluate a zero-dep stdio JSON-RPC implementation (protocol subset: initialize,
  tools/list, tools/call) to keep the publish surface lean. Decide in S1; record as drift if SDK.
- **#701 in flight**: verb surface moves; `list_commands` is dynamic, `execute_command` allowlist
  is config data — no hard coupling. Record dependency in epic body.
- **Endpoint discovery** is the flakiest seam; doctor must make failures self-explaining.
- **Aspire MCP overlap**: reviews check each tool justifies itself as NetScript-semantic.
