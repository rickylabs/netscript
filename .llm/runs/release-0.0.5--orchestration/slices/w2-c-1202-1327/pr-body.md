## Summary

Make `db migrate` prove the migration it creates and applies, and prove scaffolded users services
bind the live Postgres allocation across consecutive AppHost starts.

## Scope

- Archetype / area: Archetype 6 CLI/tooling · CLI/database/Aspire scaffold
- Closes #1327
- Closes #1202

## Slices

- [x] S1 lock research, design, RED contracts, and issue boundary
- [x] S2 implement migration artifact and applied-state semantics
- [x] S3 add TTY/non-TTY generated-project migration E2E controls
- [x] S4 prove two-allocation live Postgres/users health and telemetry identity
- [ ] S5 complete gates and separate-session IMPL-EVAL handoff

## Validation

- Baseline Git and live issue re-verification — exit 0
- Focused/scoped/quality/doctrine/doc/publish gates — exit 0
- Granted one-pass `scaffold.runtime` — raw exit 0, `passed=76 failed=0`; pre/post leak reports show
  no W2-C-owned survivor and review-thread gate passed with 0 unanswered threads.
- Coverage limitation: that pass exposed an explicit-suite allowlist omission, so it did not execute
  the four new W2-C acceptance gates. The selector repair is focused-green (16/16 registry tests),
  and Tier-A granted a fresh serialized pass.
- Tier-A test restoration: raw exit 0, 3/3 focused helper tests passed, including both restored
  `isNoRunningAppHostOutput` cases.
- Repaired-selector `scaffold.runtime`: raw exit 1, `passed=33 failed=1`.
  `database.migration-artifacts` executed and failed after creating/applying its PTY artifact
  because the spawn adapter accessed inherited (unpiped) stderr. Both allocation gates and
  `behavior.live-db-endpoint` were not reached. Cleanup passed and postflight leak evidence shows no
  W2-C-owned survivor. No retry was attempted.
- PTY spawn repair: behavioral RED raw exit 1 reproduced the inherited-stderr getter TypeError;
  focused green raw exit 0, 5 tests / 10 steps passed. Third serialized pass granted at fixed head.
- Third `scaffold.runtime`: raw exit 1, `passed=61 failed=1`. `database.migration-artifacts` and
  both allocation captures passed. `behavior.live-db-endpoint` failed because its validator rejected
  keyword syntax `Port=45103` while the live URL used the same port as `:45103`; it stopped before
  correlated health/OTEL receipt generation. Cleanup and postflight leak verification passed; no
  retry was attempted.
- Live-endpoint validator repair: contract RED raw exit 1; focused green raw exit 0 with 28 passed,
  0 failed. Scoped check/lint/format, `quality:gate`, and `arch:check` all exit 0. The parser now
  compares validated numeric ports across explicitly enumerated URL and Npgsql keyword dialects;
  deliberate mismatch and missing-port controls fail with source-specific diagnostics.
- Fourth `scaffold.runtime`: raw exit 1, `passed=61 failed=1`. In this single run,
  `database.migration-artifacts` and both allocation captures passed. `behavior.live-db-endpoint`
  advanced through structural endpoint comparison, then failed because the health validator expects
  per-check `status: "healthy"` while the live HTTP 200 payload uses `healthy: true`. It did not
  reach structured-log/OTEL correlation. Cleanup, postflight leak evidence, and review threads
  passed; there was no retry or repair.
- Health matcher repair: derived from `@netscript/service`'s `HealthResponse` producer contract,
  with the real fourth-pass HTTP response checked in as a fixture. Contract RED exited 1; focused
  green exited 0 with 30 passed, 0 failed. The negative fixture retains healthy aggregate status
  while setting the database check to `healthy: false`, proving check details remain authoritative.
  Scoped check/lint/format, `quality:gate`, and `arch:check` exit 0.
- #1202 row 2 mechanism: eager `getEndpoint("tcp")` materialization serializes one AppHost
  allocation into generated `DATABASE_URL`. The RED-first guard forbids it and requires lazy
  `infrastructure.primaryDatabase` resource binding so the endpoint resolves afresh on every start.
- Fifth `scaffold.runtime`: raw exit 1, `passed=61 failed=1`. Migration artifacts, both allocation
  captures, structural endpoint comparison, and documented health validation passed in the same run.
  `behavior.live-db-endpoint` reached telemetry retrieval, then `aspire otel logs users` exited 12
  because the Aspire CLI reported the dashboard was unavailable. Trace retrieval and shared-ID
  correlation were not reached. Cleanup, leak artifacts, and review threads passed; no retry or
  repair was attempted. Rows 1, 3, and 4 remain unchecked; row 2 remains checked.

## Harness

- Run dir: `.llm/runs/release-0.0.5--orchestration/slices/w2-c-1202-1327/`
- Phase: implementation → IMPL-EVAL handoff with disclosed runtime-evidence gap
- Do not merge until required gates, Tier-A review, and separate-session IMPL-EVAL PASS are
  complete.

## Drift / Debt

- Shared-contract file absent from `origin/main`; the inlined launch contract is authoritative.
- Existing CLI maintainer/public-mixing and permission-doc debt is accepted and must not deepen.

## Definition of Done

### #1202 acceptance

- [ ] Fresh users service matches the first live Postgres allocation and reports database health.
- [x] Persisting mechanism identified RED-first: eager `getEndpoint("tcp")` materialization
      serializes one allocation into `DATABASE_URL`; the guard requires lazy
      `infrastructure.primaryDatabase` binding.
- [ ] A second consecutive AppHost allocation remains matched and healthy.
- [ ] Health JSON plus a shared trace ID across structured logs and OTEL prove the live receipt.

### Slice completion

- [x] `db migrate` success names and verifies created migration files and applied database state.
- [x] Headless inability to create a migration fails non-zero with an actionable next command.
- [x] `db deploy` is the only deploy-only verb and output separates created/applied sets.
- [ ] TTY and non-TTY schema-change E2E proves files and database state, with deploy/no-change
      controls.
- [ ] Two consecutive starts prove users receives the live Postgres allocation via health, logs, and
      OTEL.
- [ ] Required static, quality, doctrine, publish, resource-health, and serialized runtime gates
      pass.
- [ ] Separate-session IMPL-EVAL passes.
