# Worklog: Prisma saga correlation selector

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1019-saga-correlation-selector--prisma-selector` |
| Branch | `fix/1019-saga-correlation-selector` |
| Archetype | `5 — Plugin Package` |
| Scope overlays | none |

## Design

### Public Surface

- No TypeScript export changes.
- Published `plugins/sagas/database/sagas.prisma` remains the database contract.

### Domain Vocabulary

- `SagaRuntimeCorrelationWhereUniqueInput` — generated Prisma selector contract.
- `SAGA_PRISMA_TEST_DATABASE_URL` — explicit opt-in for live integration execution.

### Ports

- `PrismaSagaStoreClient` — existing narrow client surface; no new port.

### Constants

- No new finite runtime vocabulary; the test environment variable is a test-edge constant.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove and align the shipped selector; add schema-driven live round-trip | Prisma generate + live test + scoped static/tests | `plugins/sagas/database/sagas.prisma`, saga-store tests/support, run artifacts |
| 2 | Record full gate and evaluator evidence | requested validation + quality/JSR/doctrine gates | run artifacts and PR evidence only |

### Deferred Scope

- Transition compound-ID selector normalization — no current consumer, so it remains latent and unchanged.

### Contributor Path

Change the shipped fragment, regenerate Prisma 7.8 types to confirm the input key, then run the opt-in Postgres test; never update only the memory fake.

### S3 Design — Augment Review Remediation

- **Public surface:** unchanged; every helper and test remains local to
  `prisma-saga-store_integration_test.ts`.
- **Domain vocabulary:** a throwaway saga database is PostgreSQL on loopback with a database name
  matching `netscript_saga_<lowercase_suffix>`.
- **Ports:** unchanged; subprocess, filesystem, and database access remain at the test edge.
- **Constants:** `PRISMA_VERSION` is the single version source for generated string specifiers; the
  static adapter import uses the same exact literal because TypeScript imports cannot interpolate.
- **Commit slice S3:** guard destructive database setup, lock Prisma 7.8.0 specifiers, make live row
  identities unique, add failure-safe cleanup, run the complete scoped and live gates, then commit
  the test plus run evidence without pushing.
- **Deferred scope:** dependency upgrades and catalog adoption remain out of scope; this slice fixes
  test safety and skew without changing the published package dependency surface.
- **Contributor path:** set an explicitly throwaway loopback URL, keep all Prisma specifiers pinned
  through `PRISMA_VERSION`, and rely on the ungated source invariant before running the live gate.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 | plan | research | Prisma 7.8 generated the reported named selector; lock churn removed. |
| 2026-08-01 | plan-eval | launch | Canonical Qwen route blocked: OpenRouter credential absent; product implementation remains stopped. |
| 2026-08-01 | plan-eval | owner override | Opus 5 supervisor PLAN-EVAL restored as authoritative; PASS conditional on C1-C3. |
| 2026-08-01 | 1 | implementation | Correlation `name:` changed to `map:`; one selector constant now drives delegate, calls, and fake. |
| 2026-08-01 | 1 | C1 | Ungated test derived `sagaId_correlationKey` from the shipped fragment and passed. |
| 2026-08-01 | 1 | live runtime | Postgres 18.3 db push + Prisma 7.8 generate + required store round-trip passed: `1 passed, 0 failed`. |
| 2026-08-01 | 1 | reconcile | PR body records C2 deployed-index consequence and C3 latent transition selector; issue/PR scope unchanged. |
| 2026-08-02 | 3 | design | Locked one-file review remediation: URL guard, exact Prisma pins, unique live rows, best-effort cleanup. |
| 2026-08-02 | 3 | validation | All scoped/static/fitness gates passed; six ungated integration guards executed in the 90-test suite. |
| 2026-08-02 | 3 | live runtime | Postgres 18.3 round-trip passed on ephemeral port 44659; remote-host opt-in was rejected without credential disclosure. |
| 2026-08-02 | 3 | teardown | Stopped `netscript-saga-1032-s3-codex`; `--rm` reaped it, filtered `docker ps -a` was empty, and `aspire ps` found no AppHost. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| `name:` → `map:` for correlation only | Aligns generated selector with store and preserves explicit DB constraint naming intent | generated client + plan D1 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Fix-train evaluator route clarified by owner | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| scoped check | `run-deno-check.ts --root packages/plugin-sagas-core --root plugins/sagas --ext ts` | PASS | 178 files, 0 findings |
| scoped lint | `run-deno-lint.ts --root packages/plugin-sagas-core --root plugins/sagas --ext ts` | PASS | 178 files, 0 findings |
| scoped format | `run-deno-fmt.ts ... --ignore-line-endings` | PASS | 178 files, 0 findings |
| scoped tests | `deno test --allow-all packages/plugin-sagas-core/ plugins/sagas/` | PASS | `90 passed, 0 failed, 1 ignored`; all six ungated tests ran: loopback acceptance, remote-host rejection, database-name rejection, protocol rejection, malformed-URL rejection, and Prisma-version lockstep |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| per-root doctrine | PASS | `.llm/tools/fitness/check-doctrine.ts` for both requested roots | `plugin-sagas-core`: FAIL=0 WARN=2 INFO=2; `sagas`: FAIL=0 WARN=8 INFO=2 |
| code quality | PASS | `rtk proxy deno task quality:gate` | exit 0; scanner `ok:true`, architecture checks zero FAIL; expected warning notes exact inline test-only Prisma pin versus root caret catalog |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Prisma/Postgres round-trip | PASS | Postgres 18.3 container `netscript-saga-1032-s3-codex`, ephemeral port 44659; `7 passed, 0 failed` | `db push` succeeded and Prisma Client 7.8.0 generated from the verbatim shipped fragment wrapper; live round-trip ran, not ignored |
| destructive URL guard | PASS | live-test filter with host `db.example.com` | rejected before Prisma setup: `expected a loopback host (127.0.0.1, localhost, or ::1)`; error omitted the supplied password and full URL |
| teardown | PASS | scoped `docker stop`, filtered `docker ps -a`, `aspire ps` | owned `--rm` container reaped; no matching container remained; no AppHost found |

## Handoff Notes

- S3 is implementation-complete and freshly gated. The supervisor retains IMPL-EVAL, push, PR-body,
  and review-thread ownership.
