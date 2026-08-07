use harness

## SKILL

Read and follow the target worktree root `AGENTS.md`, `netscript-harness`, `netscript-pr`,
`netscript-tools`, `netscript-deno-toolchain`, `jsr-audit`, and `netscript-doctrine` completely.
Read the formal evaluator artifact
`.llm/runs/fix-zod-v4-npm-alignment-1295--1295/evaluate.md`, issue #1295, PR #1315, the full
tracked run, the A6/package-quality and release-gate documents, and every affected public export
before changing code.

## Role

Resume as the sole implementation supervisor for milestone cluster T1-A on worktree
`/home/codex/repos/ns005-streamdb`, branch `fix/zod-v4-npm-alignment-1295`, PR #1315. The formal
Qwen IMPL-EVAL returned `FAIL_FIX`; do not cross back into evaluation. The milestone orchestrator
retains issue acceptance, merge, train, release, and canary authority. Do not merge, publish,
close issues, launch another agent, or self-certify the repair.

The supported durable sender requires this existing thread to resume. The active resumed route is
Sol medium, already recorded as C-D9; the additional judgment is justified by the cross-package
public-type repair and foreign-config consumer boundary. Keep the repair bounded to the evaluator
findings.

## Exact target

- Current head at repair dispatch: `d0aa6a22da64671ea7070af99374950ddb245fa3`.
- Evaluated product head: `9f5ef7dcb55668a6649c5451266908ad8e29b15c`.
- Base: `canary/0.0.5-canary.14@2508eb8c99c9cfc55e0c9f1d7ab72fea745db492`.
- Evaluator: Qwen high session `f516aada-2a74-4dad-821e-b20963fe2983`.
- Lifecycle is back to `status:impl`; the PR must remain draft.

Fail closed if the branch/head differs, if unowned dirty state appears, or if the evaluator artifact
is missing. Preserve `deno.lock`; never delete it or reload caches.

## Required repair

1. Remove the PR-introduced full-export doc-lint regression: the canary.14 baseline comparison found
   70 new private-type-reference errors (55 distinct sites in 14 files) across eight publishable
   roots. Apply a coherent public structural-contract/inference pattern; do not paper over errors,
   add suppressions, or special-case individual packages. Re-run the same 19-root baseline-diff
   sweep and record actual error counts, not only wrapper exit codes.
2. Restore the detached Fresh streams consumer gate. `packages/fresh` task
   `check:streams-types` passes on canary.14 but fails at the evaluated head with
   `Package 'zod' not found in catalog`. Fix catalog ownership at the foreign-config root or use an
   equally portable public-package seam. Add coverage so the member check chain cannot silently
   fall outside the root CI path.
3. Correct every unsupported evidence claim in the run and PR: worklog gate row, handoff, PR
   checklist/validation text, acceptance-evidence row, context pack, supervisor metadata, drift,
   and commit-slice record. Do not mark issue acceptance complete from stale evidence.
4. Run the exact mandatory one-pass merge-readiness smoke after the code repair:
   `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`. Capture raw exit, 73-suite
   summary or current authoritative count, endpoint/background/OTEL proof, cleanup, and the
   read-only post-run leak report. Do not split the command.
5. Re-run every earlier decisive gate: emitted samples with negative case, focused tests,
   `check:streams-types`, Zod graph guard and peer binding, scoped check/lint/fmt, `quality:gate`,
   docs links/accuracy, full export-map doc lint with canary baseline comparison, and serial
   `publish:dry-run`. Verify manifests and lock are restored and the tree contains only reviewed
   changes.
6. Treat evaluator low findings honestly: do not broaden this product repair merely to change the
   doc-lint wrapper; record the exit-code trap and catalog-fixture limitations in run artifacts.

## Handoff

Commit coherent changes, push only with
`git push origin HEAD:refs/heads/fix/zod-v4-npm-alignment-1295`, and leave the PR draft at
`status:impl`. Finish with exact changed files, commits, commands/results, current PR SHA/checks,
lock/resource hygiene, remaining risk, and `READY_FOR_FRESH_QWEN_IMPL_EVAL` or
`BLOCKED: <evidence-backed reason>`. The final non-empty response line must be exactly `DONE` when
ready, or `BLOCKED: <reason>`.
