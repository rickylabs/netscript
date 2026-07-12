use harness

# Slice brief — #290: plugins/ai --mcp / skill scaffolder + e2e variant

## SKILL
Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-cli/SKILL.md`,
`.agents/skills/netscript-doctrine/SKILL.md`, `.agents/skills/netscript-tools/SKILL.md`.

## Identity + ground rules
- WSL Codex implementation agent under the beta-8 orchestrator (`4d300496`). Do NOT open PRs.
  PLAN-EVAL owner-waived (carried drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-b8-290`, branch `feat/290-ai-mcp-scaffolder`.
- **Every file operation uses absolute paths inside `/home/codex/repos/ns-b8-290`.**
- Base preflight: `git -C /home/codex/repos/ns-b8-290 rev-parse HEAD` must start `51112a77`
  (this base INCLUDES the just-merged #246 `@netscript/ai/skills` SkillLoaderPort — your dep).
- Push: `git -C /home/codex/repos/ns-b8-290 push origin HEAD:refs/heads/feat/290-ai-mcp-scaffolder`.
- Worklog at `/home/codex/repos/ns-b8-290/.llm/runs/feat-290-mcp-scaffolder--codex/worklog.md`.

## Task (issue #290 — read it FULLY; Scope/Out-of-scope are the contract)
The core `plugin add ai` scaffold (#260) is long shipped; this is the deferred opt-in `--mcp` path:
- `plugins/ai/src/scaffolding/`: `--mcp` conditional `ItemScaffolder` emitting a
  `SkillLoaderPort`-consuming MCP tool stub (consume `@netscript/ai/skills` from #246 — study its
  real exported surface first with `deno doc`).
- The `scaffold.runtime` e2e VARIANT that adds `ai` with `--mcp` and type-checks the generated
  workspace — follow how existing e2e variants are defined (see `deno task e2e:cli suites` /
  the e2e-cli suite sources; `--persist-threads` variant is the model).
- Default `plugin add ai` behavior unchanged.

## Validation (evidence in worklog)
- Scoped check/lint on `plugins/ai` (+ e2e tooling touched).
- Plugin scaffolder unit tests (flag off = unchanged, flag on = emits stub that type-checks).
- Run the plugin-scaffold-level e2e that covers your variant WITHOUT the full runtime suite (e.g.
  `deno task e2e:cli gates scaffold.plugins` or the closest targeted command; record it). Do NOT
  run full scaffold.runtime — PR CI owns that.

## Done means
Scaffolder + e2e variant + tests committed and pushed, worklog committed. Report "DONE" or "BLOCKED: <why>".
