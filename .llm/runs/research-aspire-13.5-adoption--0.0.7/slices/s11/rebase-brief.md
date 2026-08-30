Supervisor steering (same conversation, S11 #1723 / PR #1771) — CONVERGENCE REBASE, then re-run
gates. The Aspire stack was rebased onto main 3e5cbabf (D-54); your base S10 moved from c61b1626 to
a46ea16d. Rebase your branch docs/aspire-13-5-s11-public-docs-refresh in
/home/agent/projects/netscript/worktrees/007-aspire-s11: `git rebase --onto a46ea16d c61b1626` (6
commits). Expected conflicts and how to resolve them:

1. docs/site/explanation/aspire.md — one line: main (#1748, shipped) reads "carry from Aspire's .NET
   AppHost:"; keep MAIN's wording (do not revert merged prose), keep all your other edits.
2. docs/site/reference/ai/skills.md — main (#1746/#1755, shipped) changed the bundle paragraph to
   say the companion playbook is `.agents/skills/help.md` and that Claude Code receives the same
   playbook in the derived mirror. Keep main's facts verbatim (canonical `.agents/skills/help.md`,
   derived mirror sentence, idempotent `netscript agent init`), then re-add your two additions AFTER
   it: (a) upstream workflow skills installed beside NetScript's `aspire` skill by explicit name
   (aspire-init, aspire-orchestration, aspire-monitoring, aspire-deployment), never overwriting
   `aspire/SKILL.md` (OF-1 (a)); (b) the ratified 14-tool MCP baseline — list EXACTLY these names:
   list_resources, list_console_logs, list_structured_logs, list_traces, list_trace_structured_logs,
   execute_resource_command, list_apphosts, select_apphost, list_integrations, list_docs,
   search_docs, get_doc, doctor, refresh_tools; `get_integration_docs` is documented upstream but
   unobserved at 13.5.3 (informational). Your current text names `describe_resource`, which is NOT
   an Aspire MCP tool — remove it. Do not write `.claude/skills/help.md` as the canonical path.
3. Any generated carrier conflict (packages/cli/src/kernel/assets/_.generated.ts,
   packages/mcp/src/publish-assets.generated.ts, .llm/assets/agent-docs/_): never hand-merge — take
   the incoming side, then run `deno task gen:agent-docs-prose`, `deno task gen:publish-assets`,
   `deno task gen:assets-barrel` and stage the regenerated files. After the replay: re-run
   `deno task check:agent-docs-prose`, `check:publish-assets`, `check:assets-barrel`,
   `diagrams:check`, `docs:links`, and the Lume build from docs/site; grep the touched pages for
   "describe_resource" (must be 0) and ".NET Aspire" (no regression). Keep aspire ps [] and docker
   ps -a empty; no AppHost. Push with
   `git push origin HEAD:refs/heads/docs/aspire-13-5-s11-public-docs-refresh --force-with-lease=refs/heads/docs/aspire-13-5-s11-public-docs-refresh:93713837`
   (rewrite of your own draft branch after its base moved), post
   `## [PHASE: IMPL] S11 convergence rebase onto S10' a46ea16d` on PR #1771 with the two prose
   resolutions stated, update your run dir, and end with the exact final line `DONE` or
   `BLOCKED: <reason>`.
