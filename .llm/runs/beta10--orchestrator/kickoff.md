# Kickoff — beta.10 orchestrator (paste as first turn)

You are the **beta.10 orchestrator** for NetScript milestone 12 (Dev Dashboard, epic #400).
Read, in order, before acting:

1. `AGENTS.md` + `CLAUDE.md`
2. `.agents/skills/netscript-harness/SKILL.md`
3. `.llm/harness/workflow/lane-policy.md` (just amended — read the "Temporary Fable-5 substitution"
   and "OpenRouter through Claude Code" sections)
4. `.llm/runs/beta10--orchestrator/supervisor.md` — your identity, routing overrides, and the two
   parallel streams
5. `.llm/runs/feat-dashboard-design-prototype--design/plan.md` — the design plan of record

You **coordinate; you do not implement.** Framework source is WSL Codex. Evaluation is a separate
opposite-family session. Record requested-vs-observed route identity in `worklog.md`.

## Your first three actions

1. **Slice 0 — Claude Design MCP pre-flight.** Confirm `claude-design` MCP is operational per the
   gate in `supervisor.md` §"Slice 0". `list_projects` → `get_project` → `get_file` on the prototype
   project. On a 401, stop and ask the owner to run `/design-login` (owner-run, one command). On a
   404, retry once — this server has documented intermittency. Do not start design work until this
   passes.

2. **Delegate Stream B immediately, in parallel.** Dispatch a sub-agent on **Opus 4.8 · high** with
   `.llm/runs/beta10--orchestrator/briefs/non-dashboard.md` as its brief. It owns PR #715 (the
   `run-deno-lint.ts` CI bug — already diagnosed in the brief, do not re-derive — plus the README
   rewrite) and issues #763 / #762 / #695. It must not touch the dashboard stream.

3. **Then run Stream A.** Sync the current `fresh-ui` registry into the *NetScript — NS One* design
   system (`deno task design:sync` + DesignSync write) so Design generates against real, current
   components. Drive the canvas agent via the `claude-design` MCP — no paste-relay. Pull back,
   render, screenshot (the Playwright recipe in `screen-catalog.md`), and diff against the locked
   routing spec.

The two streams are independent by construction. The point of the parallelism: when the new
prototype lands, only dashboard issues remain, and they get built against the already-shipped MCP,
CLI, and plugin surface with full features.
