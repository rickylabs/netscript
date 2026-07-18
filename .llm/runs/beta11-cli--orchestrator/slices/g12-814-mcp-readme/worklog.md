# G12 — #814 @netscript/mcp README rewrite + docs coverage — worklog

Agent: Claude Fable 5 (documentation-authoring exception lane). Worktree
`/home/codex/repos/wt-g12-814`, branch `docs/814-mcp-readme`.

## Executed command evidence (accuracy law)

All against the shipped public packages `@netscript/mcp@0.0.1-beta.10` /
`@netscript/cli@0.0.1-beta.10` (Deno 2.9.3, Linux/WSL).

1. **Stdio protocol smoke** — `initialize` + `tools/list` piped into the shipped server:
   - `deno run -A --minimum-dependency-age 0 jsr:@netscript/mcp@0.0.1-beta.10/cli` → exit 0.
   - `initialize` result: `serverInfo {"name":"@netscript/mcp"}`, `protocolVersion "2025-11-25"`.
   - `tools/list` → **13 tools**, names exactly: get_app_status, list_runs, get_run,
     get_recent_errors, get_last_job_result, analyze_service_performance, analyze_db_bottlenecks,
     doctor, search_docs, list_docs, get_doc, list_commands, execute_command.
   - NOTE (environment): the `0.0.1-beta.10` tag was republished within the last 24h, so Deno's
     default minimum-dependency-age wall blocks the bare
     `deno x -A jsr:@netscript/mcp@0.0.1-beta.10/cli` today; `deno x` did not honor
     `--minimum-dependency-age`/deno.json/env in 2.9.3 (known upstream exposure, tracked separately
     as #818), `deno run -A --minimum-dependency-age 0 <same specifier>` works and is
     protocol-identical. Once the 24h wall lapses the printed `deno x` form works as-is; README
     keeps the `@<version>` placeholder form.
2. **tools/call** on the shipped server:
   - `search_docs {"query":"telemetry"}` →
     `{"count":1,"matches":[{"slug":"mcp","title":"@netscript/mcp","snippet":"…framework-semantic telemetry…","score":35}]}`
     (default embedded corpus = the shipped package README under slug `mcp`).
   - `get_app_status {}` with no app running → structured
     `{"status":"warn","counts":{"resources":0,...}}` — confirmed warn-not-crash behavior.
3. **`deno doc jsr:@netscript/mcp@0.0.1-beta.10`** and `.../cli` — full export lists captured
   (scratchpad `mcp-run/doc-main.txt`, `doc-cli.txt`). Confirmed: `createToolRegistry(flows)` takes
   a `flows` argument; `./cli` adds `createMcpCliServer`, `runMcpStdioServer`, `resolveDocsRoot`,
   `McpCliOptions`.
4. **`netscript agent init`** (as
   `deno run -A --minimum-dependency-age 0 jsr:@netscript/cli@0.0.1-beta.10 agent init`) in a clean
   scratch dir → `Installed NetScript agent integration for claude, vscode.` Wrote `.mcp.json`,
   `.vscode/mcp.json`, `AGENTS.md`, `.claude/skills/netscript{,-build,-operate}`. `.mcp.json` pins
   `jsr:@netscript/cli@0.0.1-beta.10` and passes `agent mcp --project-root <abs path>`.
5. **Help surfaces**: `agent --help` (subcommands mcp, init), `agent mcp --help` (flags:
   `--endpoint <url>`, `--project-root <path>`, `--docs-root <path>`), `agent init --help`
   (`--host claude|vscode|all`).
6. **Per-tool input contracts** extracted from the live `tools/list` inputSchema/outputSchema (see
   contracts table below, used for the docs-site coverage fix).

Input contracts (`*` = required): get_app_status(service,limit) ·
list_runs(domain,status,service,sinceUnixMs,limit) · get_run(id*) ·
get_recent_errors(service,domain,sinceUnixMs,limit) ·
get_last_job_result(jobId,jobName,service,sinceUnixMs) ·
analyze_service_performance(service*,sinceUnixMs,limit) ·
analyze_db_bottlenecks(service,sinceUnixMs,limit) · doctor(endpoint) · search_docs(query*,limit) ·
list_docs(limit) · get_doc(slug*,section) · list_commands(filter,limit) ·
execute_command(command*,args).

## Docs-coverage audit findings (gaps → closed in this changeset)

| # | Gap                                                                                                                                                                                                                                                      | Where                      | Fix                                                                            |
| - | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------ |
| 1 | `docs/site/reference/mcp/index.md` command-policy paragraph is WRONG vs shipped `DEFAULT_COMMAND_POLICY`: says `plugin add\|list\|sync\|doctor` (actual: `plugin install`), `service list\|status` (actual: `service list` only), omits `ui:remove` deny | reference/mcp              | corrected to source truth (`packages/mcp/src/domain/command-policy.ts`)        |
| 2 | No per-tool input/output contract table anywhere on the site (issue requires "all 13 tools with input/output contracts and truncation semantics")                                                                                                        | reference/mcp              | added contracts table from live tools/list schemas + truncation semantics note |
| 3 | `agent mcp` flags `--project-root` and `--docs-root` undocumented on site (only `--endpoint` discovery mentioned)                                                                                                                                        | capabilities/agent-tooling | added flags table (verified from `agent mcp --help`)                           |
| 4 | Docs-corpus default (embedded package README, slug `mcp`) + `--docs-root`/`NETSCRIPT_DOCS_ROOT` override + `docs_corpus_not_found` behavior undocumented on site                                                                                         | capabilities/agent-tooling | added "Documentation corpus" section                                           |
| 5 | No troubleshooting/doctor-interpretation guidance on site (families, pass/warn/fail, common remediations)                                                                                                                                                | capabilities/agent-tooling | added "Troubleshooting" section                                                |

`agent init` per-host behavior: already covered (capabilities/agent-tooling host table) — verified
accurate against executed run (files written match; skills dir observed as
`.claude/skills/netscript*`).

## README rewrite

Old README was accurate but implementation-voiced and carried internal vocabulary ("Archetype 6
(CLI/Tooling)", "layered domain → application → infrastructure", `src/` layout talk). Rewritten per
#814: 3-sentence agent-capability hook, positioning paragraph, benefit-first flagship bullets,
mermaid architecture diagram (host ↔ stdio ↔ agent mcp ↔ telemetry/docs/CLI-gate ↔ app), compact
13-tool table + two exports, two executed examples (agent init flow; transcript-style ask), Docs
delegation section, tagline ≤250 bytes kept, `@<version>` pinning conventions kept, zero internal
vocabulary.

## Gate log

(filled as gates run — see PR comments)

## Gate log (final)

- docs:links — OK (docs=98, broken-links=0, broken-anchors=0)
- docs:readme:check — packages/mcp/README.md clean (pre-existing failures in other packages
  untouched; owned by #815)
- docs:tagline:check — OK (checked=36, over=0)
- run-deno-check --root packages/mcp — 0 findings; fmt:check clean; edited .md files deno-fmt'ed
- mermaid diagram — mermaid.ink render 200
- internal-wording grep (eis-chat/VIF/CSB/harness/archetype/doctrine/PR numbers) over changeset —
  zero hits ("doctrine" occurrence removed → "playbook")
- external links curl 200: reference/mcp, capabilities/agent-tooling, jsr.io/@netscript/mcp{,/doc}

## PR

Draft PR #858 https://github.com/rickylabs/netscript/pull/858 — Closes #814, labels
type:docs/area:docs/wave:v1/priority:p1/status:impl, milestone 0.0.1-beta.11. Gate-evidence comment
posted per slice. OpenHands docs accuracy eval auto-triggers on the docs label; Sol changeset audit
is supervisor-triggered.

## Fix cycle 1 (post Sol audit FAIL, commit 81eb5c2a) — same generator session resumed

Executed all 8 fixes from `audit.md`:

1. **F1** — `deno add jsr:@netscript/mcp` → `deno add jsr:@netscript/mcp@<version>` (README,
   placeholder + existing pinning note); bare `deno doc jsr:@netscript/mcp` → `@<version>` in README
   and `{{ releaseSpecifier }}` (vento) on the reference page.
2. **F2** — telemetry-unreachable wording scoped per tool shape in README example section and
   agent-tooling troubleshooting: `get_app_status` → `status:"warn"`; list/analytics tools →
   ordinary empty/zero results; `get_run` → structured `run_not_found` (matches auditor's live
   evidence and my own executed `get_app_status` warn result).
3. **F3** — categorical "destructive verbs are never reachable" removed; README bullet + config
   bullet now state the exact allow/deny prefixes from `DEFAULT_COMMAND_POLICY`; `execute_command`
   table row now describes the real success fields (exit code, duration, bounded output tail) with
   structured denial when blocked. Intro "safe CLI commands" → "allowlisted CLI commands".
4. **F4** — "full input/output contracts"/"all 13 tool contracts" relabeled everywhere as top-level
   field overview; reference page section renamed "Per-tool field overview" with explicit
   not-the-complete-contract framing pointing at `TOOL_INPUT_SCHEMAS`/`TOOL_OUTPUT_SCHEMAS`/live
   `tools/list`.
5. **F5** — doctor wording now: every check has a status; warnings/failures may include a suggested
   fix (matches `DoctorCheck.fix?: string`). README doctor row adjusted accordingly.
6. **F6** — "ship together at one version" claim removed; replaced with what agent init actually
   does (pins CLI version in host config, installs skills from the same release). "version-matched
   skills" phrasing softened. (Live beta.10 server self-identifies `serverInfo.version` beta.9 —
   hard-coded in shipped source; docs no longer imply identity.)
7. **P1** — this worklog committed on the branch (previously written only to the supervisor repo run
   dir; now restored here).
8. Regenerated `publish-assets.generated.ts`; re-ran gates (see Gate log 2 below).

## Gate log 2 (post-fix)

- docs:links — OK (docs=98, 0 broken); built-site check:links — 24,879 links / 174 pages all resolve
- Lume site build — 528 files, exit 0; rendered reference page shows
  `deno doc jsr:@netscript/mcp@0.0.1-beta.10` (releaseSpecifier substitution verified)
- check:publish-assets — PASS (embedded README byte-identical after regen)
- scoped check-readme-standard packages/mcp/README.md — OK (1 conform)
- docs:tagline:check — OK (36 checked, 0 over)
- check-netscript-jsr-specifiers — 2156 scanned, 0 failures
- internal-wording grep over added lines — zero hits
