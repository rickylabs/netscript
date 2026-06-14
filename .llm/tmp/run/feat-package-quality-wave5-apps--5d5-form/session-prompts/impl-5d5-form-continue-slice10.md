use harness

Continue NetScript Wave 5d5 form implementation from native WSL worktree:
/home/codex/repos/netscript-wave5-apps-5d5-form

Current pushed state:
- Branch: feat/package-quality-wave5-apps-5d5-form
- PR: #38
- Latest pushed slice: Slice 9, ending at `e42f4aa [5d5] Fix slice 9 ledger hash`.
- Slices 1-9 are pushed and PR-commented.

Continue the remaining feasible 5d5 plan slices. Suggested next order:
1. Slice 10: Zod adapter parity/rebuild against the Standard Schema path only if it can be done without public API breakage; otherwise record a justified no-op/defer slice.
2. Slice 11: schema introspector contract/additive docs if still useful.
3. Slice 12+: fresh-ui seam docs/playground/browser evidence only if package gates stay clean.
4. Final closeout: run scoped 5d5 gates and mark ready for IMPL-EVAL.

Mandatory protocol:
- Finish one slice at a time.
- BEFORE starting another slice, commit, push, and comment PR #38 for the completed slice.
- If time is running out or you are uncertain, stop after pushing/commenting the current completed slice; do not leave WIP.
- For each source slice run smallest relevant gates: form doc-lint, narrow check, scoped form check, touched fmt/lint, relevant tests, file-size scan.
- Do not run full CLI E2E. Do not delete lock files/caches. Do not run `deno cache --reload`.
- Preserve public export names and import paths. Do not add `createZodAdapter` to `form/mod.ts` unless doc-lint remains clean.
- If a plan slice is now obsolete/no-op because current branch already satisfies it, record the verification as a slice with gates, commit/push/comment it.
- Stop at ready-for-IMPL-EVAL and do not merge to supervisor.
