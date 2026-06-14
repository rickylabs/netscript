use harness, you are the NetScript Wave 5d6 query/server/final-surface implementation agent.

Run only from this native WSL ext4 worktree:
/home/codex/repos/netscript-wave5-apps-5d6-query

Branch:
feat/package-quality-wave5-apps-5d6-query

PR:
https://github.com/rickylabs/netscript/pull/39

Current dependency state:
- This branch has already merged the pushed 5d supervisor branch through 5d5 form.
- Latest sync commits are `64dcc0f` (`Merge 5d supervisor after 5d5 form`) and `f6e99e1` (`chore(5d6): sync supervisor after 5d5`).
- Supervisor branch includes evaluated 5d1, 5d4, 5d2, 5d3, and 5d5 work.
- 5d5 IMPL-EVAL PASS is at `40693c9`.

Critical protocol:
- You are an implementation agent, not evaluator. A separate IMPL-EVAL session will evaluate after implementation is done.
- Commit and push after every slice. This is mandatory. Do not batch several slices before pushing.
- After every pushed slice, comment PR #39 with a structured summary: slice number/name, commit(s), files changed, gates run with PASS/FAIL, drift/residual risk, and next slice.
- Git push works from this WSL environment via SSH. Use `git push origin feat/package-quality-wave5-apps-5d6-query` after each slice. If push fails once, stop and report exact failure in worklog and PR comment if possible; do not keep implementing unpushed slices.
- Use GitHub MCP for PR comments when available. If not available, record the missing PR comment in worklog and stop for supervisor handoff.
- Do not run full CLI E2E here. Reserve `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` for supervisor merge-readiness/full CLI E2E.
- Do not delete lock files or caches. Do not run `deno cache --reload`.
- If validation mutates `deno.lock`, inspect it and revert lock churn unless a reviewed source fix explicitly requires it.
- Use scoped gates first. Use the repo wrappers for check/lint/fmt where appropriate.
- For targeted `deno check` commands touching workspace code, include `--unstable-kv`.

Required reads before editing:
1. AGENTS.md
2. .agents/skills/netscript-harness/SKILL.md
3. .agents/skills/netscript-cli/SKILL.md
4. .agents/skills/netscript-tools/SKILL.md
5. .agents/skills/rtk/SKILL.md
6. .llm/harness/workflow/activation.md
7. .llm/harness/workflow/run-loop.md
8. .llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/research.md
9. .llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/design.md
10. .llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/plan.md
11. .llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/plan-eval.md
12. .llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/drift.md
13. .llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/worklog.md
14. .llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/commits.md
15. Relevant current source under `packages/fresh/query`, `packages/fresh/server*`, `packages/fresh/streams`, `packages/fresh/defer`, `packages/fresh/form`, `packages/fresh/builders`, `packages/fresh/config`, `packages/fresh/mod.ts`, root `deno.json`, and `packages/fresh/deno.json`.

Implementation scope:
- Execute the approved 5d6 30-slice plan, but re-measure against the merged 5d1-5d5 supervisor baseline first.
- If a planned slice has already been fully retired by 5d1-5d5, record that as a slice retirement in worklog/drift with concrete evidence, commit/push that artifact-only slice, and comment PR #39.
- Keep source changes tightly scoped. Do not rework completed 5d1-5d5 surfaces unless required to complete the final package surface gates.
- For query/server work, prefer package-owned public types and wrappers over upstream type leaks.
- For root workspace exclusion/root gate changes, handle only the minimum required to include `packages/fresh` in final package-quality verification.
- Keep public surface curated: no kitchen-sink root, no raw upstream re-exports, no forbidden helper folders, no unannotated internal barrels.

Expected slice cadence:
1. Rebaseline current doc-lint/dry-run/file-size/root-workspace state against merged supervisor, update worklog/drift, and commit/push/comment Slice 1 or a rebaseline slice.
2. Continue through query bridge slices, server extension-point slices, cross-cluster private-type-ref cleanup, root/package closeout, consumer import/browser proof where feasible, and final context-pack/READY-FOR-IMPL-EVAL handoff.
3. After every slice: update `commits.md`, commit, push, comment PR #39.
4. When all implementation slices are done, write/update `context-pack.md`, append final worklog/drift, commit/push, and comment PR #39 as ready for IMPL-EVAL.

Minimum gates to use as applicable by slice:
- `deno doc --lint packages/fresh/query/mod.ts`
- `deno doc --lint packages/fresh/server.ts`
- `deno doc --lint packages/fresh/mod.ts`
- combined public entrypoint `deno doc --lint` for final doc-lint 0
- `deno check --unstable-kv packages/fresh/query/mod.ts packages/fresh/server.ts packages/fresh/mod.ts` or narrower touched entrypoints
- `.llm/tools/run-deno-check.ts`, `.llm/tools/run-deno-fmt.ts`, `.llm/tools/run-deno-lint.ts` with explicit `--root packages/fresh` or narrower roots and `--ext ts,tsx`
- targeted `deno test` for touched packages/fresh tests
- `(cd packages/fresh && deno task dry-run)` for publishability slices
- root check/fmt/lint only when implementing the final root inclusion slices

Return requirements:
- In your final message, list the latest pushed commit, latest PR comment status, completed slice count, next slice if any, and whether the branch is clean/current.
