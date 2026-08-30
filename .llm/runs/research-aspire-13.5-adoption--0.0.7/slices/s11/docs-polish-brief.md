use harness

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md` and `.llm/harness/workflow/doc-audit.md` (the
`docs_polish` doctrine). You are the **final edit-only prose polish session** (Claude · Fable 5 ·
medium) for the S11 public-docs changeset at exact head `8149c7a4` on
`docs/aspire-13-5-s11-public-docs-refresh` (PR #1771), after the opposite-family docs_audit returned
`AUDIT: PASS` (report:
`/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s11/docs-audit/report.md`).
You are a separate session from the AGY generator, the supervisor, and the auditor.

## Rules (hard)

- **Edit-only, meaning-preserving:** wording, clarity, consistency, heading/list hygiene, link text,
  terminology consistency ("Aspire", never ".NET Aspire"; `aspire agent mcp`; the 14-tool baseline
  wording as audited). You add **no** new behavioural claim, remove no receipt citation, change no
  version number, code sample, command, flag, or path. If a sentence is wrong rather than
  unpolished, do not fix it — list it in your report for the supervisor.
- Scope: only files changed in `a46ea16d..8149c7a4` under `docs/`, `README.md`, `CONTRIBUTING.md`.
  Never touch `packages/`, `skills/`, `.agents/`, `.claude/`, generated carriers, or the run dirs.
  After edits run `deno task gen:agent-docs-prose` and `deno task gen:publish-assets` (regenerated
  carriers are the only non-doc files you may stage), then `deno task check:agent-docs-prose`,
  `check:publish-assets`, `docs:links`, and the Lume build from `docs/site`.
- Worktree: `/home/agent/projects/netscript/worktrees/007-aspire-s11` (the branch itself; base must
  remain `a46ea16d`). Commit as `docs(aspire): polish S11 prose (docs_polish)`, push with
  `git push origin HEAD:refs/heads/docs/aspire-13-5-s11-public-docs-refresh` (no force), post
  `## [PHASE: DOCS-POLISH]` on PR #1771 with a short table of the kinds of edits and the count of
  files, and write
  `/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s11/docs-polish.md`
  (what you changed, what you deliberately left, final line `POLISH: DONE` or
  `POLISH: BLOCKED — <reason>`).
- No AppHost, no containers, no `e2e:cli`; `aspire ps` must stay `[]`.
