use harness

Continue NetScript Wave 5d5 form implementation from the native WSL worktree:
/home/codex/repos/netscript-wave5-apps-5d5-form

Current pushed state:
- Branch: feat/package-quality-wave5-apps-5d5-form
- PR: #38
- Latest pushed slice: Slice 2, commit stack ending at `1e482b2 [5d5] Record slice 2 commit`.
- Slice 1 and Slice 2 were pushed and PR-commented.

Continue with the next planned low-risk slices:
- Slice 3: decompose `packages/fresh/form/field-descriptors.ts` into role-named files while preserving public imports/exports.
- Slice 4: decompose `packages/fresh/form/schema-adapter.ts` into role-named files while preserving public imports/exports.
- If a smaller boundary is needed, split one of those slices further, but still commit/push/comment after each completed slice.

Mandatory protocol:
- Commit, push, and comment PR #38 after EACH completed slice.
- Each PR comment must include slice title, commits, files changed, gates and results, residual risks, and next slice.
- Run smallest relevant gates per slice. At minimum for these slices: `deno doc --lint packages/fresh/form/mod.ts`, `deno check --unstable-kv packages/fresh/form/mod.ts`, scoped form check wrapper, touched-file lint/fmt, and file-size scan.
- Do not run full CLI E2E. Do not delete lock files/caches. Do not run `deno cache --reload`.
- Preserve public export names and import paths.
- If a broad wrapper fails only because of pre-existing untouched formatting, record it as drift and also run touched-file fmt/lint as verdict evidence.
- Stop only when blocked or when all 5d5 slices are complete and ready for IMPL-EVAL.
