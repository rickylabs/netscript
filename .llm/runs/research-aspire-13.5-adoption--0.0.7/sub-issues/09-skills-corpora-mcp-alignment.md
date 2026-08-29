# [aspire-13-5 S9] Skills, corpora, and Aspire MCP alignment — with an exact-13.5.3 MCP smoke receipt

> DRAFT TEXT ONLY. Labels: `type:fix`, `epic:aspire-13-5`, `area:cli`, `area:agentic`, `area:docs`,
> `priority:p1`, `status:triage`. Milestone: `0.0.7`. Depends on **S1** (pinned CLI), **S2**
> (runtime evidence, isolated AppHost), **S8** (`excludeFromMcp()` emission — S8 is its sole owner),
> and **#1675** (skill install locations). Owner fork OF-1 must be answered. PLAN-EVAL F3 correction
> (2026-08-29): the receipt has no N/A escape and a locked process lifecycle.

## Summary

Bring every shipped/internal agent artifact that mentions Aspire to 13.5 truth through its
generator, and land a cheap, structured **Aspire MCP smoke** that proves the upgraded server and the
generated client configuration agree — including resource visibility.

## Part A — MCP smoke receipt (the proof)

Baseline: `receipts/aspire-13.4.6-mcp-baseline.json` (captured 2026-08-29 from the session's 13.4.6
server: 14 tools, `get_integration_docs` absent, `refresh_tools` present).

Gate `AGENT_ASPIRE_MCP_SMOKE = 'agent.aspire-mcp-smoke'`
(`packages/cli/e2e/src/domain/cli-surface.ts`), implemented in
`packages/cli/e2e/src/application/gates/scaffold/aspire-mcp-smoke.ts`, runs inside
`scaffold.runtime` **after** `runtime.aspire-start` and the wait gates (S2's isolated AppHost is up)
and **before** cleanup, on both CI tiers.

### Process lifecycle (locked)

| Item              | Contract                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry point       | Parse the scaffold's generated `.mcp.json` (written by `netscript agent init --host claude` inside the suite); assert `mcpServers.aspire` equals `{ "command": "aspire", "args": ["agent", "mcp"] }`; spawn **exactly** `command + args` from that file — never a hard-coded command.                                                                                                                                              |
| Spawn cwd         | The generated **project root** (directory containing `.mcp.json` and `aspire/`), so the suite's AppHost (`<root>/aspire/apphost.mts`) is in scope. `Deno.Command` with `stdin: 'piped'`, `stdout: 'piped'`, `stderr: 'piped'`, `--allow-run=aspire`.                                                                                                                                                                               |
| Environment       | Inherit `PATH` (pinned CLI from S1 first), `HOME`, `ASPIRE_*` from the job; **no** `ASPIRE_DASHBOARD_URL`/`--dashboard-url` (AppHost mode, not dashboard-only).                                                                                                                                                                                                                                                                    |
| AppHost selection | After `initialize`, call `list_apphosts`; assert the in-scope list contains the AppHost path from `.netscript/e2e/aspire-start.json` (`appHostPath`, realpath-compared); if more than one in-scope AppHost is reported, call `select_apphost` with that exact path before any resource tool call.                                                                                                                                  |
| Timeouts          | `initialize` ≤ 30 s; `tools/list` ≤ 10 s; each tool call ≤ 30 s; whole gate ≤ 120 s. Any timeout → `fail` with the partial receipt persisted.                                                                                                                                                                                                                                                                                      |
| Shutdown          | Close stdin; wait ≤ 10 s for exit; then `SIGTERM`; after 5 s more, `SIGKILL`. Record `exit.code`, `exit.signal`, `exit.graceful: boolean`. A non-graceful exit is `warning`, not `fail` (13.5 SIGTERM handling is part of what S2 measures).                                                                                                                                                                                       |
| Redaction         | Assert `list_resources` returns environment entries with `null` values for every parameter-backed secret (`<db>-password`); assert the literal value of the password parameter (read from the suite's own `appsettings`/parameter store) appears **nowhere** in the raw MCP transcript; the receipt stores the dashboard URL with its `?t=` token masked.                                                                          |
| Retention         | Receipt written through `.llm/tools/gates/run-gate.ts` to `.llm/tmp/gate-receipts/<job>/agent.aspire-mcp-smoke.json` and uploaded `if: always()` with the job's gate receipts; the raw JSON-RPC transcript (redacted) is kept beside it as `agent.aspire-mcp-smoke.transcript.jsonl` for 30 days (artifact retention); the first green receipt is committed verbatim to the epic run dir as `receipts/aspire-13.5-mcp-smoke.json`. |

### Assertions

1. **Server identity**: `initialize.result.serverInfo.version` **and** `aspire --version` (same
   `PATH`) both start with `SCAFFOLD_VERSIONS.ASPIRE_SDK` (`13.5.3`); mismatch → `fail`.
2. **Tool surface**: `tools/list` ⊇ the 15 expected 13.5 tools:
   `list_resources, list_console_logs, list_structured_logs, list_traces, list_trace_structured_logs,
   execute_resource_command, list_apphosts, select_apphost, list_integrations,
   get_integration_docs, list_docs, search_docs, get_doc, doctor, refresh_tools`.
   Missing → `fail`; extra → `info` (recorded). Diff vs the 13.4.6 baseline must be exactly
   `+get_integration_docs` (any other delta → `warning` for review).
3. **Doctor**: `doctor` → `checks[] ∋ { name: "cli-version", status: "pass" }` and
   `metadata.currentVersion` starts with `13.5.3`; persist the full JSON.
4. **AppHost scope**: as in the lifecycle table.
5. **Visibility (mandatory, no N/A)**: `list_resources` must include the named **visible** user
   resources `postgres` (or the tier's DB), the scaffold app, and the `users` example service; and
   must **not include** the named **MCP-excluded** helper resources emitted with `excludeFromMcp()`
   by S8 (`<db>-cli`); `list_console_logs { resourceName: "<db>-cli" }` must return the server's
   not-found/empty result. Existence cross-check (independent of MCP): default
   `aspire describe --format Json` **does** list `<db>-cli` — `excludeFromMcp()` controls MCP
   exposure only and the resource is not `withHidden()`. All three observations recorded.
6. **Console/telemetry reach**: `list_console_logs { resourceName: "users" }` returns ≥1 line;
   `list_structured_logs` returns without error (count `info`).
7. **Dashboard-only mode** (`info`): a second spawn of
   `aspire agent mcp --dashboard-url <masked url from aspire-start.json>` lists exactly
   `list_structured_logs, list_traces, list_trace_structured_logs`.

### Receipt schema (`agent.aspire-mcp-smoke.json`)

```json
{
  "receipt": "aspire-mcp-smoke",
  "capturedAt": "ISO-8601",
  "cliVersion": "13.5.3+…",
  "scaffoldPin": "13.5.3",
  "entryPoint": {
    "source": ".mcp.json",
    "command": "aspire",
    "args": ["agent", "mcp"],
    "cwd": "<project root>"
  },
  "serverInfo": { "name": "…", "version": "13.5.3…" },
  "appHost": { "path": "…/aspire/apphost.mts", "inScope": true, "selected": true },
  "toolsExpected": ["…15…"],
  "toolsObserved": ["…"],
  "toolsMissing": [],
  "toolsExtra": [],
  "baselineDiff": { "added": ["get_integration_docs"], "removed": [] },
  "doctor": {
    "cliVersion": "pass",
    "currentVersion": "13.5.3",
    "summary": { "passed": 0, "warnings": 0, "failed": 0 }
  },
  "visibility": {
    "expectedVisible": ["postgres", "app", "users"],
    "expectedMcpExcluded": ["postgres-cli"],
    "observedMcpVisible": ["…"],
    "observedMcpExcluded": ["…"],
    "describeListsExcluded": true,
    "ok": true
  },
  "redaction": { "secretParamsNull": true, "plaintextLeak": false },
  "lifecycle": {
    "initializeMs": 0,
    "toolsListMs": 0,
    "exit": { "code": 0, "signal": null, "graceful": true }
  },
  "dashboardOnlyTools": ["list_structured_logs", "list_traces", "list_trace_structured_logs"],
  "transcript": "agent.aspire-mcp-smoke.transcript.jsonl"
}
```

## Part B — artifacts brought to 13.5 truth (through generators only)

1. `skills/aspire/SKILL.md`: "verified against 13.4.6" → 13.5.3 citing S2 receipts; MCP tool table =
   Part A's observed list (adds `get_integration_docs`, `refresh_tools`); process-name note uses the
   argv observed in Part A (`aspire agent mcp`); `aspire resources` documented as alias of
   `describe`; `aspire stop --force`; orphan auto-cleanup; exit-12 section per S2 V4;
   `aspire docs api search … --language typescript`. `skills/help.md:7,50` markers.
2. `.agents/skills/aspire/SKILL.md` derived from `skills/aspire/SKILL.md` (OF-1a) via
   `agentic:sync-claude` (or new `agentic:sync-consumer-skills`); `.claude/skills/aspire` mirrors
   it.
3. `netscript agent init`:
   `aspire agent init --non-interactive --skills aspire-init,aspire-orchestration,aspire-monitoring,aspire-deployment --skill-locations <selected>`
   (explicit list, never `aspire`/`all`); test asserts `aspire/SKILL.md` hash unchanged after init.
4. Regenerate: `gen:assets-barrel`, `agentic:sync-claude`, `agentic:dogfood-skills` (fix stale
   absolute paths / `jsr:@netscript/cli@0.0.2` / missing `aspire` server in
   `.agents/generated/consumer-skills/`), `gen:mcp-export-corpus`, `gen:publish-assets`; add
   `agentic:dogfood-skills:check` or record why the dogfood bundle stays ungated.
5. `init-agent.ts:29` AGENTS.md block: `aspire otel logs`/`spans`/`traces`,
   `aspire doctor --format Json`, the upstream workflow skills.

## Archival exemptions (do not touch)

Rows with owner `archival` in `aspire-surface-manifest.tsv` (incl.
`agent/init/fixtures/prior-release.mcp.json`).

## Boundaries

No public docs prose (S11). No change to supported hosts. Skill edits are behaviour-cited (S2/S9
receipts), not copied from upstream skills. `excludeFromMcp()` emission belongs to S8 — S9 only
asserts it.

## Acceptance

- [ ] `agent.aspire-mcp-smoke` green in `scaffold.runtime` on both CI tiers; receipt has
      `toolsMissing: []`, `baselineDiff.added == ["get_integration_docs"]`,
      `doctor.cliVersion:
      "pass"`, `entryPoint.source: ".mcp.json"`, `serverInfo.version` and
      `cliVersion` starting with `scaffoldPin`, `visibility.ok: true` with non-empty
      `expectedMcpExcluded` and `describeListsExcluded: true`, `redaction.plaintextLeak: false`.
- [ ] `receipts/aspire-13.5-mcp-smoke.json` committed in the epic run dir.
- [ ] `git grep -n '13\.4\.6' -- skills .agents/skills .claude/skills packages/cli/src/kernel/assets`
      → 0 hits (parity phase 2 rows `skill:*`, `generated:barrel` become enforce-ready).
- [ ] `check:assets-barrel`, `agentic:sync-claude:check`, `agentic:check-claude`,
      `check:mcp-export-corpus`, `check:publish-assets` green.
- [ ] `netscript agent init --host claude` on a scaffold: `.mcp.json` has `netscript` + `aspire`;
      `.agents/skills/` has NetScript `aspire` + the four upstream workflow skills; hash test green.
- [ ] `docs_audit` (Codex Sol) single pass over the skill prose recorded in the PR.

## Rollback

Revert + `gen:assets-barrel` + `agentic:sync-claude` + `agentic:dogfood-skills`; the smoke gate is
removed with the PR (S8's MCP-excluded set stays excluded; nothing asserts it until re-landed).

## Tests / gates

New smoke gate; agent-init tests; barrel/corpus drift gates; `scaffold.runtime`; docs_audit lane.

## Docs / static asset regeneration

Item B4 — this slice _is_ the regeneration chain; no hand-edited mirrors.

## Related

Part of #<epic>. Depends on S1, S2, S8, #1675. Related: #1026, #1048, #1197, #1668/#1691, #1672,
#1674.
