use harness

## SKILL
- netscript-harness — Tier-D slice; netscript-tools; netscript-deno-toolchain; netscript-pr; rtk

## Slice: drive PR #772 (quality/762-ts-ignore-sweep, Closes #762) to green under honest CI

Worktree: `/home/codex/repos/b10-762-tssweep` (branch `quality/762-ts-ignore-sweep` @ 28fda5d1 —
base merge of feat/beta10-integration@0daa575b already in). The integration branch has since
advanced (#788/#789/#790 merged); merge `origin/feat/beta10-integration` in first.

Context: PR #772 got its FIRST honest CI run after the #774 trigger fix and is red on
`check-test`, `quality`, `close-gate`, `scaffold-static`, `scaffold-runtime`. Read the failing
check-run logs via the GitHub API (token via resolveGithubToken in
`.llm/tools/agentic/lib/agentic-lib.ts`) and fix the branch until those lanes are green. Preserve
the PR's purpose: the repo-drift (@ts-*/as never) sweep stays 36→0 and its guard stays
CI-blocking — do NOT weaken the guard or re-introduce suppressions to go green; reconcile the
sweep with code that landed since it was written.

Gates: `deno task check` + affected-package tests locally before pushing; the PR's own CI is the
acceptance. Push explicit refspec `git push origin HEAD:refs/heads/quality/762-ts-ignore-sweep`;
comment on PR #772 with what was reconciled + lane evidence. Do NOT dispatch your own
PLAN-EVAL/IMPL-EVAL — the supervisor triggers all evaluations. Do not merge.
