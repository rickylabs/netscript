# Facts: CLI surface + Agentic combo (LANE-3, G14 main-README)

Read-only against `/home/codex/repos/wt-g14-816` (main, CLI version `0.0.1-beta.10` per executed
`netscript --help`). VERIFIED CLAIMS ONLY. Citations are file:line, executed `--help`, or the
just-audited package READMEs on main (`a87570a6` mcp rewrite, `fbb32119` README standard).

---

## Domain 1 — CLI surface (command map, scaffold, generators, maintainer, e2e)

### What it IS
The `netscript` binary (`@netscript/cli`) is NetScript's single command surface: it scaffolds a
complete running backend workspace, then every later verb that changes the workspace regenerates the
derived wiring (AppHost helpers, plugin registries, contract aggregates) so orchestration is never
hand-maintained. The same command tree is also an embeddable library.
- Positioning: "scaffold-and-grow, not scaffold-and-diverge" — `packages/cli/README.md:22`.

### Flagship capabilities (cited)
- **11 top-level command groups**, confirmed by executed `netscript --help`: `agent`, `config`,
  `deploy`, `init`, `contract`, `db`, `generate`, `marketplace`, `plugin`, `service`, and the
  `ui:*` family (`ui:add`/`ui:init`/`ui:list`/`ui:update`/`ui:remove`). Help is generated from the
  same command definitions the package exports, so it "never drifts from the binary you installed"
  (`packages/cli/README.md:110-111`).
- **Scaffold with blast-radius preview** — `netscript init my-app --dry-run` prints every file it
  would write without touching disk (`packages/cli/README.md:24-26`, `80-92`).
- **Regenerating generators** — `generate aspire|plugins|runtime-schemas` regenerate derived
  artifacts on demand (`packages/cli/README.md:104`).
- **Embeddable command tree** — `createPublicCli(host)` / `runPublicCli` return the full public
  surface against a host port so the host owns argv/exit-codes/permissions; plus `dispatchPluginVerb`
  routes framework-owned verbs into a plugin's own CLI (`packages/cli/README.md:27-31`, `260`).
- **Deterministic testing surface** — `./testing` supplies in-memory filesystem/process/prompt/logger
  ports + fixture builders so CLI and scaffold flows test without disk or subprocesses
  (`packages/cli/README.md:32-34`, `262`).
- **Deploy router** — one thin router over target adapters (bare metal, `deno-deploy`, kubernetes,
  azure-aca/app-service/aks, cloud-run, native `desktop`) implementing the canonical
  `plan`/`emit`/`up`/`down`/`status`/`logs` ops (`packages/cli/README.md:131-141`).
- **E2E harness** — two named suites verified in source: `scaffold.runtime` (full merge-readiness:
  local-source project → first-party plugins → db init/generate/seed → registries → typecheck →
  Aspire restore/start → endpoint validation → cleanup) and the narrower `scaffold.plugins`
  (`packages/cli/e2e/suites/` refs; `deno task e2e:cli` per CLAUDE.md).

### Honest maturity line
Shipping and load-bearing today (beta.10): the binary self-reports `0.0.1-beta.10`, `init` scaffolds
a full workspace, and merge-readiness rides on the `scaffold.runtime` E2E gate — but it is a
pre-release line: bare `jsr:@netscript/*` specifiers do not resolve and versions must be pinned
(`packages/cli/README.md:64-65`); compiled/native binaries are unsigned by design
(`README.md:145`, `177-187`).

### Quotable verified numbers
- **183 files, 44 directories** — a full postgres + `--service` workspace dry-run
  (`packages/cli/README.md:26`, `91`).
- **11 top-level command groups** (executed `netscript --help`).
- **6 deploy targets** across the canonical 6-op adapter contract (`packages/cli/README.md:135-141`).

---

## Domain 2 — Agentic combo: MCP × skills × CLI (flagship differentiator)

### What it IS
`@netscript/mcp` is the Model Context Protocol server for NetScript: a set of token-bounded tools
that let a coding agent monitor a running app, debug one correlated execution, read
framework-semantic telemetry, run the doctor, and search the docs — over stdio. It is framed as one
third of a triple: "the CLI is the hands, the skills are the playbook, MCP is the eyes"
(`packages/mcp/README.md:57`, `packages/cli/README.md:115-116`). `netscript agent init` wires all
three into an agent host in one command.

### Flagship capabilities (cited)
- **13 token-bounded tools**, verified as a frozen enumerable registry — `TOOL_NAMES` in
  `packages/mcp/src/domain/tool-types.ts:4-19` lists exactly: `get_app_status`, `list_runs`,
  `get_run`, `get_recent_errors`, `get_last_job_result`, `analyze_service_performance`,
  `analyze_db_bottlenecks`, `doctor`, `search_docs`, `list_docs`, `get_doc`, `list_commands`,
  `execute_command`. The registry maps over `TOOL_NAMES`
  (`packages/mcp/src/application/tool-registry.ts:47`).
- **Server-side result bounding** — every successful result is capped before it reaches the model:
  `DEFAULT_TRUNCATION_POLICY = { maxItems: 50, maxStringLength: 2000 }`
  (`packages/mcp/src/application/runner/truncation.ts:10`); analytics tools never return raw spans
  (`packages/mcp/README.md:27-29`).
- **Framework-semantic trace intelligence** — tools classify telemetry into `worker`/`saga`/
  `trigger`/`stream`/`service` domains and correlate whole executions by id via `netscript.*`
  attribute conventions (`packages/mcp/README.md:30-32`).
- **Default-deny CLI gate** — `execute_command` runs an ordered prefix policy where deny beats allow
  and anything unmatched is denied. Verified in source
  (`packages/mcp/src/domain/command-policy.ts:24-49`): 17 allow rules (db init/generate/migrate/
  seed/status/introspect, generate, contract, service list, plugin install/list/sync/doctor,
  ui:add/init/list/update) and 6 explicit deny rules (`deploy`, `init`, `marketplace`, `db reset`,
  `plugin remove`, `ui:remove`); `matches()` at :53 and default-deny fallthrough at :57-64.
- **One-command install** — `netscript agent init` auto-detects the host, writes `.mcp.json` (Claude
  Code) and/or `.vscode/mcp.json` (VS Code) pointing at `netscript agent mcp`, and installs the
  skill bundle; `--host claude|vscode|all` selects explicitly (`packages/cli/README.md:113-127`;
  `agent`/`mcp`/`init` subcommands confirmed by executed `netscript agent --help`).
- **Version-locked triple** — `agent init` writes host config pinned to the installed CLI version and
  installs the skills shipped with that same release, so the tool catalog the agent sees matches the
  release it runs (`packages/mcp/README.md:38-40`). The embedded skill bundle is content-hashed:
  `EMBEDDED_SKILL_BUNDLE_HASH` + `EMBEDDED_SKILL_FILES` (`netscript`, `netscript-operate`,
  `netscript-build` + `manifest.json`) in `packages/cli/src/kernel/assets/skills.generated.ts`.
- **Zero npm MCP SDK** — a minimal newline-delimited JSON-RPC stdio transport keeps the dependency
  graph lean (`packages/mcp/README.md:41-42`).
- **Wraps rather than reimplements the CLI** — `list_commands` reflects the live command tree,
  `execute_command` shells the CLI through the policy gate (`packages/mcp/README.md:58-61`).

### Honest maturity line
The MCP package just passed a full public-README audit on main and is a shipping beta.10 surface: the
13-tool registry, truncation policy, and command policy are all concrete frozen source, and it
degrades gracefully when telemetry is unreachable (`get_run` returns a structured `run_not_found`;
list/analytics tools return empty; `packages/mcp/README.md:130-132`). Caveat: server requires Deno
2.9+ (Node/Bun unsupported as server runtimes), and it complements — does not replace — Aspire's own
MCP server ("Aspire speaks resources and containers; this server speaks your app",
`packages/mcp/README.md:22-23`, `196-198`).

### Quotable verified numbers
- **13 token-bounded MCP tools** (`tool-types.ts:4-19`).
- **50 array items / 2,000 characters per string** — the server-side cap on every successful result
  (`truncation.ts:10`).
- **1 command** — `netscript agent init` — installs the whole CLI × skills × MCP triple
  (`packages/cli/README.md:116-119`).
- **17 allow / 6 deny prefix rules**, deny-beats-allow, default-deny
  (`command-policy.ts:24-49`).
