# PLAN-EVAL (targeted amendment) — queue-port test seam (issue #2066, fix-worker-job-cancellation--c2)

- Plan evaluator session: independent GLM max (opencode-go/glm-5.3-flash), same independent session
  retained per brief; doctrine/harness/gate context carried over; no baseline forensics repeated.
- Run: `fix-worker-job-cancellation--c2`
- **Exact current head:** `b1078f01abbeed14cecb3e27be6f9945bfcaf2b0` ("docs(harness): propose
  existing queue ports for cancellation lifecycle proof") — adds only run artifacts (plan.md
  "Queue-port test seam amendment" + this brief); working tree matches HEAD; **no source/config/
  lock change exists — implementation not begun**.
- Prior PLAN-EVAL PASS: `6d6bca2cdb4361c17779e079ce6e7331510c8233` (verified ancestor), including
  the ratified post-PASS notes (advisories A1–A6, task-dispatcher cancellation explicitly deferred).
- Surface / archetype: Archetype 3 runtime behavior (`plugins/workers` + `@netscript/plugin-workers-core`);
  scope overlay: issue #2066 lifecycle proof seam.

## Checklist results (targeted amendment scope)

| Plan-Gate item | Result | Evidence / location |
| -------------- | ------ | ------------------- |
| Research present and current | PASS | The amendment's load-bearing inspection claims were re-verified against the working tree and are all TRUE: job queue constructed internally at plugins/workers/worker/worker.ts:169 (`createQueue<JobMessage>(...) as TracedQueue<JobMessage>` — the traced subtype the amendment removes from the seam typing); task queue constructed inside `startTaskQueueListener` at plugins/workers/worker/queue-consumer.ts:54 and handed over via the existing `queueContext.setTaskQueue(...)`; trigger queues also constructed internally (queue-consumer.ts:35) but explicitly unchanged by the amendment; `WorkerOptions` (plugins/workers/worker/worker-options.ts:128) has no queue fields today and already imports `MessageQueue` from `@netscript/queue`. |
| Decisions locked | PASS | plan.md lines 39–41: optional `queue?: MessageQueue<JobMessage>` / `taskQueue?: MessageQueue<TaskMessage>` on the existing `WorkerOptions`; default construction identical; worker owns and stops supplied queues exactly as defaults (worker.ts:217–223 already implements stop ownership for both the job queue and the task queue — the supplied path inherits it); seam types against the existing `MessageQueue` port, not a traced subtype (traced defaults satisfy the port — `createQueue`/`traceQueue` return `MessageQueue<T>`); no new interface, remote API, or trigger-queue change. |
| Open-decision sweep | PASS | Plan states none open. Evaluator sweep: (1) supplied-queue unavailability after stop — documented reviewable behavior, not rework-forcing; (2) trigger-queue injection — explicitly out of scope, safe to defer; (3) adapter reuse semantics (MemoryQueueAdapter throws on double-listen and is stopped by the worker) — per-scenario adapter construction in the parameterized test, implementation detail; (4) typing of the private `TracedQueue` field for the default path — internal to worker.ts, defaults unchanged. No deferred decision would force rework. |
| Commit slices (< 30, gate + files each) | PASS | S2 gains worker-options.ts, worker.ts, queue-consumer.ts + adjacent lifecycle test — still < 30 files; ordered inside the existing S1(done)/S2/S3 structure; gates named (existing failure-path/lifecycle gates cover the seam; defaults covered by existing tests; causal mutations per cause scenario with restore+pass). |
| Risk register | PASS | "Supplied queues become unavailable after stop" with the mitigation of explicit ownership documentation making it reviewable; base-plan risks (shipment deferred behind coordinated release; non-cooperation/CPU limits) retained above. |
| Gate set selected | PASS | Consistent with the original Arch-3 adjudication: lifecycle/failure-path tests are the runtime gate surface; no distributed topology or service wiring change, so Aspire/health remains n/a as previously recorded; structured check/test/lint/fmt, quality:scan + arch:check, JSR publish/doc audits unchanged. No dependency resolution change → no cold consumer gate needed (no manifest/lock edge). |
| Deferred scope explicit | PASS | Task-path cancellation remains explicitly deferred (ratified at the prior PASS); owner release acceptance/publication deferred; no merge. |
| jsr-audit (pkg/plugin) | PASS | The planned surface addition is two optional fields typed against the existing `@netscript/queue` `MessageQueue` port — consumer-additive, no new exported contract, slow-type risk negligible (Web/existing types only); the JSR publish/doc audits for the touched plugin remain in the base gate set. |

## Test realism (brief focus item)

The planned single parameterized test is a genuine behavioral test, not a seam-test artifact:
Worker.start → actual MemoryQueueAdapter delivery → processWorkerJob → Deno execute path →
WorkerPool → runner → handler, asserting required handler signal/deadline arrival, immediate abort
cause, terminal timeout/cancelled statuses, released idempotency claim, zero active executions, and
settled shutdown — with private-field reflection and dispatch/pool method replacement explicitly
forbidden. Causal mutations must kill each cause scenario (timeout, Worker.cancel, Worker.stop),
which ties the assertions to observable source behavior. Existing state/idempotency test adapters
are reused; no redundant fixtures.

## Scope review (brief focus item)

Additive constructor seam only: no new interface, no remote API edit, no trigger-queue change, no
new package, no executor refactor — directly enabling the base design's "public Worker cancel/stop
lifecycle exercised through existing queue test seam if available" line with a first-party adapter
instead of a traced internal subtype. Ownership/default behavior stay identical to today for any
consumer that does not supply queues.

## Open-decision sweep (evaluator-run)

None found that would force rework when deferred (candidates listed above).

## Verdict

`PASS` — the queue-port test seam amendment satisfies the Plan-Gate: additive optional dependencies
on the existing first-party `MessageQueue` port with unchanged default behavior and worker-owned
stop lifecycle, a realistic parameterized lifecycle test with per-cause causal mutations, selected
gates unchanged from the prior PASS, and no scope creep. Source implementation (S2 amendment) may
begin.

Standing conditions carried forward (not new findings): task-path cancellation remains deferred;
no release/merge/publication claims; closure may use Fixes only if issue #2066 acceptance is fully
met and no published-consumer proof is fabricated.
