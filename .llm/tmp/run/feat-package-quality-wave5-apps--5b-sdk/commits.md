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
- 549326c: Export stream producer types for sdk docs
- 9585851: Add sdk query client structural port
- 82abaa6: Add sdk service query utils type mirror
- b0eca88: Type sdk service query utils factory
- 830affb: Expose sdk query collection port
- 112e4a2: Extract sdk HTTP client link seam
- a18ee60: Add sdk defineServices composition preset
- 4fccdd8: Split sdk discovery lookup modules
- 4443e5f: Document sdk cache state boundaries
- 4938c64: Document sdk module entrypoints
- 6e50265: Document sdk package architecture
- 117fd2e: Add sdk cache and doctest coverage
