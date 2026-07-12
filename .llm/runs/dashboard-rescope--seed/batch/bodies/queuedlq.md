## feat(queue): `DeadLetterStore` CLI + contract API

### Summary
Expose `packages/queue`'s port-only `DeadLetterStore` (`DeadLetterRecord`, `depth()`, `reprocess()`) via a CLI command + a thin contract route under `/_netscript/queue/dlq*`.

### Scope
Contract-first schema; route + CLI over the existing store. Read (list/depth) + gated bulk `reprocess()`.

### Non-goals
No UI (DDX-22/S12). Wrap the existing store; no new persistence.

### Acceptance criteria
CLI lists DLQ depth + entries; contract route serves the same; bulk reprocess gated + CLI-equivalent. Green `deno check`.

### Dependencies
Blocks DDX-22 (#NUM_DDX22) — S12 queue DLQ.
