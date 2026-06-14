use harness

You are the implementation agent for NetScript Wave 5d5 form. Work only from native WSL ext4 worktree:
/home/codex/repos/netscript-wave5-apps-5d5-form

Branch and PR:
- Branch: feat/package-quality-wave5-apps-5d5-form
- PR: #38
- Base/supervisor: feat/package-quality-wave5-apps-5d-fresh

Current state:
- Branch has just been synced with supervisor commit 07a1f70 after evaluated 5d3 route merge.
- Sync commit is ff8cf6f.
- Worktree should be clean and pushed before you start.

Hard requirements:
- Use harness.
- Read AGENTS.md, relevant skills, and .llm/tmp/run/feat-package-quality-wave5-apps--5d5-form/plan.md before implementation.
- Do not use /mnt/c for full Deno/npm/Aspire gates. Stay in this native WSL worktree.
- Do not delete lock files or caches.
- Do not run deno cache --reload.
- Do not run full CLI E2E; it is supervisor merge-readiness only.
- Keep implementation scoped to 5d5 form plan. 5d6 final root/package surface waits until 5d5 is evaluated and merged.
- Use repo-native wrappers for scoped check/lint/fmt where possible.
- If you discover drift from the plan, record it in worklog/drift before proceeding.

Slice discipline, mandatory:
- Work in small slices from the existing plan.
- After EACH completed slice:
  1. Run the smallest relevant gates for that slice.
  2. Update worklog/commit ledger for the slice.
  3. Commit the implementation and/or ledger artifacts.
  4. Push feat/package-quality-wave5-apps-5d5-form.
  5. Comment PR #38 with a structured summary: slice title, commits, files changed, gates run and results, next slice.
- Do not batch multiple completed slices without an intervening commit+push+PR comment.

Expected initial slice direction:
- Start with the lowest-risk foundation slices after the supervisor sync. Re-measure current form baseline first because 5d1-5d4 and 5d3 changed the package.
- Prefer package-quality decomposition/doc-lint work before playground/browser expansion.
- Preserve public export names and import paths.

Completion:
- When all feasible 5d5 slices are complete, run final 5d5 scoped gates, commit/push final readiness artifact, and comment PR #38 as ready for IMPL-EVAL.
- Do not merge to supervisor; evaluator and supervisor do that separately.

If blocked:
- Commit/push any completed slice first.
- Record the blocker in worklog/drift.
- Comment PR #38 with the blocker and exact next action needed.
