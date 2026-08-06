use harness

## SKILL

Read and follow the worktree root `AGENTS.md`, `netscript-harness`, `netscript-pr`,
`netscript-tools`, `netscript-deno-toolchain`, `jsr-audit`, and `netscript-doctrine` completely.
Read the applicable A6/package graph doctrine, dependency tooling guidance, gate documents, PR
#1315, issue #1295, and the existing tracked run `.llm/runs/fix-zod-v4-npm-alignment-1295--1295/`
before changing code. Use `rtk` for read-heavy git/gh/rg and wrap `deno task` validation as required
by the root instructions.

## Role

You are the implementation supervisor for milestone cluster T1-A: issue #1295 on existing PR #1315,
branch `fix/zod-v4-npm-alignment-1295`, worktree `/home/codex/repos/ns005-streamdb`. Run as Codex
GPT-5.6 Sol low with bypass permissions. You own this PR repair only. The milestone orchestrator
retains merge, release, canary, issue-closure, and acceptance authority. Do not merge, publish,
close issues, launch a competing agent, or perform your own formal IMPL-EVAL.

## Current evidence

- PR #1315 targets `canary/0.0.5-canary.14`; its head at dispatch is
  `c8e996f59fb01883e3340371570cd7099afbfaef`.
- The current train base is
  `origin/canary/0.0.5-canary.14@2508eb8c99c9cfc55e0c9f1d7ab72fea745db492`.
- The inherited implementation correctly makes npm Zod 4 the root catalog source, retains only the
  documented AG-UI/kvdex Zod 3 boundary, and defers the full collapse to #1320.
- Current CI is red because generated or temporary child projects contain `catalog:zod` without
  owning/inheriting the workspace root catalog. This is a generated-consumer failure, not license to
  restore JSR Zod, local version pins, or multiple version authorities.
- `deno.lock` is part of this PR's existing dependency graph, but lock churn must be limited to the
  reviewed fix. Never delete the lock or run cache reload.

## Mission

1. Fetch current refs and integrate `origin/canary/0.0.5-canary.14` into the existing public PR
   branch without rebasing or force-pushing. Resolve only real conflicts and record the exact base
   commit.
2. Reproduce the child-project `catalog:zod` failure with the smallest existing test/gate that
   proves it. Preserve RED evidence in the tracked run.
3. Fix the contract at the correct generation/workspace boundary. Generated standalone consumers
   must resolve Zod without relying on a parent catalog they do not own; in-workspace packages must
   keep one root npm catalog authority. Do not special-case a named fixture if a generic emission
   seam owns the behavior.
4. Re-run the graph guard, generated-workspace/child compile proof, relevant focused tests, scoped
   check/lint/fmt, dependency evidence, full export-map `deno doc --lint`, and `publish:dry-run`.
   Run any additional decisive gates named by the existing run and current root instructions. Verify
   no AI/MCP peer requiring Zod 4 resolves to Zod 3 and no undocumented split is introduced.
5. Update the existing run artifacts, PR body/checklist, and acceptance evidence to current
   canary.14 truth. The closing keyword may remain only because every #1295 acceptance box is
   already evidence-complete; required current-SHA train contexts must still be honestly pending
   until GitHub reports them.
6. Commit coherent changes and push only with the explicit refspec
   `git push origin HEAD:refs/heads/fix/zod-v4-npm-alignment-1295`. Do not use bare push.
7. Finish by writing a concise handoff in the run worklog: commits, exact changed files, local gate
   commands/results, current PR SHA/check state, remaining risk, and `READY_FOR_QWEN_IMPL_EVAL` or
   `BLOCKED: <evidence-backed reason>`.

## Guardrails

- Preserve unrelated dirty state and never stage it. Check status before every commit.
- Do not invent registry/version data: use the repo dependency wrappers and `deno why`/`deno doc`.
- Do not run the full CLI runtime smoke unless the changed boundary actually affects scaffold
  runtime; the generated-consumer compile and existing PR gate are decisive here.
- Formal IMPL-EVAL is a new Qwen 3.8 Max high session dispatched by the orchestrator after your
  implementation handoff. Do not cross that evaluator phase.
- Your final non-empty response line must be exactly `DONE` if the pushed PR is ready for that
  evaluator, or `BLOCKED: <reason>` if not.
