use harness, you are the Wave 5d3 route implementation agent for NetScript Wave 5.

Run from native WSL ext4 only:
/home/codex/repos/netscript-wave5-apps-5d3-route
Branch: feat/package-quality-wave5-apps-5d3-route
PR: #36 in rickylabs/netscript
Current required baseline: branch is pushed at 0e2a6b0 after supervisor synced 5d2 into 5d3.

First actions:
1. Verify cwd, branch, remotes, clean status, and that local branch is current with origin.
2. Read AGENTS.md, the relevant skills (netscript-harness, netscript-cli, netscript-tools, rtk, codex-wsl-remote), .llm/harness/workflow/activation.md, .llm/harness/workflow/run-loop.md, .llm/harness/workflow/supervisor.md, and the 5d3 run artifacts in .llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/.
3. Reconcile the 5d3 plan with the current 5d2 builder split before editing. The supervisor sync intentionally resolved builder/form files to the evaluated 5d2 baseline and removed old failed-agent probe tests.

Implementation objective:
Complete Wave 5d3 route manifest + route contract runtime implementation according to .llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/plan.md and plan-eval.md, preserving the current 5d2 builder/navigation structure. The main open budget is route public surface/doc-lint/decomposition. Do not reintroduce deleted monolithic builders/define-page/navigation.tsx.

Slice discipline is mandatory:
- Work in small plan slices.
- After EACH completed slice: run the smallest relevant gate, commit, append the commit hash to .llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/commits.md, push to origin, and comment PR #36 with a structured summary of what was done, gates run, commit hash, push status, and any drift.
- Do not batch several slices before pushing. If push fails because of credentials or remote state, stop and record the blocker in worklog/drift, then tell the supervisor.
- The environment has SSH GitHub push configured; use the existing git remote. Do not switch to HTTPS.

Validation rules:
- Use rtk for read-heavy git/grep/docker inspection where available; if rg is missing, use focused grep.
- Prefer scoped wrappers: .llm/tools/run-deno-check.ts, run-deno-lint.ts, run-deno-fmt.ts.
- Include --unstable-kv for targeted deno check commands that touch workspace code.
- Do not run the full CLI E2E smoke except during final merge-readiness or if the supervisor explicitly asks. The full command is: deno task e2e:cli run scaffold.runtime --cleanup --format pretty
- Do not delete lock files or caches. Do not run deno cache --reload.

Expected gates by the end of 5d3 before IMPL-EVAL:
- route scoped deno check passes.
- route lint/fmt scoped wrappers pass for touched TS/TSX files.
- deno doc --lint for route public entrypoints is clean or any accepted residual is explicitly recorded and justified by the approved plan.
- route tests/consumer-import validation pass as described in the plan.
- package dry-run route delta is documented if package-wide baseline failures remain out of scope.

Communication:
- Keep worklog.md and drift.md current.
- Comment PR #36 after every slice with a structured summary.
- When all slices are complete, push, comment PR #36 that it is ready for IMPL-EVAL, and include final gates and head commit.
