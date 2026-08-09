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
- [x] S5 complete gates and separate-session IMPL-EVAL handoff

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
- #1202 row 2 invariant: the RED-first generator guard proves no endpoint-persisting path exists in
  the database wiring: `DATABASE_URL` stays lazily bound to `infrastructure.primaryDatabase`, with
  no eager endpoint lookup or allocated authority serialized into scaffold output. The two-allocation
  runtime receipt proves that invariant holds across consecutive starts. Historical mechanism
  identification is split to #1396; this PR makes no causal claim about the original reproductions.
- Fifth `scaffold.runtime`: raw exit 1, `passed=61 failed=1`. Migration artifacts, both allocation
  captures, structural endpoint comparison, and documented health validation passed in the same run.
  `behavior.live-db-endpoint` reached telemetry retrieval, then `aspire otel logs users` exited 12
  because the Aspire CLI reported the dashboard was unavailable. Trace retrieval and shared-ID
  correlation were not reached. Cleanup, leak artifacts, and review threads passed; no retry or
  repair was attempted. Rows 1, 3, and 4 remain unchecked; row 2 remains checked.
- Detached-dashboard telemetry repair: extracted the existing Flow-B OTLP normalizer into one shared
  trace/log adapter and routed both Flow-B and live-DB validation through start metadata plus
  `AspireTelemetryQuery`. Correlation polls 20×500 ms and requires one trace ID shared by users
  structured logs and OTEL traces. Mismatch output names both ID sets and candidate spans. Contract
  RED exited 1; focused green exited 0 with 47 passed, 0 failed. Scoped check/lint/format,
  `quality:gate`, and `arch:check` exit 0.
- Sixth `scaffold.runtime`: raw exit 0, `passed=80 failed=0`. All four decisive gates passed in the
  same run. `behavior.live-db-endpoint` reached comparison, found a trace ID shared by non-empty
  users structured logs and OTEL traces, and wrote the endpoint/health/telemetry receipt. The
  following Flow-B stream, grouped trace, and detached task telemetry gates also passed. Pre/post
  leak artifacts show no W2-C-owned or unknown survivor; review threads pass 0/0. First-start
  endpoint binding is proven structurally; the direct health probe runs after the second start,
  which is the stricter re-allocation case.
- Applied database state is verified through `prisma migrate status`, which reads Prisma's
  `_prisma_migrations` table, in addition to the migration-file inventory.
- Separate-session Fable 5 IMPL-EVAL independently re-ran 5 database and 42 CLI/E2E focused tests
  and added eleven adversarial probes; all invalid endpoint, health, and telemetry cases were
  rejected. Its sole `FAIL_FIX` finding was this evidence wording, resolved by the owner ruling that
  amended #1202 row 2 and split historical identification to #1396. No product-code or runtime rerun
  was requested.

## Harness

- Run dir: `.llm/runs/release-0.0.5--orchestration/slices/w2-c-1202-1327/`
- Phase: IMPL-EVAL wording remediation complete → ready-merge handoff
- Required gates and Tier-A review are complete; the separate-session evaluator's sole wording
  finding is corrected under the owner ruling recorded on PR #1393.

## Drift / Debt

- Shared-contract file absent from `origin/main`; the inlined launch contract is authoritative.
- Existing CLI maintainer/public-mixing and permission-doc debt is accepted and must not deepen.

## Definition of Done

### #1202 acceptance

- [x] Fresh users service matches the first live Postgres allocation structurally; the direct
      health probe is green after the stricter second-start re-allocation.
- [x] A RED-first guard proves no persisting path exists: database wiring remains a lazy
      `infrastructure.primaryDatabase` binding and serializes no allocated endpoint. Two-allocation
      runtime evidence proves the invariant; original-mechanism identification is tracked in #1396.
- [x] A second consecutive AppHost allocation remains matched and healthy.
- [x] Health JSON plus a shared trace ID across structured logs and OTEL prove the live receipt.

### Slice completion

- [x] `db migrate` success names and verifies created migration files and applied database state via
      `prisma migrate status`, which reads `_prisma_migrations`.
- [x] Headless inability to create a migration fails non-zero with an actionable next command.
- [x] `db deploy` is the only deploy-only verb and output separates created/applied sets.
- [x] TTY and non-TTY schema-change E2E proves files and database state, with deploy/no-change
      controls.
- [x] Two consecutive starts prove users receives the live Postgres allocation via health, logs, and
      OTEL.
- [x] Required static, quality, doctrine, publish, resource-health, and serialized runtime gates
      pass.
- [x] Separate-session IMPL-EVAL completed; its sole wording finding is resolved by the owner ruling
      and this evidence correction.

```acceptance-evidence
issue: 1202
entries:
  - box-index: 1
    evidence: "https://github.com/rickylabs/netscript/pull/1393#issuecomment-5228877485 — sixth scaffold.runtime receipt: first allocation authority matched structurally; direct health JSON passed after the stricter second start"
  - box-index: 2
    evidence: "https://github.com/rickylabs/netscript/pull/1393#issuecomment-5228877485 — pristine-scaffold-ports_test.ts RED-first no-persisting-path guard plus two-allocation runtime receipt; historical identification split to #1396"
  - box-index: 3
    evidence: "https://github.com/rickylabs/netscript/pull/1393#issuecomment-5228877485 — runtime.capture-db-allocation-first, runtime.capture-db-allocation-second, and behavior.live-db-endpoint passed in one run"
  - box-index: 4
    evidence: "https://github.com/rickylabs/netscript/pull/1393#issuecomment-5228877485 — health JSON and one trace ID shared by non-empty structured logs and dashboard OTEL traces"
```

```acceptance-evidence
issue: 1327
entries:
  - box-index: 1
    evidence: "https://github.com/rickylabs/netscript/pull/1393#issuecomment-5228877485 — database.migration-artifacts gate and runMigrationWithArtifacts focused suite"
  - box-index: 2
    evidence: "https://github.com/rickylabs/netscript/pull/1393#issuecomment-5228877485 — TTY/non-TTY schema-change E2E: migration.sql inventory plus prisma migrate status over _prisma_migrations"
  - box-index: 3
    evidence: "https://github.com/rickylabs/netscript/pull/1393#issuecomment-5228877485 — headless no-artifact negative control: non-zero result with exact interactive next command"
  - box-index: 4
    evidence: "https://github.com/rickylabs/netscript/pull/1393#issuecomment-5228877485 — deploy-only control: db deploy is distinct and leaves the migration artifact inventory unchanged"
  - box-index: 5
    evidence: "https://github.com/rickylabs/netscript/pull/1393#issuecomment-5228877485 — migration-artifact E2E asserts separate Created migrations and Applied migrations output"
  - box-index: 6
    evidence: "https://github.com/rickylabs/netscript/pull/1393#issuecomment-5228877485 — database.migration-artifacts gate exercises real PTY and non-TTY schema mutations, files, and applied database state"
```
