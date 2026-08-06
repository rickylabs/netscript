use harness

## SKILL

Read and follow the repository root `AGENTS.md`, `netscript-harness`, `netscript-tools`,
`netscript-pr`, `netscript-deno-toolchain`, `jsr-audit`, `netscript-doctrine`, the formal evaluator
protocol and verdict definitions, and the relevant A6/package-graph doctrine and gates completely.

You are the separate formal IMPL-EVAL session for milestone cluster T1-A, issue #1295, PR #1315,
branch `fix/zod-v4-npm-alignment-1295`, current implementation head
`9f5ef7dcb55668a6649c5451266908ad8e29b15c`. You are running through OpenRouter as `qwen/qwen3.8-max`
at high effort under the canonical `formal_impl_evaluation` route. You are distinct from Codex
implementation thread `019fcd0c-9cda-7641-9479-3d1c72358154` and Minimax wave PLAN-EVAL session
`567e3125-0fe9-4637-b0bb-30c20f9d3c26`.

Do not implement, edit files, commit, push, merge, publish, close an issue, or change GitHub state.
Use current live evidence; emit the proposed `evaluate.md` artifact on stdout for the orchestrator
to record.

Read PR #1315, issue #1295, the full diff from
`origin/canary/0.0.5-canary.14@2508eb8c99c9cfc55e0c9f1d7ab72fea745db492`, and the complete tracked
run `.llm/runs/fix-zod-v4-npm-alignment-1295--1295/`. Independently verify:

- the branch integrated current canary.14 without rebase/force and the repair is scoped to the
  current generated-child `catalog:zod` failure;
- the RED evidence really demonstrates a standalone/generated child that cannot inherit a parent
  catalog;
- the fix is generic at the child-root/generation seam, not a named-fixture special case;
- standalone emitted consumers own enough npm catalog information to resolve Zod, while actual
  workspace members still use one root npm catalog authority;
- no JSR Zod, local per-member version pin, undocumented Zod instance, or weakened graph guard was
  introduced;
- the AI/MCP peer cluster binds to npm Zod 4 and the only permitted v3 parents remain the exact
  documented AG-UI and kvdex blockers deferred to #1320;
- check-emitted-samples, generated-workspace tests, scoped check/lint/fmt, graph guard, dependency
  evidence, full export-map doc lint, docs accuracy, quality/doctrine gates, and publish dry-run are
  credible and proportionate;
- the repair has no unreviewed `deno.lock` delta and publish simulation restored temporary files;
- issue #1295's six acceptance rows remain fully evidenced, the PR closing keyword closes only that
  fully resolved issue, and current-SHA required CI remains a separate pre-merge condition;
- no unrelated framework/public-surface behavior or milestone acceptance entered the diff.

Run bounded read-only spot checks when helpful. Apply the repository verdict definitions exactly.
Return one complete `evaluate.md` body with findings ordered by severity, acceptance/gate results,
route/session provenance, residual risks, and exactly one formal verdict: `PASS`, `FAIL_IMPL`, or
the protocol's applicable blocked verdict. A PASS authorizes the orchestrator to continue the
pre-merge gate; it does not merge the PR or waive pending GitHub contexts.
