use harness

## SKILL
- netscript-harness; netscript-tools; netscript-pr; rtk; netscript-deno-toolchain

## Slice: reconcile PR #771 with the advanced integration base (merge conflicts)

Worktree: `/home/codex/repos/b10-taglines` (branch `docs/jsr-tagline-byte-cap`). PR #771 targets
`feat/beta10-integration`, which has advanced by ~10 merges (#770 #786 #787 #788 #789 #790 #793
#794 …) and now CONFLICTS with this branch (GitHub update-branch returns 422).

Task: `git fetch origin feat/beta10-integration` then merge it into the branch, resolving
conflicts **in favor of preserving BOTH the PR's intent and everything already landed on base** —
read PR #771's body via the GitHub API (resolveGithubToken in
`.llm/tools/agentic/lib/agentic-lib.ts`) to know its intent before resolving. If any part of the
PR is now obsolete (superseded by landed work), drop that part deliberately and record it in a PR
comment, not silently. Re-run the PR's own validation commands (from its body) plus
`deno task check` scoped to touched roots. Zero new suppressions.

Push explicit refspec `git push origin HEAD:refs/heads/docs/jsr-tagline-byte-cap`; comment on PR #771 with what was
reconciled/dropped + validation evidence. Do NOT dispatch your own evals; do NOT merge.
