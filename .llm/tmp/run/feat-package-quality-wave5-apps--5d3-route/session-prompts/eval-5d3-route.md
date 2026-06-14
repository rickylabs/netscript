use harness

You are the separate IMPL-EVAL evaluator for NetScript Wave 5d3 route. Work only from the native WSL ext4 worktree:
/home/codex/repos/netscript-wave5-apps-5d3-route

Requirements:
- Do not implement feature changes unless a minimal evaluator-only harness artifact update is needed.
- Verify the implementation on branch feat/package-quality-wave5-apps-5d3-route at current pushed HEAD.
- Keep evaluation separate from implementation. Do not merge to supervisor.
- Use repo-native tools and rtk for read-heavy inspection where practical.
- Do not delete lock files or caches. Do not run deno cache --reload.
- Do not run the full CLI E2E suite; that is reserved for supervisor merge readiness.
- Run the smallest gates needed to validate 5d3 readiness:
  1. git status/branch/head check.
  2. LOC check for the targeted route files.
  3. deno doc --lint packages/fresh/route/mod.ts packages/fresh/route/types.ts packages/fresh/route/pagination-types.ts packages/fresh/route/contract.ts packages/fresh/route/manifest.ts packages/fresh/route/manifest-types.ts
  4. deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/route --root packages/fresh/builders --ext ts,tsx
  5. deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh/route --root packages/fresh/builders --ext ts,tsx
  6. deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh/route --root packages/fresh/builders --ext ts,tsx --ignore-line-endings
  7. deno test --allow-all packages/fresh/route packages/fresh/builders
  8. cd packages/fresh && deno task dry-run
- Record the verdict in .llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/evaluate.md.
- Append a concise evaluator entry to .llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/worklog.md.
- Commit evaluator artifacts with message: eval(5d3): record route verdict
- Push feat/package-quality-wave5-apps-5d3-route after the evaluation commit.
- Comment PR #36 with a structured IMPL-EVAL summary including verdict, commits, gates, and residual risks.

Expected implementation context:
- Final implementation head before evaluator commit: d57c40d chore(5d3): record implementation readiness.
- Public route doc lint is expected to be zero.
- Targeted files should be at or under the F-1 soft cap: route/mod.ts, route/types.ts, route/pagination-types.ts, route/contract.ts, route/manifest.ts, route/manifest-types.ts, route/_internal/contract-runtime.ts, route/_internal/contract-types.ts.

If any gate fails:
- Do not fix implementation unless the failure is only in evaluator artifact formatting.
- Record FAIL_IMPL with exact failing command and short diagnosis.
- Push the evaluator artifact commit and comment PR #36 with the failure summary.
