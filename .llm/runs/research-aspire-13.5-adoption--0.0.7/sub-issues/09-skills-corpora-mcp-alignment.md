# [aspire-13-5 S9] Skills, corpora, and Aspire MCP alignment

> DRAFT TEXT ONLY. Labels: `type:fix`, `epic:aspire-13-5`, `area:cli`, `area:agentic`, `area:docs`,
> `priority:p1`, `status:triage`. Milestone: `0.0.7`. Depends on #1675 (skill install locations) —
> land #1675 first or in the same train. Owner fork OF-1 must be answered.

## Summary

Bring every shipped/internal agent artifact that mentions Aspire to 13.5 truth, through its
generator:

1. `skills/aspire/SKILL.md` (shipped): replace "verified against 13.4.6" with 13.5.3 and the S2
   receipts; update the MCP tool table (`get_integration_docs`, `refresh_tools`); `aspire resources`
   is a documented alias of `describe`; `aspire stop --force`; orphan auto-cleanup; exit-12 section
   per S2 V4 outcome; `aspire docs api search … --language typescript`. `skills/help.md:7` marker.
2. `.agents/skills/aspire/SKILL.md` becomes **derived from** `skills/aspire/SKILL.md` (OF-1a):
   generator step in `.llm/tools/agentic/claude/sync-claude-skills.ts` or a new
   `agentic:sync-consumer-skills` task; `.claude/skills/aspire` continues to mirror it.
3. `netscript agent init` (`init-agent.ts`, `deno-aspire-agent-initializer.ts`): call
   `aspire agent init --non-interactive --skills aspire-init,aspire-orchestration,aspire-monitoring,aspire-deployment --skill-locations <selected>`
   (explicit list; **never** `aspire`/`all`) so NetScript's `aspire` skill is not overwritten; test
   asserts the `aspire/SKILL.md` hash is unchanged after init. Add `excludeFromMcp()` emission for
   the db-cli-mode helper resources (S8) so agents do not see internal tooling in `list_resources`.
4. Regenerate every derived corpus: `gen:assets-barrel` (skills + agent-tools + embedded),
   `agentic:sync-claude`, `agentic:dogfood-skills` (fix the stale absolute paths /
   `jsr:@netscript/cli@0.0.2` / missing `aspire` MCP entry in `.agents/generated/consumer-skills/`),
   `gen:mcp-export-corpus`, `gen:publish-assets`.
5. `packages/cli/src/public/features/agent/init/init-agent.ts:29` AGENTS.md block: mention
   `aspire otel logs|spans|traces`, `aspire doctor --format Json`, and the workflow skills.

## Boundaries

No public docs prose (S11). No change to which agents/hosts are supported. `skills/` text edits must
be behaviour-cited (S2 receipts), not rewritten from the upstream skills.

## Acceptance

- [ ] `rtk grep -rn '13\.4\.6' skills .agents/skills .claude/skills packages/cli/src/kernel/assets`
      → 0 hits.
- [ ] `check:assets-barrel`, `agentic:sync-claude:check`, `agentic:check-claude`,
      `check:mcp-export-corpus`, `check:publish-assets` all green.
- [ ] `netscript agent init --host claude` on a scaffold: `.mcp.json` has `netscript` + `aspire`
      servers; `.agents/skills/` contains NetScript `aspire` + the four upstream workflow skills;
      hash test green.
- [ ] `docs_audit` (Codex Sol) single pass over the skill prose recorded in the PR.

## Tests / gates

Agent-init tests; barrel/corpus drift gates; `scaffold.plugins`; docs_audit lane.

## Docs / static asset regeneration

All listed in item 4 — this slice _is_ the regeneration chain; no hand-edited mirrors.

## Related

Part of #<epic>. Depends on S2, #1675. Related: #1026, #1048, #1197, #1668/#1691, #1672, #1674.
