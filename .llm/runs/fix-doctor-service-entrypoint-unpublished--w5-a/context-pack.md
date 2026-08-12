# Context Pack: W5-A plugin doctor service entrypoint release window

## Run Metadata

| Field          | Value                                             |
| -------------- | ------------------------------------------------- |
| Run ID         | `fix-doctor-service-entrypoint-unpublished--w5-a` |
| Branch         | `fix/doctor-service-entrypoint-unpublished`       |
| Current phase  | `impl-eval`                                       |
| Archetype      | `6 — CLI / Tooling`                               |
| Scope overlays | `none`                                            |

## Current State

Clean exact baseline confirmed. The defect is isolated to the doctor's service-entrypoint loader
path; #1597's E2E availability predicate is already exact-404-only and remains out of scope.

## Completed

- Skills, harness activation, archetype, doctrine verdict, debt, and release context reviewed.
- Research, locked plan, design checkpoint, and `PLAN-EVAL: N/A` recorded.
- Three discriminating tests added and run on pre-fix code: expected exit 1; only the unpublished
  404 warning assertion failed, while published-defect and 503 preservation controls passed.
- Exact 404-only exclusion implemented through a typed loader-port HTTP error.
- All requested implementation gates passed, including `scaffold.plugins` 17/17.

## In Progress

- Automatic separate-session IMPL-EVAL.

## Next Steps

1. Trigger the automatic draft-to-ready IMPL-EVAL.
2. Apply only evaluator-required fixes, then return the completed PR to draft for owner handoff.

## Key Decisions

| Decision                     | Source                        | Notes                                        |
| ---------------------------- | ----------------------------- | -------------------------------------------- |
| Only exact 404 degrades      | owner brief / #1597 predicate | No error-text parsing.                       |
| Warning is a named exclusion | doctor command contract       | Visible, non-failing, check remains enabled. |

## Files Changed

| Path                                                                               | Status  | Notes                                 |
| ---------------------------------------------------------------------------------- | ------- | ------------------------------------- |
| `.llm/runs/fix-doctor-service-entrypoint-unpublished--w5-a/`                       | new     | Harness state                         |
| `slices/w5-a-doctor/evidence.md`                                                   | new     | Required evidence ledger              |
| `packages/cli/src/public/features/plugins/doctor/jsr-export-map-loader-port.ts`    | new     | Typed exact-response failure boundary |
| `packages/cli/src/public/features/plugins/doctor/doctor-plugin-use-case.ts`        | changed | Exact 404 warning exclusion           |
| `packages/cli/src/public/infra/jsr/fetch-jsr-export-map.ts`                        | changed | Preserves received HTTP status        |
| `packages/cli/src/public/infra/jsr/fetch-jsr-export-map_test.ts`                   | new     | Exact URL/status adapter tests        |
| `packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts` | changed | Three doctor-boundary controls        |

## Gates

| Gate family | Current status | Evidence                             |
| ----------- | -------------- | ------------------------------------ |
| Static      | PASS           | CLI check, lint, format              |
| Fitness     | PASS           | `quality:gate`; no blocking findings |
| Runtime     | N/A            | no service lifecycle change          |
| Consumer    | PASS           | `scaffold.plugins` 17/17             |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none expected.

## Commits

- See the draft PR commit list + per-slice PR comments.
