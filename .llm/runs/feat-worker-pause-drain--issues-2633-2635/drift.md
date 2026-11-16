# Drift

None yet. Initial findings are code/docs spot-checks, not runtime reproduction. Existing owner-selected implementation session does its own planning under the user no-helper-agent instruction; separate independent evaluator sessions remain mandatory. T3 requires a fresh delegate task for each review/recheck, overriding same-evaluator-session steering in local policy; carry prior context into each brief.


Research corrections: task callbacks do not use activeJobs, so drain waits per-listener generation barriers rather than that map. Native Deno KV explicit nack is a no-op, requiring portable enqueue-before-ack handback. AMQP pinned provider defaults native retry off and double-acks async handlers; native upstream cancel/confirmed handback is necessary for the feature, with baseline transport failure distinguished from accounting evidence. Initial Postgres fixture schema race was a harness failure, corrected before recording product reproduction. The new Worker budget is25s total, with19s work/5s abort cleanup/1s settlement, preserving5s parent work headroom without stacking PR2641.


Plan-evaluator corrections: actual docs path tune-worker-runtime.md, not a directory index; exact generated carriers named. A committed claim racing pause is an ordinary charged requeue; draining handback preserves the attempt. The latter follows the already locked shutdown-only opt-in and is pinned by an S4 race test.


S3a stays within approved adapter scope. Its handback storage-failure test exposed an unjoined callback rejection; red fault test precedes the error-propagation fix, which keeps the original processing entry durable and fails the listener. Native listener post-intake expiry can resolve a pause generation before handlers finish;3real/scaled owner cases red with3default controls green. That rework-forcing contract discovery is stopped at a separate plan checkpoint, with exact proposal/files/gates in plan-intake-drain-addendum.md. No new-option implementation yet.
