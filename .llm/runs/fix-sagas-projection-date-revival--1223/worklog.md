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
- RED real-Redis integration artifact: `evidence/red-real-redis.txt` reports
  `FAILED | 0 passed |
  1 failed` and `TypeError: metadata.createdAt.toISOString is not a function`
  from `projectionState()` after asserting Redis returned `createdAt` as a string.
- Implemented private `projectionDates`/`revivePersistedDate` normalization. It accepts only valid
  runtime `Date` values or persisted date strings, supplies actual Dates to Prisma, serializes ISO
  strings for the KV read model, and leaves the exported projection contract unchanged.
- GREEN real-Redis artifact: `evidence/green-real-redis.txt` reports `1 passed | 0 failed` for the
  identical Redis round-trip and projection.
- Focused sagas tests: `49 passed`, `0 failed`, one environment-gated Redis test ignored in the
  package-wide run; its separately provisioned real-Redis run is green.
- Scoped plugin check/lint/fmt: 83 files, zero findings. `quality:gate` and `arch:check` passed with
  only repository-baseline warnings. No export moved, so doc-lint was not triggered.
- Redis/Garnet fresh scaffold: populated Healthy reports, four publish 200s, definition plus two
  projected instances, four correlated saga spans including `outcome=compensated`, and state intact
  after runner/API restart.
- Deno KV fresh scaffold: selected shared Container mode so the API and runner compose through one
  `DENO_KV_URL`; the same lifecycle, OTEL correlation, compensation, and restart checks passed.
- A process-local Deno KV exploratory start was healthy but correctly could not compose two
  processes. It was not used as backend evidence. Shared Container mode is the verified AppHost
  topology.
- Ownership-aware teardown removed all reported run-owned containers and left the foreign wave5
  Postgres container untouched.
- Posted the full protocol on #1223:
  https://github.com/rickylabs/netscript/issues/1223#issuecomment-5178895344
- Posted the post-fix joint recording on #1190:
  https://github.com/rickylabs/netscript/issues/1190#issuecomment-5178899824
- Final review-thread gate: PASS (`threads=0`, `unanswered=0`). Final leak check: no run-owned
  survivors; the single foreign wave5 Postgres container remained untouched.
- Handoff: PR #1224 has the complete evidence and truthful DoD checks and is ready for orchestrator
  merge authority after the final explicit-refspec push and ready transition.
