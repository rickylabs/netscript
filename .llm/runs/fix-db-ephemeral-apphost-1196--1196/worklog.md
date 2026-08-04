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

## Gates

Pending implementation.
