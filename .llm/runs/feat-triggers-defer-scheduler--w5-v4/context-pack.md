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
S0–S3 are pushed. S4 is complete: both caveat markers and stale call-outs are gone, debt is closed,
and runtime/static/docs/JSR/publish/quality/architecture/plugin verification gates are green. Commit
S4 is pushed, all four issue boxes carry earned evidence, and PR #1283 is ready. The composed
draft→ready surface completed with zero failures: check-test, quality, code-quality, close-gate,
surface-diff, scaffold-static, lane visibility, and dependency checks are green. Record the final
evaluation artifact/sign-off commit, push it explicitly, and keep status at ready-merge once its
lightweight rerun is green.
