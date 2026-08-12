# Worklog: #1227 Quickstart Aspire restore retry

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1227-quickstart-restore-retry--impl` |
| Branch | `fix/1227-quickstart-restore-retry` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Design

### Public Surface

- No published surface changes. The executable test surface is `createQuickstartWalkSuite()` and
  its command-gate definitions.

### Domain Vocabulary

- `CommandGateRetryPolicy` — existing retry classes and typed retry bound.
- `GateAttempt` — existing per-attempt evidence.
- `GateVerdict` — existing `passed | failed | skipped` outcome.

### Ports

- `CommandExecutor` — existing fakeable subprocess seam; no new port.

### Constants

- Reuse the runtime restore attempt timeout (180,000 ms) and retry budget (`maxRetries: 2`).
- Missing PGDATA state uses one stable explanatory message and a non-success sentinel mapped to
  `skipped` by the command gate.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Harness bootstrap | clean git status + run artifact review | `.llm/runs/fix-1227-quickstart-restore-retry--impl/*` |
| 2 | Retry and honest teardown result | focused E2E unit tests + requested gates | quickstart suite/walk tests, command gate contract/runner tests if needed, PGDATA walk/tests, run artifacts |

### Deferred Scope

- Live `e2e:cli`, canary, publish/release changes, and other gates' retry behavior.

### Contributor Path

Define command retry declaratively on the gate, prove it with a fake `CommandExecutor`, and keep
fixture/setup absence distinct from a product assertion through an explicit `skipped` result.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-12 | 1 | research/design | Re-baselined; centralized retry runner is already functional. |

## Decisions

- `PLAN-EVAL: N/A` — this is a small mechanical slice with owner-locked contract, mechanism,
  acceptance, scope, and gates.
- No NuGet cache coverage is mirrored because the runtime path has no explicit cache-seeding step.

## Gate Results

Pending implementation.

## Handoff Notes

- Evaluator should inspect the negative RED evidence, policy wiring, exact attempt count, skip
  message, `deno.lock` diff, and explicit nested-E2E quality coverage first.

