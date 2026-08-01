# Worklog: preserve resident AppHost during database CLI operations

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1011-db-apphost-lifecycle--codex` |
| Branch | `fix/1011-db-apphost-lifecycle` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Design

### Public Surface

- `netscript db <operation>` behavior is preserved; no exported TypeScript signature changes.

### Domain Vocabulary

- `startedByInvocation: boolean` — explicit authority to stop the detached AppHost.
- resident AppHost — an AppHost successfully observed for the target path before DB start.

### Ports

- `AspireCommandExecutor` — existing process/test seam used for the liveness probe and lifecycle.

### Constants

- No new finite value group is required; existing Aspire argument literals remain local.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove detached cleanup is ownership-bound and resident AppHosts receive no `stop`. | targeted adapter tests + scoped check/lint/fmt + quality/arch | `operation-runner.ts`, `operation-runner_test.ts`, run artifacts |

### Deferred Scope

- Unique generated DB-operation AppHost identity/backchannel — template/scaffold expansion is not
  required for the concrete ownership defect.
- Live AppHost PID fixture — no runnable fixture is checked in; executor-seam integration coverage
  is the accepted bounded substitute.

### Contributor Path

Lifecycle changes start in `operation-runner.ts`; extend `FakeAspireExecutor` scenarios in the
adjacent test and assert exact Aspire commands before changing cleanup authority.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 | bootstrap | research/design | Concrete unconditional `aspire stop` established; PLAN-EVAL pending. |
| 2026-08-01 | plan-eval | evaluator launch | Separate Qwen session `aa3c6460-8788-4e0d-b4c3-9b04fc11eb17` launched with the canonical route but failed authentication before evaluating. |

## Gate Results

All implementation gates are `NOT_RUN` until PLAN-EVAL returns `PASS`. The first evaluator launch
exited before evaluation with `Not logged in`; no verdict artifact was created.

## Handoff Notes

- PLAN-EVAL should inspect D1/D2 closely: ambiguous probe failures must fail closed.
