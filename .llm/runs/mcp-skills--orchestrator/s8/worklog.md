# S8 — public NetScript skill bundle (worklog)

Authored consumer-facing skill bundle under new top-level `skills/`:

- `skills/netscript/SKILL.md` — router (USE FOR / DO NOT USE FOR / INVOKES; routing table to the
  two workflow skills; "not useful alone"; CLI-preferred vs MCP rule; aspire/Deno hand-offs).
- `skills/netscript-operate/SKILL.md` — monitoring / debugging / trace-intelligence. Task→tool
  table uses the real MCP tool names from the registry. Playbooks: healthy?, job-failed,
  service-slow, start-with-doctor. Token-discipline + docs funnel rules.
- `skills/netscript-build/SKILL.md` — scaffold/build wrapping real CLI verbs (init, contract,
  db lifecycle, plugin, service, generate, ui:init/ui:add). Contract-first + plugin lifecycle
  workflows; generated-registry/lock-file safety rules.
- `skills/manifest.json` — name/version/skills/files.

Tool names verified against `packages/mcp/src/application/tool-registry.ts`; CLI verbs verified
against `packages/cli/src/public/features/root/public-command-tree.ts` and each command group.

## Grep gate

Command:
`grep -rInE "eis|VIF|CSB|PR #|dogfood|harness|OpenHands|Codex|Tier-|worktree" skills/`
Result: no matches (exit 1) — CLEAN.

Extra `#[0-9]+` (issue/PR numbers) scan over skills/: no matches (exit 1) — CLEAN.
