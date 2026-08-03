use harness

# S1 — Merge-aware canary payload derivation (#1166)

You are the implementation agent for one locked NetScript harness slice. Work only in
`/home/codex/repos/ns005-canary-payload-s1` on transient slice branch
`fix/canary-payload-merge-commits-s1`, based exactly on the PR branch tip. The milestone
orchestrator approved the plan and waived the per-PR local PLAN-EVAL under
`.llm/harness/workflow/milestone-run.md`. You implement and gather evidence; you do not self-certify,
commit, push, change PR metadata, or dispatch evaluators. Leave the reviewed working tree for the
supervisor's opposite-family review and sign-off commit.

## SKILL

- `netscript-harness` — obey the locked Design, update worklog/context/drift, and do not self-certify.
- `netscript-release` — preserve label/note/drift contracts; do not change publish mechanics.
- `netscript-tools` — use scoped validation wrappers and preserve lock hygiene.
- `netscript-pr` — respect `Refs #1166`; no PR mutation or closing keyword.
- `rtk` — compress read-heavy git/search output and wrap Deno task output.
- `codex-wsl-remote` — this is an agentic-suite slice; remain in the provided native WSL worktree.

Read the relevant SKILL.md files completely before task action, then read:

- `.llm/runs/fix-canary-payload-merge-commits--1166/research.md`
- `.llm/runs/fix-canary-payload-merge-commits--1166/plan.md`
- `.llm/runs/fix-canary-payload-merge-commits--1166/worklog.md`
- `.llm/harness/workflow/canary-cadence.md`
- issue #1166 context already summarized in research/plan

## Locked implementation contract

1. Replace the misleading `firstParentCommits` dependency port with merge-aware `rangeCommits`.
2. Enumerate `git rev-list --topo-order --reverse previous..head` so second-parent PR commits are
   included while commits reachable from `previous` stay excluded.
3. Return explicit derivation evidence: inspected `commitCount` and a successful outcome of
   `populated` or `genuine-empty`.
4. A zero-commit range is genuine-empty. A non-empty range with zero associated PRs is a derivation
   failure that makes the named `merge-history-payload` check FAIL before label/note/drift mutation.
5. Preserve GitHub association filtering, unpublished-version refusal, idempotent release update,
   and target-train drift behavior.
6. Touch only `.llm/tools/release/canary-label.ts`, its adjacent test, and this run's worklog/context/
   drift if needed. No workflows, packages/plugins, dependencies, or `deno.lock`.

## RED→GREEN proof

Build a synthetic repository in `Deno.makeTempDir` with local git identity and explicit branches:

- a previous canary point;
- a `main` PR merge commit after that point;
- a release branch merge/update commit whose second parent contains that PR commit.

Against the same DAG, record that the baseline first-parent command omits the buried PR commit and
that the pre-fix focused test fails. Then implement and show the fixed derivation includes its mapped
PR. Also cover:

- true zero-commit range → explicit `genuine-empty` result/note/check evidence;
- non-empty range with zero PR associations → rejection / named derivation failure;
- unpublished-version refusal;
- note update/idempotence contract;
- drift gate scoping and mismatch semantics.

Do not fake RED by asserting a hard-coded list. The fixture must exercise real git history. Record
the exact failing test/command and its salient output in `worklog.md`, then the GREEN result.

## Gates

Run, in this order:

1. Focused RED before implementation, then
   `deno test --allow-all .llm/tools/release/canary-label_test.ts` GREEN.
2. `deno test --allow-all .llm/tools/release/*_test.ts`.
3. `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/release --ext ts`.
4. `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/release --ext ts`.
5. `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/release --ext ts`.
6. Inspect the diff for new `deno-lint-ignore`, `as unknown as`, and `@ts-ignore`, excluding quoted
   run artifacts. Verify `git diff origin/main -- deno.lock` is empty.

Do not run mutating root formatting. Do not delete locks/caches or run cache reload. Leave a concise
final message with files changed, RED and GREEN evidence, gate results, and any concern. Do not
commit or push.
