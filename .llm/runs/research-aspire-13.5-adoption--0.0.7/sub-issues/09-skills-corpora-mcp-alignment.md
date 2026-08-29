# [aspire-13-5 S9] Skills, corpora, and Aspire MCP alignment — with an exact-13.5 MCP smoke receipt

> DRAFT TEXT ONLY. Labels: `type:fix`, `epic:aspire-13-5`, `area:cli`, `area:agentic`, `area:docs`,
> `priority:p1`, `status:triage`. Milestone: `0.0.7`. Depends on S1 (pinned CLI), S2 (runtime
> evidence), and #1675 (skill install locations). Owner fork OF-1 must be answered. Coordinator
> correction (2026-08-29): this slice must **prove** the Aspire MCP 13.5 upgrade behaviour, not only
> rewrite prose/config.

## Summary

Bring every shipped/internal agent artifact that mentions Aspire to 13.5 truth through its
generator, and land a cheap, structured **Aspire MCP smoke** that proves the upgraded server and the
generated client configuration agree.

## Part A — MCP smoke receipt (the proof)

Baseline: `receipts/aspire-13.4.6-mcp-baseline.json` (captured 2026-08-29 from the session's 13.4.6
server: 14 tools, `get_integration_docs` absent, `refresh_tools` present).

Add `packages/cli/e2e/src/application/gates/scaffold/aspire-mcp-smoke.ts` (gate id
`AGENT_ASPIRE_MCP_SMOKE = 'agent.aspire-mcp-smoke'` in `cli-surface.ts`) that, against a scaffold
produced by the pinned CLI (S1) inside the `scaffold.runtime` suite (so S2's running, isolated
AppHost is available):

1. **Entry point**: read the generated `.mcp.json` (from `netscript agent init --host claude`) and
   assert `mcpServers.aspire == { command: "aspire", args: ["agent","mcp"] }` — then **launch that
   exact command** (stdio MCP client, `initialize` → `tools/list`), not a hard-coded one.
2. **Server identity**: `initialize` result `serverInfo.version` (or `aspire --version`) equals
   `SCAFFOLD_VERSIONS.ASPIRE_SDK` major.minor.patch (13.5.3) — ties the receipt to S1.
3. **Tool surface**: `tools/list` contains at least
   `list_resources, list_console_logs, list_structured_logs, list_traces, list_trace_structured_logs,
   execute_resource_command, list_apphosts, select_apphost, list_integrations, get_integration_docs,
   list_docs, search_docs, get_doc, doctor, refresh_tools`
   (15). Record the full observed list; any extra tool is `info`, any missing expected tool is
   `fail`.
4. **Doctor**: call `doctor`; assert `checks[] ∋ {name:"cli-version", status:"pass"}` (13.5.3 is
   current) and persist the JSON.
5. **AppHost scope**: `list_apphosts` in-scope contains the suite's AppHost path.
6. **Visibility**: `list_resources` includes every user-facing resource the suite waits on and
   **excludes** every resource the generator marks `excludeFromMcp()` (S8's db-cli-mode helper
   resources; if none are marked yet, assert the count equals `aspire describe` minus hidden
   resources and record `excludeFromMcp: not-applicable`).
7. **Dashboard-only mode** (optional, `info`):
   `aspire agent mcp --dashboard-url <url from
   .netscript/e2e/aspire-start.json>` lists exactly
   the three telemetry tools.

Receipt: `.llm/tmp/gate-receipts/<job>/agent.aspire-mcp-smoke.json` via
`.llm/tools/gates/run-gate.ts`, schema:

```json
{
  "receipt": "aspire-mcp-smoke",
  "cliVersion": "13.5.3",
  "scaffoldPin": "13.5.3",
  "entryPoint": { "source": ".mcp.json", "command": "aspire", "args": ["agent", "mcp"] },
  "serverInfo": { "name": "…", "version": "…" },
  "toolsExpected": ["…15…"],
  "toolsObserved": ["…"],
  "toolsMissing": [],
  "toolsExtra": [],
  "doctor": { "cliVersion": "pass", "summary": { "passed": 0, "warnings": 0, "failed": 0 } },
  "appHostInScope": true,
  "resourceVisibility": { "expectedVisible": ["…"], "expectedHidden": ["…"], "ok": true },
  "dashboardOnlyTools": ["list_structured_logs", "list_traces", "list_trace_structured_logs"],
  "capturedAt": "ISO-8601"
}
```

A copy of the first green receipt is committed to the epic run dir as
`receipts/aspire-13.5-mcp-smoke.json` next to the 13.4.6 baseline.

## Part B — artifacts brought to 13.5 truth (through generators only)

1. `skills/aspire/SKILL.md`: "verified against 13.4.6" → 13.5.3 with S2 receipts; MCP tool table =
   Part A's observed list (adds `get_integration_docs`, `refresh_tools`); process-name note uses the
   argv observed in Part A (`aspire agent mcp`); `aspire resources` documented as alias of
   `describe`; `aspire stop --force`; orphan auto-cleanup; exit-12 section per S2 V4;
   `aspire docs api search
   … --language typescript`. `skills/help.md:7,50` markers.
2. `.agents/skills/aspire/SKILL.md` derived from `skills/aspire/SKILL.md` (OF-1a) via
   `agentic:sync-claude` (or a new `agentic:sync-consumer-skills`); `.claude/skills/aspire` mirrors
   it.
3. `netscript agent init`:
   `aspire agent init --non-interactive --skills aspire-init,aspire-orchestration,aspire-monitoring,aspire-deployment --skill-locations <selected>`
   (explicit list, never `aspire`/`all`); test asserts `aspire/SKILL.md` hash unchanged after init;
   emit `excludeFromMcp()` for db-cli-mode helper resources (with S8).
4. Regenerate: `gen:assets-barrel`, `agentic:sync-claude`, `agentic:dogfood-skills` (fix stale
   absolute paths / `jsr:@netscript/cli@0.0.2` / missing `aspire` server in
   `.agents/generated/consumer-skills/`), `gen:mcp-export-corpus`, `gen:publish-assets`; add
   `agentic:dogfood-skills:check` or record why the dogfood bundle stays ungated.
5. `init-agent.ts:29` AGENTS.md block: `aspire otel logs|spans|traces`,
   `aspire doctor --format Json`, the upstream workflow skills.

## Archival exemptions (do not touch)

`packages/cli/src/public/features/agent/init/fixtures/prior-release.mcp.json` (tests migration from
a release without the `aspire` entry), `.agents/generated/**` history in `.llm/runs/**`, and every
path in `stale-surface-inventory.md` §"Archival exemption list".

## Boundaries

No public docs prose (S11). No change to supported hosts. Skill edits are behaviour-cited (S2/S9
receipts), not copied from upstream skills.

## Acceptance

- [ ] `agent.aspire-mcp-smoke` gate green in `scaffold.runtime` on both CI tiers; receipt present
      with `toolsMissing: []`, `doctor.cliVersion: "pass"`, `entryPoint.source: ".mcp.json"`,
      `cliVersion == scaffoldPin`.
- [ ] `receipts/aspire-13.5-mcp-smoke.json` committed in the epic run dir; diff vs the 13.4.6
      baseline shows exactly `+get_integration_docs`.
- [ ] `rtk grep -rn '13\.4\.6' skills .agents/skills .claude/skills packages/cli/src/kernel/assets`
      → 0 hits.
- [ ] `check:assets-barrel`, `agentic:sync-claude:check`, `agentic:check-claude`,
      `check:mcp-export-corpus`, `check:publish-assets` green.
- [ ] `netscript agent init --host claude` on a scaffold: `.mcp.json` has `netscript` + `aspire`;
      `.agents/skills/` has NetScript `aspire` + the four upstream workflow skills; hash test green.
- [ ] `docs_audit` (Codex Sol) single pass over the skill prose recorded in the PR.

## Tests / gates

New smoke gate; agent-init tests; barrel/corpus drift gates; `scaffold.runtime`; docs_audit lane.

## Docs / static asset regeneration

Item B4 — this slice _is_ the regeneration chain; no hand-edited mirrors.

## Related

Part of #<epic>. Depends on S1, S2, #1675. Related: #1026, #1048, #1197, #1668/#1691, #1672, #1674.
