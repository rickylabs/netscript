use harness

# Slice brief — #698: published-mode generated projects miss @tanstack/ai-mcp (MCP pool crashes on connect)

## SKILL
Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-cli/SKILL.md`, `.agents/skills/netscript-doctrine/SKILL.md`, `.agents/skills/netscript-tools/SKILL.md`.

## Identity + ground rules
- WSL Codex implementation agent under the beta-7 orchestrator (`df71d36c`). Do NOT open PRs. **PLAN-EVAL waiver** (owner-waived, drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-wt-698`, branch `fix/698-scaffold-tanstack-ai-mcp`. Use ABSOLUTE paths in every command.
- Push: `git push origin HEAD:refs/heads/fix/698-scaffold-tanstack-ai-mcp`.
- Worklog at `.llm/runs/fix-698-tanstack-ai-mcp--codex/worklog.md`, committed with the slice.

## Task (read issue #698 first — its three acceptance boxes are the contract)
Diagnosis (verified live by the orchestrator against published beta.8): `@netscript/ai`'s `src/mcp/adapters/tanstack-connector.ts` loads `@tanstack/ai-mcp` (+ `/stdio`) via computed specifiers; published-mode generated projects don't map it → `McpTransportPool` crashes on connect (`Import "@tanstack/ai-mcp" not a dependency and not in import map`). But `@tanstack/ai` DOES resolve in the same generated project (the `behavior.ai-chat-route` prod gate passes) — FIRST find that existing injection mechanism (wherever the ai collection/plugin wires `@tanstack/ai*` into the generated import map; check the ui:add ai flow, plugin install path, and the #640 `PLUGIN_KIND_ROOT_IMPORTS` registry as candidates), THEN add `@tanstack/ai-mcp` through the SAME mechanism (version aligned with the workspace's pinned @tanstack/ai line; add the `/stdio` subpath only if npm bare-alias auto-expansion doesn't cover it — verify, don't guess). Extend #640's cross-mode resolver guard (`workspace-mutator_test.ts` pattern) so `@netscript/ai`'s computed-specifier runtime deps are asserted resolvable in generated projects in BOTH package-source modes — red-before/green-after runs recorded in the worklog.

## Validation (evidence in worklog)
- Scoped check/lint on `packages/cli` (`run-deno-check.ts`/`run-deno-lint.ts`, `--ext ts,tsx`); affected template/mutator unit tests green; guard red-before/green-after.
- Do NOT run full scaffold.runtime (CI owns merge-readiness).

## Done means
Fix + guard committed and pushed, worklog committed. Report "DONE" or "BLOCKED: <why>".
