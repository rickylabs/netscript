# Worklog

## 2026-08-04

- Read #1223 and the prior #1190 protocol evidence.
- Activated harness, PR, doctrine, CLI/tooling, and Aspire instructions.
- Created `fix/sagas-projection-date-revival` from current `origin/main` with no upstream.
- Confirmed the defect boundary: Redis JSON persistence revives no `Date` objects, while the
  projection calls `toISOString()` directly.
- Locked the plan; PLAN-EVAL is composed per milestone-run.md (orchestrator waiver).
- Leak reporter found only the explicitly foreign wave5 Postgres container; it was left untouched.
- Started slice-owned `ns1223-projection-red` Redis on `127.0.0.1:46379`.
- RED real-Redis integration artifact: `evidence/red-real-redis.txt` reports `FAILED | 0 passed |
  1 failed` and `TypeError: metadata.createdAt.toISOString is not a function` from
  `projectionState()` after asserting Redis returned `createdAt` as a string.
