use harness

# Slice S9 — docs page, READMEs, JSR audit, stdio e2e smoke

## SKILL

Read before coding: `.agents/skills/netscript-tools/SKILL.md`, `.agents/skills/jsr-audit/SKILL.md`,
`.agents/skills/netscript-cli/SKILL.md` (e2e suite layout), `.agents/skills/deno-fresh/SKILL.md`
only if Lume page needs it, `.agents/skills/rtk/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent. Worktree (ABSOLUTE, every file op):
  `/home/codex/repos/ns-combo-s9`. Branch: `feat/netscript-mcp-skills-s9-polish`.
- **Base verification preflight (mandatory, first)**:
  `git -C /home/codex/repos/ns-combo-s9 merge-base --is-ancestor cf55fe69 HEAD` must succeed and
  `/home/codex/repos/ns-combo-s9/packages/cli/src/public/features/agent/agent-group.ts` must
  exist. If not, STOP and report.
- **Harness provisioning**: authorized to provision run-dir artifacts at
  `/home/codex/repos/ns-combo-s9/.llm/runs/mcp-skills--orchestrator/s9/` (pattern: `s1/`–`s7/`),
  including separate-session PLAN-EVAL; escalate after two failures.
- GitHub issue: rickylabs/netscript#733 (epic #721, umbrella PR #715). Conventional commits
  referencing `#733` (no closing keyword).
- Lock hygiene: no new deps. PUBLIC-DOCS LAW for every docs/README/skill-adjacent string: run and
  record `grep -rInE "eis|VIF|CSB|PR #|dogfood" docs/site packages/mcp/README.md` → empty.
- Scope ONLY S9: docs page, READMEs, JSR audit evidence, e2e smoke. No new tools/behavior except
  what the smoke needs.

## Context

- Everything S1–S8 is merged on your branch: `packages/mcp` (13 tools), `packages/cli` `agent`
  group, `skills/` bundle. Design: `.llm/runs/mcp-skills--orchestrator/design.md`.
- Docs site: `docs/site/` (Lume; Diátaxis-ish folders). Look at an existing capabilities/
  reference page for front-matter + nav conventions before writing.
- E2E CLI suite layout: `packages/cli/e2e/` (see `.agents/skills/netscript-cli`). Add a CHEAP
  suite (no scaffold.runtime run).

## Deliverables

1. **Docs page** under `docs/site/` (place per existing information architecture — likely
   `capabilities/` or `reference/`; follow neighboring pages' front matter): "Agent tooling" —
   the combo (CLI × skills × MCP, one vocabulary), install via `netscript agent init` (what it
   writes per host), the 13-tool catalog table (name, what it collapses into one call, CLI twin
   where one exists), CLI-preferred guidance, token-efficiency notes (bounded outputs,
   search→get docs funnel), data boundary (telemetry + project metadata + docs; never source,
   env values, secrets), allowlist policy summary for `execute_command`. Public wording only.
2. **READMEs**: flesh `packages/mcp/README.md` (public API incl. S3–S7 additions: endpoint
   discovery chain, tool catalog, composition seams/ports, data boundary) and add an `## Agent
   tooling` section to `packages/cli/README.md` if one exists (check first).
3. **JSR audit**: run the repo's JSR audit path for `@netscript/mcp` (see jsr-audit skill /
   `deno task` list) + `deno task publish:dry-run` (workspace) — record results; fix trivial
   findings in-slice, record non-trivial ones as debt.
4. **Stdio e2e smoke**: a test (place in `packages/cli/e2e/` as a cheap suite, or
   `packages/cli/tests/` if the e2e harness is too heavy — decide from the suite layout and
   record) that: creates a temp project dir (minimal fixture, NOT a full scaffold), spawns the
   real `netscript agent mcp` composition (direct composition call acceptable if spawning the
   published binary is infeasible pre-publish — but prefer spawning `deno run` on the CLI bin
   with the agent mcp args), then over stdio: initialize → tools/list (assert 13) →
   `doctor` (structured result) → `search_docs` (against a fixture docs root) →
   `get_app_status` (unreachable telemetry → structured warn/error, not a crash) →
   `execute_command` with a denied verb (assert structured denial). Wire it as a deno task or
   e2e suite entry runnable standalone; document the invocation in the docs page if relevant.
5. **Umbrella evidence**: append to your worklog the full validation matrix for the FINAL tree:
   scoped check/lint/fmt for packages/mcp + touched cli files, all mcp+agent tests, arch:check,
   doc lint, publish dry-run, the smoke run output.

## Validation (run, paste real output into worklog)

As per deliverable 5. Also `deno task doc:lint --root packages/mcp --pretty` if the task exists.

## Definition of done

Deliverables + validations green with evidence in
`/home/codex/repos/ns-combo-s9/.llm/runs/mcp-skills--orchestrator/s9/worklog.md`; drift in
`s9/drift.md`. Small logical commits, then push:
`git -C /home/codex/repos/ns-combo-s9 push origin HEAD:refs/heads/feat/netscript-mcp-skills-s9-polish`.
Do NOT open a PR; do NOT merge — the supervisor reviews and merges into the umbrella.
