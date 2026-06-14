use harness

Continue NetScript Wave 5d5 form implementation from the native WSL worktree:
/home/codex/repos/netscript-wave5-apps-5d5-form

Current pushed state:
- Branch: feat/package-quality-wave5-apps-5d5-form
- PR: #38
- Latest pushed slice: Slice 6, commit stack ending at `43be65f [5d5] Record slice 6 commit`.
- Slices 1-6 are pushed and PR-commented.

Continue with the next planned slices, but keep each slice small:
- Slice 7: telemetry alignment / cleanup for `packages/fresh/form/telemetry.ts` if still needed.
- Slice 8: `mod.ts` public surface audit if still needed.
- Slice 9+: schema adapter additive work only if the earlier gates are still clean and the public surface remains stable.

Mandatory protocol:
- Commit, push, and comment PR #38 after EACH completed slice.
- Each PR comment must include slice title, commits, files changed, gates and results, residual risks, and next slice.
- Run smallest relevant gates per slice. At minimum: `deno doc --lint packages/fresh/form/mod.ts`, `deno check --unstable-kv packages/fresh/form/mod.ts`, scoped form check wrapper, touched-file lint/fmt, and file-size scan for any source slice.
- Do not run full CLI E2E. Do not delete lock files/caches. Do not run `deno cache --reload`.
- Preserve public export names and import paths.
- If a slice is a verification/no-op slice, still record evidence in worklog/context-pack, commit/push, and comment PR.
- Stop only when blocked or when all feasible 5d5 slices are complete and ready for IMPL-EVAL.
