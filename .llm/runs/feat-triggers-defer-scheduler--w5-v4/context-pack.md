# Context Pack — feat-triggers-defer-scheduler--w5-v4

## Current state

Branch is based on fetched `origin/main` at `c384013662`. Issue #1229 is fully planned: replace the
plugin's unsupported/DLQ defer path with a core-owned durable one-shot replay port and KV adapter,
then compose it through the public plugin runtime. Plan is locked under D6 composed evaluation.

## Invariants

- Fake clock only; no real sleeps in scheduling/replay tests.
- Persist serializable event data, never handler closures.
- Remove records only after successful replay; use a distinct replay idempotency boundary.
- Remove both caveat markers and close debt only when full acceptance is earned.
- Preserve the inherited user-owned `deno.lock` modification; never stage it.

## Next

Draft PR #1283 is open; S0 and the explicit failing S1 RED proof are pushed. S2 now has a core-owned
port, KV adapter, deterministic memory helper, and GREEN fire/cancel/past-due/restart tests. Commit
S2 without staging plugin S3 edits, then finish S3 and the S4 gates.
