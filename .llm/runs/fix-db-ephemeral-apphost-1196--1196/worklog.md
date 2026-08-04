# Worklog — db ephemeral AppHost lifecycle (#1196)

## Design

### Public surface

- Existing `netscript db <operation>` command names/options/results remain unchanged.
- One-shot commands gain deterministic ephemeral lifecycle ownership; `db studio` remains attached
  to the resident AppHost.

### Domain vocabulary

- **Resident AppHost**: operator-owned `aspire/apphost.mts`; never stopped by a DB command.
- **Operation AppHost**: framework-owned `aspire/db-operation/apphost.mts`; exists only during a
  one-shot command.
- **Lifecycle cleanup**: exact-path stop, registry absence, owned-PID absence, request/project removal.

### Ports/seams

- Existing `AspireCommandExecutor`, extended with `AbortSignal` command cancellation.
- Existing `AppHostLifecycleLock`, which grants exclusive operation-path ownership.
- Injected signal registration, sleep/process probe, and filesystem cleanup seams for deterministic tests.
- Existing `DatabaseWorkspaceMutator` for command-time materialization.

### Constants

- Existing `SCAFFOLD_FILES.DB_OPERATION_APPHOST_MTS` and exact derived directory/request paths.
- Named cleanup poll interval/attempt budget; supported signals are SIGINT and SIGTERM off Windows,
  SIGINT on Windows.

### Commit slices

See locked `plan.md` S0–S3. Every implementation file traces to lifecycle ownership, command-time
materialization, signal cancellation, or live artifact verification.

### Deferred scope

Upstream Aspire changes, foreign cleanup, and general CLI restructuring.

### Contributor path

Lifecycle behavior lives in `kernel/adapters/database/operation-runner.ts`; command-time preparation
lives at the existing `public/features/db/operations` boundary; live behavior is proved by the
existing resident-preservation scaffold gate.

## Plan-Gate

| Row | Result | Evidence |
| --- | --- | --- |
| Research current | PASS | live #1196, #1088 re-baseline, current source and live read-only Aspire evidence |
| Decisions locked/open sweep | PASS | plan D1–D5; no must-resolve items |
| Slices/risks/gates/deferrals | PASS | locked plan tables |
| JSR surface scan | PASS | no public/export change; publish gates retained |
| Evaluator protocol | composed per milestone-run.md (orchestrator waiver) | owner directive; ruling D6 |

## Progress

| Date | Slice | Event | Evidence |
| --- | --- | --- | --- |
| 2026-08-05 | S0 | Live issue read first and baseline created | issue #1196; `6c3b534fc` |
| 2026-08-05 | S0 | Research/design locked | plan D1–D5 |
| 2026-08-05 | S1 | RED captured | focused runner suite failed because a pre-existing exact-path operation AppHost was not stopped |
| 2026-08-05 | S1 | Exact-path ownership implemented | stale host retired before start; invocation host stopped and verified absent on success/failure |
| 2026-08-05 | S2 | Signal and artifact lifecycle implemented | AbortSignal propagation plus command-scoped materialize/remove wrapper; studio remains resident |
| 2026-08-05 | S2 | Focused GREEN | 4 tests / 13 BDD steps pass; scoped check selected 17 files with zero findings |

## Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| RED-first | PASS | `retires a pre-existing DB-operation AppHost before returning success` failed on missing `stop` before implementation |
| Focused lifecycle tests | PASS | operation runner + command wrapper: 4 tests / 13 steps |
| Scoped check | PASS | 17 selected CLI/E2E files; zero findings |
| Lock hygiene | PASS | pre-existing `deno.lock` modification remains unstaged |
| `quality:gate` | PASS | quality scan zero findings; architecture/dependency gate exit 0 |
| Scoped check/lint/fmt | PASS | 17 selected files; zero findings |
| CLI package check/test | PASS | exported entrypoint check and full CLI package suite exit 0 |
| Publish dry-run | PASS | `@netscript/cli@0.0.4` simulation completed successfully; known dynamic-import warnings only |
| Full scaffold runtime | PASS | `scaffold.runtime`: 71 passed, 0 failed; live DB-status lifecycle gate passed |
| Resource hygiene | PASS | leak-check reports Aspire/Docker probes OK; only foreign/unproven containers listed and left untouched |
| Hosted SQLite diagnosis | RED→GREEN | CI exposed invalid SQLite `withReference`; focused generator/embedded-asset tests pass after engine guard |

Composed evaluator/check evidence and acceptance mirror remain pending after draft-to-ready.
