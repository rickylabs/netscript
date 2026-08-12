# Context Pack: W5-A plugin doctor service entrypoint release window

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-doctor-service-entrypoint-unpublished--w5-a` |
| Branch | `fix/doctor-service-entrypoint-unpublished` |
| Current phase | `plan` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

Clean exact baseline confirmed. The defect is isolated to the doctor's service-entrypoint loader
path; #1597's E2E availability predicate is already exact-404-only and remains out of scope.

## Completed

- Skills, harness activation, archetype, doctrine verdict, debt, and release context reviewed.
- Research, locked plan, design checkpoint, and `PLAN-EVAL: N/A` recorded.

## In Progress

- Harness bootstrap commit and draft PR opening.

## Next Steps

1. Add three discriminating tests and capture their pre-fix failures.
2. Implement structured exact-404 degradation.
3. Run gates and automatic IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Only exact 404 degrades | owner brief / #1597 predicate | No error-text parsing. |
| Warning is a named exclusion | doctor command contract | Visible, non-failing, check remains enabled. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-doctor-service-entrypoint-unpublished--w5-a/` | new | Harness state |
| `slices/w5-a-doctor/evidence.md` | new | Required evidence ledger |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | NOT_RUN | pending |
| Fitness | NOT_RUN | pending |
| Runtime | N/A | no service lifecycle change |
| Consumer | NOT_RUN | `scaffold.plugins` pending |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none expected.

## Commits

- See the draft PR commit list + per-slice PR comments.

