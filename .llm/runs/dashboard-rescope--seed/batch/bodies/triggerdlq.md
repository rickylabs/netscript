## feat(triggers): `TriggerDlqPort` contract route

### Summary
Expose the existing port-only `TriggerDlqPort` (reason/attempts/replay) as a thin oRPC contract route under `/_netscript/triggers/dlq*` so the dashboard DLQ tab has an API.

### Scope
Contract-first: define the schema/type contract, then the route binding over the existing port. Read (list/depth) + gated replay mutation.

### Non-goals
No UI (that's DDX-22/S9). No new DLQ storage logic — wrap the existing port.

### Acceptance criteria
Route serves DLQ entries + depth; replay mutation gated. `deno check --unstable-kv` green.

### Dependencies
Blocks DDX-22 (#NUM_DDX22) and the S9 DLQ tab (#430).
