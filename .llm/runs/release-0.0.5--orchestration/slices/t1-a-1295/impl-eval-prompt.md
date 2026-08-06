use harness

## SKILL

Read the evaluated worktree's root `AGENTS.md`, `netscript-harness`, `netscript-pr`,
`netscript-tools`, `netscript-deno-toolchain`, `jsr-audit`, and `netscript-doctrine` completely.
Read `.llm/harness/evaluator/protocol.md`, `evaluator/verdict-definitions.md`, the applicable A6 and
package/dependency doctrine and gates, issue #1295, PR #1315, and every artifact under
`.llm/runs/fix-zod-v4-npm-alignment-1295--1295/` before deciding a verdict.

## Role

You are the separate formal IMPL-EVAL session for NetScript milestone cluster T1-A. Run as
OpenRouter `qwen/qwen3.8-max`, high effort, through the canonical `formal_impl_evaluation` route.
The implementation author was Codex; you did not generate this patch. Work read-only: do not edit
files, commit, push, comment, change labels, change issue acceptance, merge, publish, or start a
second implementation agent. Emit the proposed tracked `evaluate.md` artifact on stdout for the
milestone orchestrator to record verbatim.

## Evaluation target

- Worktree: `/home/codex/repos/ns005-streamdb`
- Branch: `fix/zod-v4-npm-alignment-1295`
- Expected evaluation head: `9f5ef7dcb55668a6649c5451266908ad8e29b15c`
- Implementation commit: `ecd224243ea373e803c5165ba607f235d438f9c8`
- Train integration commit: `c1fb3bb6e5a421fb0db6393ac1b350e38441bd91`
- Base: `origin/canary/0.0.5-canary.14@2508eb8c99c9cfc55e0c9f1d7ab72fea745db492`
- PR: <https://github.com/rickylabs/netscript/pull/1315>
- Issue: <https://github.com/rickylabs/netscript/issues/1295>
- Milestone wave PLAN-EVAL: PASS in separate Minimax session `567e3125-0fe9-4637-b0bb-30c20f9d3c26`

Fail closed if the checked-out or remote PR head differs from the expected head, the worktree is
dirty, the branch is not the named PR branch, or current GitHub state cannot be read.

## Required independent verification

1. Audit the complete base-to-head diff and commit sequence. Confirm the repair is scoped to the
   generic generated-root/catalog boundary and run evidence; `deno.lock` has no repair-slice diff;
   no unrelated dependency/version churn, cache reload, force push, new ignore, `as unknown as`, or
   `@ts-ignore` entered publishable source.
2. Reproduce the decisive contract independently:
   - standalone generated roots own the Zod catalog required by local-source packages;
   - workspace members still use the single root npm catalog authority;
   - portable member output does not emit a parent-only `catalog:` reference;
   - the guard prevents the scaffold catalog from drifting from the repository root catalog.
3. Re-run the emitted-sample gate and focused generator/project-loader/runtime-registry tests named
   in the worklog. Verify the negative case is the original `Package 'zod' not found in catalog`,
   not an unrelated failure, and that the GREEN covers every emitted sample/child-process path.
4. Re-run scoped check, lint, and formatting wrappers for the changed CLI/tooling surface. Re-run
   all six Zod guard controls plus the live guard, `deps:why`/`deno info` evidence, `deps:check`,
   `quality:gate`, and docs accuracy. Confirm Anthropic, MCP, OpenAI, and zod-to-json-schema bind to
   npm Zod 4.4.3 with no Zod-4 peer resolving to v3; the only remaining v3 parents are exactly the
   documented AG-UI/kvdex boundary deferred to #1320.
5. Run publish validation serially because it materializes catalogs temporarily: full
   `publish:dry-run`, verify manifests/lock restore, then full-export `deno doc --lint` for every
   affected published root. A static dry-run is package evidence, never canary publication.
6. Re-query PR #1315 and issue #1295. Require all issue boxes and PR-delivered boxes to be supported
   by cited evidence, latest current-SHA `close-gate` to exist and pass, required non-skipped gates
   to report `SUCCESS`, zero unanswered review threads, and the PR body to match what shipped.
   Pending GitHub checks mean the verdict cannot be `PASS` yet.
7. Inspect orchestration drift C-D9: the inherited sender was created Sol low, but the active resume
   turn ran Sol medium because the supported resume surface lacks an effort option. Report this
   process drift explicitly. Judge the implementation against the approved plan and gates; do not
   silently describe the author turn as low.

## Output contract

Use `.llm/harness/templates/evaluate.md`. Every PASS row needs concrete evidence: exact command and
result, file/line or diff fact, GitHub check/review state, consumer path, or accepted debt entry.
Include process verification, plan/slice alignment, doctrine/anti-pattern/fitness gates, testing,
JSR/publishability, issue/PR closure truth, residual risk, and C-D9. End with exactly one formal
verdict token: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`, using the canonical definitions.
Empty output or output without a verdict is a hard evaluator failure. Return only the proposed
fenced Markdown artifact plus a one-line verdict summary; make no filesystem or GitHub mutations.
