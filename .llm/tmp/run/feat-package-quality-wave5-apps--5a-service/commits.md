# Commits — Sub-wave 5a: `@netscript/service`

| # | Hash | Slice | Notes |
| --- | --- | --- | --- |
| 0 | 40915db | docs(5a): research + proposed plan & design artifacts | generator hand-off to PLAN-EVAL; no implementation |

Implementation slices 1–15 (plan §4) begin only after PLAN-EVAL locks the plan.

- 0785a8f: Standardize service package metadata for publish gates
- d9897c0: Move service sources under src without behavior changes
- 88e0cc0: Add service public structural types
- b62dfbe: Replace handler leaks with service structural contracts
- aabcde2: Add explicit OpenAPI primitive return contracts
- 65c6512: Add explicit health primitive return contracts
- ff9ca2d: Expose service builder as structural interface
