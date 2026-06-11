# Commits — Sub-wave 5b: `@netscript/sdk`

| # | Hash | Slice | Notes |
| --- | --- | --- | --- |
| 0 | `71f2c30` | docs(5b): research + proposed plan & design artifacts | generator hand-off to PLAN-EVAL; no implementation |

Implementation slices 1–19 (plan §5) begin only after PLAN-EVAL locks the plan.

- 13dca51: Lock sdk plan after PLAN-EVAL pass
- ef6a6bd: Add sdk package tasks for quality gates
- 0cbd962: Move sdk implementation under src facades
- 998c4d6: Rename sdk interface surface to ports
- 8759d99: Fold sdk adapters and openapi subpaths
