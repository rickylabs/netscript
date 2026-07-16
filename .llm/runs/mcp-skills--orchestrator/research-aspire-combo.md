# Research: .NET Aspire "Agentic Combo" (CLI × SKILL × MCP)

Reference model for NetScript's first-party MCP server + public skills + CLI.

Tier-B research (Opus 4.8). Date 2026-07-12.

## Sources

- Local shipped skill: `.agents/skills/aspire/SKILL.md` (this worktree).
- aspire.dev — MCP server: <https://aspire.dev/get-started/aspire-mcp-server/>
- aspire.dev — Skills: <https://aspire.dev/get-started/aspire-skills/>
- Chris Ayers, "Aspire CLI Part 3 - MCP": <https://chris-ayers.com/posts/aspire-cli-part-3-mcp/>
- GitHub microsoft/aspire#14619 "Update the aspire skill to use the CLI instead of the MCP server"
  (davidfowl, closed in milestone 13.2): <https://github.com/microsoft/aspire/issues/14619>
- Supporting: microsoft/aspire#14454, #14837, tamirdresher.com "Aspire + Squad"; reddit r/dotnet.
- Skills bundle repo: <https://github.com/microsoft/aspire-skills>

---

## 1. Combo anatomy — three layers, one vocabulary

Aspire ships a single coherent agentic surface in three layers, all installed and updated by the
**one CLI binary** (`aspire`). The CLI is the spine; MCP and skills are two projections of the same
capability set.

| Layer | Artifact | Distribution | Update path |
|---|---|---|---|
| **CLI** | `aspire` binary (cross-platform, polyglot AppHost: `apphost.cs`/`apphost.ts`) | User install; `aspire update --self` | self-updating binary |
| **MCP server** | `aspire agent mcp` (formerly `aspire mcp start`) — a **subcommand of the same binary**, not a separate package | config file written by `aspire agent init`; STDIO subprocess | ships with CLI (version-locked) |
| **SKILL** | Markdown bundle (`microsoft/aspire-skills`), 6 workflow skills + companions | embedded in CLI, copied by `aspire agent init`; OR marketplace (`/plugin`, `apm`, `skills.sh`, `copilot plugin`) | `aspire update --self` replaces the **embedded, SHA-256-verified** bundle |

Key coupling facts:
- **One binary, three faces.** MCP is `aspire agent mcp`; every MCP tool has an exact CLI twin (see
  §2 mapping table). The skill, the CLI, and the MCP tools share one vocabulary (resources, console
  logs, structured logs, traces, integrations, docs, doctor, apphost).
- **Version coupling is intrinsic** because the MCP server and the skill bundle both ship *inside*
  the CLI. The CLI validates the embedded skill bundle (metadata version + SHA-256) before copying;
  a mismatch is treated as a corrupt CLI install, fixed by `aspire update --self`. There is no
  independent "MCP server version" or "skill version" to drift against the CLI.
- **`aspire agent init` is the installer** for BOTH the MCP config file and the skill files (and
  auto-creates `AGENTS.md` if absent). It detects the agent environment and writes per-host config.
- Naming migration: `aspire mcp init` / `aspire mcp start` (13.1) → `aspire agent init` /
  `aspire agent mcp` (13.2+). Docs/configs already use the `agent` form.

---

## 2. MCP tool surface inventory

15 tools. Observable I/O shape is JSON-in/JSON-out; every tool has a `--format Json` CLI twin. What
each collapses into one agent call:

| Tool | Purpose | Input (observable) | Collapses to one call |
|---|---|---|---|
| `list_resources` | All resources: state, health, source, endpoints, commands | none / optional resource name | "are all my resources running / what's the endpoint" — replaces reading dashboard + parsing |
| `list_console_logs` | stdout/stderr for a resource | `resourceName`, optional `search` | "show me the API's console output" |
| `list_structured_logs` | OTel structured log entries | optional `resourceName`, `search` | "find ERROR log lines in webfrontend" |
| `list_traces` | Distributed traces (ids, resources, duration, error flag) | optional `resourceName`, `search` | "what traces show errors / longest duration" |
| `list_trace_structured_logs` | Logs belonging to one trace, by span | `traceId`, `search` | root-cause a single request across services in one call |
| `execute_resource_command` | Run start/stop/restart (or resource-defined command) | `resourceName`, `commandName`, args | "restart unhealthy resources" — mutation without shelling out |
| `list_apphosts` | Detected AppHosts + in/out-of-scope status | none | multi-apphost disambiguation |
| `select_apphost` | Switch active AppHost context | `appHostPath` | targets the right running app before any query |
| `list_integrations` | Available hosting integration packages (id + version) | none | "what integrations exist for Redis" |
| `get_integration_docs` | Docs for one integration package | package id | read-before-add, avoids NuGet cache spelunking |
| `list_docs` | List aspire.dev doc pages (slug + summary) | none | doc catalog browse |
| `search_docs` | Keyword/lexical search over aspire.dev (LLMS.txt content) | `query`, `topK` | **search-before-get**: find the slug cheaply |
| `get_doc` | Full doc page by slug, optional section filter | `slug`, optional `section` | fetch only the needed section, not the whole page |
| `doctor` | Environment diagnostics (pass/warn/fail + fixes) | none; no running AppHost required | one-call env triage |
| `refresh_tools` | Server re-emits tool list (tools-list-changed) | none | tool-surface refresh without reconnect |

Design pattern: tools are **outcome-first and read-heavy** (12 read, 1 mutate, 2 meta). The single
mutation (`execute_resource_command`) is funnelled through one gate rather than exposing N verbs.
`list_*` naming signals pagination/collection semantics and cheapness. Docs tools form a deliberate
**search → get** funnel; integrations form a **list → get_docs → (CLI) add** funnel.

---

## 3. Skill anatomy

The shipped `SKILL.md` (local copy) is CLI-centric today; the design intent (issue #14619) is that
**the skill teaches the CLI, not the MCP tools**, even though the MCP server exists.

- **Frontmatter description is a router.** It front-loads `USE FOR:` (aspire start/stop/describe,
  logs, add resource, dashboard, debug), `DO NOT USE FOR:` (non-Aspire .NET → dotnet CLI;
  container-only → docker; post-local Azure → azure-deploy skill), `INVOKES:` (exact commands), and
  `FOR SINGLE OPERATIONS:` (use CLI directly). This trigger strategy = positive triggers + explicit
  negative boundaries + hand-off targets to sibling skills.
- **Body is a command-reference table + workflow playbooks**, not prose. Tables map task→command;
  playbooks cover "running in agent environments", "applying code changes" (decision table: AppHost
  change → `aspire start`; .NET resource → `aspire resource <n> rebuild`; interpreted → nothing),
  "debugging", "adding integrations".
- **CLI-vs-MCP guidance.** The shipped file lists `aspire mcp tools` / `aspire mcp call` only for
  *resource-exposed* MCP tools (e.g. `WithPostgresMcp()` SQL tools) — i.e. MCP is for calling tools
  a *resource* publishes, while the CLI is the default for orchestration/telemetry. The strategic
  direction (davidfowl, #14619) is stronger: **prefer CLI for everything** so the skill works with
  only the CLI installed — "no MCP server dependency, works in all agent environments, simpler
  setup, JSON output support."
- **Skill is a bundle, not a monolith.** `microsoft/aspire-skills` = 6 workflow skills: `aspire`
  (router), `aspire-init`, `aspire-orchestration`, `aspire-monitoring`, `aspire-deployment`,
  `aspireify` (wire existing repo), plus companions `playwright-cli`, `dotnet-inspect`. The
  top-level `aspire` skill **only routes**; docs explicitly say it is "not useful as the only Aspire
  skill." Playwright handoff: aspire skill discovers the frontend endpoint, then hands the URL to
  `playwright-cli`.
- **Safety guardrails encoded as rules.** "Always `aspire start` first"; "never `aspire stop` then
  `run`; never use `aspire run` at all"; "only restart AppHost when AppHost code changes"; "use
  `--isolated` in worktrees"; "avoid persistent containers early"; "never install the Aspire
  workload (obsolete)"; "prefer `aspire docs search`/`get` over NuGet/XML doc spelunking."

---

## 4. Runtime architecture

- **Transport: STDIO by default.** `aspire agent mcp` runs as a **local child process** the agent
  spawns; comms over stdin/stdout pipes. **No network ports, no listener.** Only the parent agent
  can talk to it. (Legacy/alt: HTTP transport exposed by the **dashboard** with `url` +
  `x-mcp-api-key` header — used in Aspire 9.0–13.0 or when more control is needed; can be forced to
  plain HTTP via `ASPIRE_DASHBOARD_MCP_ENDPOINT_URL` + `ASPIRE_ALLOW_UNSECURED_TRANSPORT`, at the
  cost of transport security.)
- **How it connects to the running app.** The MCP server (a CLI subprocess) **auto-detects running
  AppHosts within the working-directory scope** and continuously monitors for changes — no restart
  when apps come/go. It reads from the AppHost's live model + the in-memory OTel/telemetry store
  (dashboard's data source), NOT from source or the filesystem. `list_apphosts`/`select_apphost`
  disambiguate when several are running. `doctor` works even with no AppHost running.
- **Auth.** STDIO ⇒ none needed (process-pipe isolation is the boundary). HTTP ⇒ `x-mcp-api-key`.
- **Data boundary (what it can/can't see).** Exposes: resource metadata, console logs, structured
  logs, traces, integration catalog, product docs. Does NOT expose: source code / filesystem,
  env-var values / secrets, raw network payloads, host beyond the AppHost process. Per-resource
  opt-out via `ExcludeFromMcp()` in the AppHost (hides the resource **and its telemetry**).
- **Lifecycle/deploy stance.** Dev-time-only; part of CLI tooling, runs separately from the AppHost,
  no persistent storage (in-memory for the session), never shipped in deployed apps. Exclude dev
  resources from prod with `ExecutionContext.IsRunMode`.

---

## 5. Token-efficiency patterns

- **Server-side truncation as a contract.** Docs state the server "may limit data returned": large
  fields (long stack traces) are **truncated**, and large telemetry collections are **shortened by
  omitting older items**. The agent never has to defend its own context window — the tool does.
- **Search-before-get funnel.** `search_docs`/`list_docs` (cheap, ranked, summaries) → `get_doc`
  with an optional **section filter** so only the needed slice is fetched. Same shape for
  integrations (`list_integrations` → `get_integration_docs`).
- **Scoped filtering on every collection tool.** `list_structured_logs`/`list_traces` take an
  optional `resourceName`; most take a full-text `search`. Trace drill-down (`list_traces` →
  `list_trace_structured_logs` by `traceId`) avoids pulling all logs to correlate one request.
- **"Don't print the full logs" instruction.** The MCP tool descriptions themselves tell the agent
  not to dump full console logs into the response and to examine logs only when diagnosing — pushing
  summarization onto the agent's output, not just the input.
- **`list_` naming = collection/pagination semantics**; the agent learns cheapness from the verb.
- **CLI twins carry `--format Json`** so the *same* data is machine-parseable whether via MCP or CLI
  — no re-scraping human output.
- **`refresh_tools`** avoids full reconnects when the tool surface changes.
- **`doctor` collapses N diagnostic probes into one** structured pass/warn/fail with fix
  suggestions.

---

## 6. Lessons for NetScript (do / don't)

**Do:**
1. **One binary, three faces.** Make the NetScript MCP server a subcommand of the existing
   `netscript` CLI (e.g. `netscript agent mcp` over STDIO), so MCP, skills, and CLI are version-
   locked by construction. Avoid a separately-versioned MCP package that can drift.
2. **Every MCP tool gets an exact CLI twin** with `--format json`. This is Aspire's parity
   invariant and it directly enabled #14619 (dropping the MCP dependency for CLI where preferable).
   NetScript already has rich CLI (`plugin doctor`, `generate`, scaffold E2E) — mirror those as MCP
   tools 1:1.
3. **Ship an installer command** (`netscript agent init`-equivalent) that writes per-host MCP config
   (`.mcp.json` for Claude Code, `.vscode/mcp.json`, etc.) AND copies skill files, detecting the
   host. NetScript already mirrors `.agents/skills/` → `.claude/skills/`; formalize that as the
   installer's job.
4. **Embed the skill bundle in the CLI and SHA-256-verify it** on copy; update via
   `... update --self`. This is the cleanest version-coupling story and gives a clear error surface.
5. **Router skill + workflow skills.** Adopt Aspire's split: a thin top-level router skill
   (`USE FOR/DO NOT USE FOR/INVOKES`) that dispatches to focused workflow skills. NetScript's skill
   set (`netscript-cli`, `netscript-doctrine`, `netscript-harness`, ...) already resembles this —
   add an explicit *router* whose only job is dispatch, and state it "is not useful alone."
6. **Outcome-first, read-heavy tool design; funnel mutations.** Prefer `list_*` read tools + a
   single `execute_*_command` gate over many verb tools. Keeps the surface small and safe.
7. **Server-side truncation + "don't print full logs" in tool descriptions.** Bake token discipline
   into the server and the tool text, not just the skill. NetScript's own tooling already preaches
   `rtk`/compressed output — encode the same at the MCP boundary.
8. **Search→get docs funnel.** Expose `search_docs`/`get_doc(slug, section)` over NetScript's doc
   corpus (mirrors `aspire docs search/get`); it beats broad-read for token cost and matches the
   repo's "deno doc is your friend / search before read" doctrine.
9. **STDIO transport, no ports, no secrets.** Dev-time-only, process-pipe isolation, explicit
   data-boundary doc (no source, no env values, no secrets). Provide a per-resource/`ExcludeFromMcp`
   opt-out equivalent for sensitive services.
10. **Auto-detect the running target within cwd scope** + `list/select` disambiguation, rather than
    requiring the agent to pass connection strings. Matches NetScript's worktree/`--isolated`
    realities.
11. **Negative boundaries + sibling hand-offs in the skill description** (Aspire hands off to
    dotnet/docker/azure-deploy/playwright). NetScript should hand off to `netscript-pr`,
    `netscript-release`, `rtk`, etc. explicitly.
12. **Encode safety guardrails as imperative rules** in the skill ("never X", "only restart when Y")
    — Aspire's are terse and high-signal; NetScript's stop-line/lock-hygiene rules fit this mold.

**Don't:**
1. **Don't make the MCP server the *default* interface if a CLI twin exists.** Aspire's own
   conclusion (#14619, davidfowl) is to have the skill **prefer the CLI**: it works with only the
   CLI installed, in every agent environment, no MCP config needed, and still gives JSON. Treat MCP
   as an accelerator for interactive/telemetry-heavy loops, not the mandated path — this aligns with
   NetScript's "prefer WSL Codex CLI / mobile-visible, token-efficient" doctrine.
2. **Don't expose broad mutation verbs or anything touching source/secrets/filesystem.** Keep the
   server observational + a single command gate.
3. **Don't let skill/MCP/CLI version independently.** Independent versioning is exactly what the
   embedded-bundle + SHA-verify design avoids.
4. **Don't ship a monolith skill.** Aspire explicitly warns the router skill is useless alone; a
   single mega-skill both over-triggers and starves specific workflows of detail.
5. **Don't rely on HTTP+API-key transport** unless remote/dashboard control is truly needed — it
   reintroduces secret management and transport-security footguns that STDIO avoids.
6. **Don't hand-author the mirrored skill copies.** (NetScript CLAUDE.md already forbids editing
   generated `.claude/skills/` — keep that generation-only, matching Aspire's embedded-bundle model.)

---

### Appendix: MCP tool → CLI command parity (from issue #14619)

`list_resources`→`aspire resources`; `execute_resource_command`→`aspire command <r> <c>` (or
`aspire start|stop|restart <r>`); `list_structured_logs`→`aspire telemetry logs [r]`;
`list_console_logs`→`aspire logs [r]`; `list_traces`→`aspire telemetry traces [r]`;
`list_trace_structured_logs`→`aspire telemetry logs --trace-id <id>`;
`list_integrations`/`get_integration_docs`→`aspire add`; `select_apphost`→`--project <path>`;
`list_apphosts`→`aspire ps`; `list_docs`→`aspire docs list`; `search_docs`→`aspire docs search`;
`get_doc`→`aspire docs get`; `doctor`→`aspire doctor`.
