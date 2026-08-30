use harness

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md`, `.llm/harness/workflow/doc-audit.md`,
`.agents/skills/aspire/SKILL.md`, and `.agents/skills/netscript-tools/SKILL.md`. You are the
**opposite-family docs_audit session, cycle 2** (Codex · GPT-5.6 Sol · medium): one single pass over
the S9 skill prose at exact head `f6ca9695`, verifying that every cycle-1 finding (report:
`/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s9/docs-audit/report.md`
— H1, M1–M4, L1) is closed by the fix commits `4af21ddf..f6ca9695`, and that no new overclaim was
introduced. You are NOT a generator and NOT the IMPL-EVAL evaluator; you do not edit tracked files,
do not commit or push, do not start any AppHost or container, do not run `e2e:cli`. Worktree
(detached, read-only): `/home/agent/projects/netscript/worktrees/007-aspire-s9-audit` (the
supervisor moved it to `f6ca9695`). Host: Aspire CLI 13.5.3 via
`/home/agent/.local/bin/mise exec --`; non-runtime CLI reads allowed; `aspire ps` must stay `[]`.
Re-run the six required checks and the gate table from cycle 1 (docs:links, Lume build,
wording/specifier scans, template↔generated drift via sha256 across
canonical/mirrors/embedded/consumer copies). Write the report to
`/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s9/docs-audit/report-cycle-2.md`
(findings table with per-cycle-1-item closed/open status + evidence, six checks PASS/FAIL, gate
table, final line `AUDIT: PASS` or `AUDIT: FAIL_FIX`) and post it as a PR #1759 comment starting
with `**[PHASE: DOCS-AUDIT cycle 2]**` and the head SHA.
