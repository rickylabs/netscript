use harness

## SKILL

- netscript-harness — Tier-D implementation slice in a harness run
- netscript-tools — gate-evidence rules; which lane is a trustworthy verdict source
- netscript-pr — PR/labels/milestone conventions
- rtk — prefix read-heavy git/grep
- netscript-deno-toolchain — if any deno task wiring changes

## Slice: fix #774 — PRs into integration branches get no real CI

Branch: `ci/774-integration-branch-ci` (worktree `/home/codex/repos/b10-774-ci`, base
`feat/beta10-integration`). PR base: `feat/beta10-integration`.

Read issue #774 in full first (`https://github.com/rickylabs/netscript/issues/774`). Its three asks:

1. **Trigger fix**: `.github/workflows/ci.yml` currently has
   `on.pull_request.branches: [main, "feat/package-quality"]`, so stacked-wave PRs (base =
   integration branch) never run `check-test` or `quality`. Widen the trigger so PRs into
   integration branches run the real lanes — prefer `branches: [main, 'feat/**', 'epic/**']` unless
   you find a concrete reason another shape is safer. Audit ALL jobs in ci.yml (and any other
   workflow with a base-branch filter, e.g. the scaffold lanes that showed
   `completed/cancelled` on PR #770 head 40ecc87c) for the same gap; fix consistently. Keep the
   expensive scaffold-runtime lane's existing path/label gating (`ci:skip-e2e` etc.) intact — the
   goal is honest default coverage, not running the E2E fleet on every docs PR.
2. **Branch-protection audit (report, do NOT change settings)**: via the GitHub API (token via
   `.llm/tools/agentic/lib/agentic-lib.ts` resolveGithubToken), read branch protection / rulesets
   for `main` and record in the PR body whether `quality` and `check-test` are required checks.
   State plainly: a "blocking" gate inside a non-required job blocks nothing.
3. **Lane visibility**: add a cheap, always-on job (or step) that posts/updates a PR comment (or
   job summary) listing which lanes actually ran vs were skipped for that PR, so "2 checks passed"
   cannot be mistaken for "CI passed". Keep it dependency-free (github-script or plain gh api in
   the workflow).

Validation: workflow YAML sanity (`deno run` a YAML parse or actionlint if available; at minimum a
careful diff), plus dry reasoning in the PR body of exactly which lanes will now run for (a) PR →
main, (b) PR → feat/beta10-integration, (c) docs-only PR with ci:skip-e2e. No packages/plugins
source is touched, so quality:gate is not required; run `deno task check` only if you touch any TS.

Constraints: commit by slice; push explicit refspec `git push origin
HEAD:refs/heads/ci/774-integration-branch-ci`; open PR to `feat/beta10-integration` with
`Closes #774`, labels `type:fix, area:tooling, gate:ci, priority:p1, status:impl-eval`, milestone
`0.0.1-beta.10`. You do not self-certify; a separate opposite-family session evaluates.
