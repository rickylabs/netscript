# Context Pack: desktop fixture oRPC contract dependency

## Run Metadata

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| Run ID         | `desktop-orpc-contract-dep--impl`       |
| Branch         | `fix/desktop-fixture-orpc-contract-dep` |
| Current phase  | `plan`                                  |
| Archetype      | `6 — CLI / Tooling` (owned harness)     |
| Scope overlays | none                                    |

## Current State

Branch is cleanly based on current `origin/main`. Research and design are locked; PLAN-EVAL is N/A
because #1926 completely specifies this small repair. Implementation complete; see worklog "Final
implementation and gates".

## Completed

- Read issue, named skills, harness workflow, Archetype 6, and relevant doctrine/debt.
- Confirmed `@orpc/contract` is 0 behind via `deps:latest` and SDK pin is `^1.15.0`.
- Identified that prepared fixture staging replaces the checked-in map.

## In Progress

- Bootstrap commit and draft PR.

## Next Steps

1. Open the draft PR with `Refs #1926`, requested labels, and milestone.
2. Implement the prepared-graph guard and dependency declarations.
3. Prove failure without the entries, restore, and run all gates.
4. Mark ready for the separate evaluator and `desktop-native-linux` CI run.

## Key Decisions

| Decision               | Source                | Notes                                                               |
| ---------------------- | --------------------- | ------------------------------------------------------------------- |
| Guard the prepared map | plan D1               | Avoids root-workspace false green and standalone catalog false red. |
| No packaging refactor  | issue #1926 / plan D3 | Duplicate declaration is intentionally retained for bounded scope.  |

## Files Changed

| Path                                           | Status | Notes                        |
| ---------------------------------------------- | ------ | ---------------------------- |
| `.llm/runs/desktop-orpc-contract-dep--impl/**` | new    | Harness activation and plan. |

## Gates

| Gate family | Current status | Evidence                   |
| ----------- | -------------- | -------------------------- |
| Static      | pending        | implementation not started |
| Fitness     | pending        | implementation not started |
| Runtime     | pending        | implementation not started |
| Consumer    | pending        | implementation not started |

## Open Questions

- None.

## Drift and Debt

- Drift: prepared map rewrite and unavailable RTK recorded.
- Debt: no new debt expected.

## Commits

- See the draft PR's commit list + per-slice PR comments.

> **Status update:** phase is `impl`. Implementation, guard repair, and gate evidence are recorded
> in `worklog.md`; the D1 prepared-map correction and the C1 collector widening are in `drift.md`.
