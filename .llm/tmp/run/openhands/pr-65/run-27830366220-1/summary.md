# PLAN-EVAL summary — Capability Caveats Fix Track (W2)

Run-id: `fix-capability-caveats--w2fixes` · Branch family: `fix/cap-caveat-*` · Base: `main`
Trigger: `@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment run PLAN-EVAL`
Session: 27830366220-1 (PLAN-EVAL — separate from generator/IMPL-EVAL sessions)

## Summary

Evaluated the W2 plan in `.llm/tmp/run/fix-capability-caveats--w2fixes/plan.md` against
`.llm/harness/gates/plan-gate.md` and `.llm/harness/evaluator/plan-protocol.md`. Spot-checked
every cited code line against current `main` (see Evidence table in `plan-eval.md`).

**Verdict: `PASS`** — every Plan-Gate box satisfied; implementation may begin under the
plan's sequencing `S1 → S2 → S4 → S5 → S3`.

The plan is correctly scoped to the 5 real W2 caveats the audit identified, is contract-first
where applicable, names per-slice acceptance gates, and respects doctrine constraints (no
catalog/version-pin/lock changes except a reviewed S5 dep; Option-A catalog law holds
vacuously; LD-7 CLI-publishes-last and "No JSR publish here" are explicit; S1 enforces
"deno.lock unchanged"). Sequencing puts the cheap, high-value fix (S1) first and the riskiest
(S3) last.

## Changes

Files created (deliverable evidence):

- `.llm/tmp/run/fix-capability-caveats--w2fixes/plan-eval.md` — full PLAN-EVAL report with
  checklist table, evidence spot-check table, per-slice risk notes, open-decision sweep,
  sequencing evaluation, and verdict.
- `/home/runner/work/_temp/openhands/27830366220-1/summary.md` — this file (the run summary).

No code, plan, manifest, doctrine, or lock files were authored or modified. No implementation
was performed — this is a plan review only, per the trigger.

## Validation

- Read `AGENTS.md`, `.llm/harness/evaluator/plan-protocol.md`, `.llm/harness/gates/plan-gate.md`,
  `.llm/harness/gates/archetype-gate-matrix.md`, and `.llm/harness/debt/arch-debt.md` for
  gate criteria.
- Read the full plan (`.llm/tmp/run/fix-capability-caveats--w2fixes/plan.md`) and the supporting
  audit bundle (`.llm/tmp/run/fix-capability-caveats--w2fixes/audit/{capability-truth-matrix,
  caveats-and-gaps,missing-and-miscategorized}.md`).
- Spot-checked 11 code cites against current `main` (see table in `plan-eval.md` §
  "Evidence spot-check"): all five slice problem statements have real, current-`main`
  evidence. Notable findings:
  - `packages/service/src/builder/service-rpc.ts` default `rpcPath = '/api/rpc'` confirmed.
  - CLI template drift sources confirmed (init-orchestrator + generate-readme both stringify
    `/rpc`).
  - `plugins/triggers/src/runtime/trigger-runtime-processor.ts:94` `if (action.kind === 'defer')
    return;` confirmed; `DeferAction = Readonly<{ kind: 'defer'; until: string }>` and
    `EnqueueOptions.delay?: number` together make the contract-first (a)-implementation
    feasible in S2.
  - `stream-api.ts:28` empty publish and `:43` no-op unsubscribe confirmed.
  - `create-durable-stream.ts:118` drops writes when `#connectError` set; `:222` flush throws
    (plan cites `:118`; `:222` is the secondary cite).
  - `multi-runtime-task-executor.ts:147` in-memory `TaskExecutorSpan` confirmed; reusable
    `traceJobExecution` exists at `packages/telemetry/src/instrumentation/worker.ts:202`.
  - `create-queue.ts:221` rejects `QueueProvider.Postgres` with `QueueConfigurationError`.
- Confirmed doctrinal posture: `packages/queue` is already an `AP-16` debt entry (mod.ts
  shape) but does not overlap with S5 (Postgres adapter implementation). No debt collisions.
- Confirmed no overlapping open work for S3 in the run dir (`DurableStreamConsumer` does
  not yet exist in `packages/plugin-streams-core`); S3's plan self-flags this with a
  STOP-and-rescope escape hatch, which is appropriate and not a plan-gate blocker.

## Responses to review comments or issue comments when relevant

The trigger is a `@openhands-agent ... run PLAN-EVAL` issue comment on PR #65. The PR-comment
output_mode means the workflow will post the verdict on the PR/issue. This evaluator did not
post the comment itself (per the operational contract: "Do not post GitHub issue or PR
comments directly. The workflow owns GitHub comments."). The verdict lives in
`.llm/tmp/run/fix-capability-caveats--w2fixes/plan-eval.md` and is summarised here.

No existing PR review-thread comments require reply (`output_mode=pr-comment` does not
imply `thread-replies`), so no `replies.json` was written.

## Remaining risks

- **S3 consumer scope risk (evaluator-flagged, plan-permitted).** `defineStreamConsumer()
  .subscribe` requires a real `DurableStreamConsumer` to satisfy the integration-test
  acceptance gate "publish to a topic → consumer receives". No such class currently exists
  in `packages/plugin-streams-core`. The plan permits either (a) introduce a
  `DurableStreamConsumer` behind the existing `StreamProducerPort`/`StreamConsumerPort`
  interface, or (b) rescind S3 to "wire producer only, document consumer as future work" and
  add a debt entry under `.llm/harness/debt/arch-debt.md`. The IMPL-EVAL pass will need to
  enforce one of those paths. This is **not** a plan-gate blocker because the plan already
  self-flags it with "If the transport surface is larger than this plan implies, STOP and
  rescope (record in drift.md)."

- **S2 defer semantics.** The plan leaves "implement vs reject-and-debt" open with a
  preference for implement given `DeferAction.until` and `EnqueueOptions.delay`. IMPL-EVAL
  will resolve in-place; not a re-doer if deferred.

- **S5 dep review.** If maintainer review rejects the proposed Postgres dep, IMPL-EVAL must
  fall back to debt entry and document Postgres as future work — already accommodated by
  the plan's catalog-only / do-not-de-catalog framing.

- **Plan-cited line offsets are slightly stale.** `init-orchestrator.ts:112` → `:120` and
  `generate-readme.ts:140` → `:149` in current `main` (drift of +8 / +9 lines). Drift on
  the cite numbers but not on the cited strings — references remain unambiguous and the
  drift does not change the verdict.

- **Catalog/Option-A/LD-7 are vacuously compliant.** No slice touches catalog/version pins/
  lock files; S1 explicitly states "deno.lock unchanged." The plan's compliance posture is
  correct but relies on IMPL passes honouring the same constraints during implementation.

This evaluation did not run any implementation, deno check, deno test, scaffold runtime
E2E, or other runtime gates — per the protocol, IMPL-EVAL owns those.
