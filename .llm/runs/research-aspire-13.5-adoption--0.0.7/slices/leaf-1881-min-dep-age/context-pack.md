# Context Pack — README minimum dependency age

## State

- Branch: `fix/aspire-1881-readme-min-dep-age`
- Baseline: `3149d18e18fdd7cfbd0fac5a06f48f781d3a391a`
- Phase: plan complete; implementation not started
- Archetype: 6 — CLI / Tooling
- Overlay: docs
- PLAN-EVAL: N/A, small/mechanical owner-locked contract

## Next

1. Commit the Harness bootstrap.
2. Land expectations-only RED and capture exact failures.
3. Land prose-only GREEN and run the complete non-runtime gate set.
4. Run separate IMPL-EVAL, reconcile derived manifest evidence, push, and open the requested PR.

## Boundaries

No runtime suite, republish, workflow edit, harness-only flag injection, shim, environment override,
or `-f` addition.
