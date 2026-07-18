use harness

## SKILL
- netscript-harness; netscript-doctrine; netscript-tools; deno-fresh; rtk; netscript-pr

## Slice: `markdown-renderer.test.ts:111` (generated Fresh Markdown island production build) fails on CI runners — repo-wide `deno task test` is red for the whole beta.10 wave

Worktree `/home/codex/repos/b10-790ci`, branch `fix/790-md-hydration-ci`, base feat/beta10-integration @ 3265b516. PR base: feat/beta10-integration.

Evidence: GitHub job 87754952044 (PR #795 head, but the failure is base-inherited from the #790 merge): test `generated Fresh Markdown island production-builds for hydration` (packages/fresh-ui/tests/registry/markdown-renderer.test.ts:111) fails with `AssertionError: Values are not equal` on the embedded `deno run -A npm:vite build`, preceded by a peer-dep warning (`@tanstack/ai-preact@0.10.3` wants `@tanstack/ai@^0.40.0`, resolved 0.39.1). The same test passes on local native-WSL (verified twice, incl. by an independent evaluator with Playwright hydration green).

Task:
1. Root-cause the CI-only failure: reproduce the vite build in a constrained env if possible; at minimum, make the test SURFACE the build stderr/stdout in its assertion message (an equality assert that swallows the build log is unfixable from CI evidence — that alone is a defect).
2. Fix at the owning layer. Acceptable shapes: fix the actual build failure (peer-dep pin/override if that is the cause); make the test hermetic on CI (no network, deterministic deps). NOT acceptable: deleting the test or blanket-skipping it on CI without a compensating gate — hydration proof must survive somewhere that runs (state where).
3. Read the failing job log yourself via the GitHub API (resolveGithubToken in `.llm/tools/agentic/lib/agentic-lib.ts`, job id above) for the full assertion diff.
4. Gates: focused markdown tests + `deno task check` on touched roots; the acceptance is `check-test` green on your own PR's CI (base = integration branch, so it runs for real).

Constraints: no new suppressions; push explicit refspec `git push origin HEAD:refs/heads/fix/790-md-hydration-ci`; DRAFT PR to feat/beta10-integration, body references #783/#790 context WITHOUT closing keywords (they're already handled), labels `type:fix, area:plugins, gate:ci, priority:p0, status:impl-eval`, milestone 0.0.1-beta.10. Do NOT dispatch your own evals; do not merge.
