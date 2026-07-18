# IMPL-EVAL — PR #793 (fixes #792, sub-slice B of #781)

- Evaluator: Claude Fable 5 · low (opposite-family, separate session) — route `review_codex`
- Generator: Codex GPT-5.6-Sol · medium, run dir `.llm/runs/fix-781b-workers-sample-trigger--codex/` (worktree `/home/codex/repos/b10-781b`)
- Subject: branch `fix/781b-workers-sample-trigger` @ `1da63ecf`, base `origin/feat/beta10-integration`
- Date: 2026-07-16

## Verdict

**PASS**

## Rationale

The slice does exactly and only finding 9 of #781: removes the embedded sample export-notification
schema and `DEFAULT_QUEUE_TRIGGERS` from `plugins/workers/worker/worker-options.ts`, resolves only
explicitly configured `WorkerOptions.queueTriggers` via a new typed `resolveWorkerQueueTriggers`
helper, and proves omission/preservation/no-aliasing in a colocated regression. Independently
re-verified: no consumer anywhere (scaffold templates, e2e fixtures, docs, packages) references the
removed symbols or the `export-notifications`/`notify-export-complete` names; the focused tests and
scoped check pass locally; the canonical scaffold.runtime suite genuinely gates the workers
trigger/execution path.

## Probe answers

1. **Does removing the implicit trigger break existing consumers?** No. Repo-wide grep (excluding
   run artifacts) for `DEFAULT_QUEUE_TRIGGERS`, `ExportNotificationSchema`, `export-notifications`,
   `notify-export-complete` returns zero hits. No caller anywhere passes `queueTriggers` today
   (only `worker.ts` construction and `queue-consumer.ts` consumption), so all consumers were
   getting a dead sample-domain listener; removal is behavior-cleanup, not a break.
2. **Opt-in surface contract-first and typed?** Yes. `WorkerOptions.queueTriggers?: readonly
   QueueTriggerConfig[]` remains the sole seam — typed `QueueTriggerConfig` objects, no string
   config. The resolver returns a frozen copy (no caller-array aliasing) and is internal: package
   exports (`plugins/workers/deno.json`) never exposed `./worker`, so no public API removal.
3. **Scaffold default experience still works, and does scaffold.runtime cover workers
   trigger/execution?** Yes. `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts`
   includes "List worker jobs/tasks", "Seed worker demo data", "Trigger workers plugin health job",
   "List recent worker executions" (executions asserted `completed`), plus durable CLI verbs and
   Flow-B telemetry. The generator's 60/60 `scaffold.runtime --cleanup` run therefore exercises the
   worker trigger→execution path; the health-job path uses the task-queue listener, independent of
   the removed sample queue trigger.
4. **Re-ran tests myself:** `deno test plugins/workers/worker/worker-options_test.ts` → 2 passed /
   0 failed. Scoped `run-deno-check.ts --root plugins/workers/worker --ext ts` → 19 files, zero
   diagnostics.
5. **New suppressions:** none. Diff adds no `deno-lint-ignore`/`ts-ignore`/quality allowance;
   worklog records changed-file quality scan clean and repo scan at the two pre-existing baseline
   findings (streams/proxy.ts:180, triggers/producer.ts:34) unchanged.
6. **Scope discipline:** clean. Code diff touches only `worker-options.ts`, `worker.ts`, the new
   `worker-options_test.ts`; everything else is run artifacts. No CLI/scaffold/generator changes,
   no queue redesign, no #781 creep.

## Findings

1. (info) First scaffold.runtime attempt failed at `database.init` from a replaced Deno executable
   (`deno (deleted)` fork ENOENT); correctly classified environmental in drift.md and rerun 60/60
   from unchanged `29aa84e3`. Accepted.
2. (info) PLAN-EVAL was not run as a separate session — the generator recorded this in drift.md and
   the owner brief reserved evaluator dispatch to the supervisor; this pass is that dispatch.
   Process deviation is documented, not hidden. No action.
3. (advisory, non-blocking) PR base is `feat/beta10-integration` (non-default), so GitHub will NOT
   auto-close #792 on merge despite the correct `Closes #792` keyword — known repo gotcha; the
   merging supervisor must close #792 manually with a merge-SHA comment.
4. (advisory, non-blocking) `resolveWorkerQueueTriggers` is exported from `worker-options.ts` though
   the plan said keep it internal; it is not reachable through package `exports`, so the public
   surface is unchanged. No action required.
5. (info) Close-gate: PR DoD checklist complete except the IMPL-EVAL box, which this verdict
   satisfies; supervisor may flip `status:impl-eval` → `status:ready-merge`.

## Evidence

- Diff: `git diff origin/feat/beta10-integration..1da63ecf` — 3 code files + 6 run-artifact files.
- Consumer sweep: repo-wide grep, zero non-run-artifact hits for removed symbols/queue names.
- Gate list: `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts` lines 143–172, 517–528.
- Local re-run: focused test 2/0; scoped check 19 files clean.
- PR #793 body: `Closes #792`, `Part of #781`, labels `type:fix`, `area:plugins`, `priority:p1`,
  `status:impl-eval`.
