## DDX-22 / S12: Dead-Letter Queues (queue + trigger)

### Summary
"Why did messages die across KV/Redis/Postgres, show depth, let me bulk-replay." Consolidated DLQ view for the queue and trigger dead-letter surfaces.

### Scope
- DLQ depth `stats-grid` per backend; failed-message `data-table` with reason; bulk `reprocess()` action + CLI-equivalent + `confirmationMessage`.
- Data: `DeadLetterRecord` (reason/errorCode/payload), `depth()`, `reprocess()`; `TriggerDlqPort` (reason/attempts/replay).

### Non-goals
- No log/trace ownership (out-link). No panel ships before its contract route exists.

### Acceptance criteria
- Renders only once both co-req contract routes exist; bulk replay gated behind confirm.
- In ← S9 Triggers DLQ tab; in ← S7 for queue-backed workers.

### Dependencies (BLOCKING — file co-req issues now)
(a) `TriggerDlqPort` contract route — #NUM_TRIGDLQ; (b) `packages/queue` `DeadLetterStore` CLI/API — #NUM_QDLQ. **Wave:** later.
