# Context Pack: Slice C resource contract and safe reconciler

## Current State

Harness bootstrap, doctrine research, live #1664 no-overlap measurement, inherited-plan pointer,
the mandatory Design checkpoint, and the complete ten-file implementation are complete. Focused,
package, architecture, quality, and documentation gates are green. Separate-session IMPL-EVAL is
the remaining harness gate before push and PR creation.

## Key Decisions

- The master plan is locked; this leaf records `PLAN-EVAL: N/A` because the evaluated master passed.
- Product scope is exactly ten new files under
  `packages/cli/src/kernel/application/resource-slice/`.
- Every non-ready outcome has no apply plan, making pre-apply zero-write safety structural.
- No command calls the planner in this slice.

## Next Steps

1. Commit the reviewed implementation and run artifacts.
2. Obtain separate-session IMPL-EVAL and address any findings.
3. Re-run changed-scope gates if evaluation changes the implementation.
4. Push and open the metadata-complete non-draft PR.

## Drift and Debt

- Drift: owner-directed non-draft PR lifecycle, RTK unavailable, and explicit no-overlap start while
  #1664 remains open are recorded in `drift.md`.
- Debt: none created; the master plan's future cardinality WARN remains an observation.
