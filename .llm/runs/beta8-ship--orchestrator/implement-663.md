use harness

# Slice brief — #663: release:cut opens the release PR via the API token path

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-tools/SKILL.md`,
`.agents/skills/netscript-release/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent under the beta-8 orchestrator (`4d300496`). Do NOT open PRs.
  PLAN-EVAL owner-waived (carried drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-b8-663`, branch `fix/663-release-cut-pr-api`.
- **Every file operation uses absolute paths inside `/home/codex/repos/ns-b8-663`** (never relative
  `cd` prefixes — bash cwd resets between calls).
- Base preflight: verify `git -C /home/codex/repos/ns-b8-663 rev-parse HEAD` starts `955b4abf`
  before editing; if not, STOP and report BLOCKED.
- Push: `git -C /home/codex/repos/ns-b8-663 push origin HEAD:refs/heads/fix/663-release-cut-pr-api`.
- Worklog at `/home/codex/repos/ns-b8-663/.llm/runs/fix-663-release-cut-pr--codex/worklog.md`,
  committed with the slice.

## Task (issue #663 — read it first; its acceptance boxes are the contract)

`.llm/tools/release/cut.ts`'s final step shells to `gh pr create`, which fails on WSL supervisor
hosts (no gh auth) — both beta.6 and beta.7 releases needed a manual API fallback. Replace that
step with the agentic suite's API path: `resolveGithubToken` + REST (see
`.llm/tools/agentic/lib/agentic-lib.ts` `githubRequest`/`resolveGithubToken`, and
`.llm/tools/agentic/github/gh-pr.ts` `create` for the existing PR-creation shape — wrap/reuse,
do not reinvent). Preserve current behavior: PR-creation failure stays non-fatal to
branch/commit/push (print the manual fallback instructions as today).

Keep the PR body generation unchanged (it already writes to `.llm/tmp/`); the API call should use
that generated body. Base branch `main`, head `release/cut-<version>`.

## Validation (evidence in worklog)

- Scoped check/lint on the touched files (`.llm/tools/run-deno-check.ts` / `run-deno-lint.ts`).
- Existing release-tool unit tests green; add/extend a unit test covering the PR-creation step with
  an injected fetch/transport stub (success + non-fatal failure paths).
- Do NOT run an actual release cut.

## Done means

Fix + tests committed and pushed, worklog committed. Report "DONE" or "BLOCKED: <why>".
