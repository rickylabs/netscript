# Context Pack — README minimum dependency age

## State

- Branch: `fix/aspire-1881-readme-min-dep-age`
- Baseline: `3149d18e18fdd7cfbd0fac5a06f48f781d3a391a`
- Phase: gates complete; formal IMPL-EVAL pending
- Archetype: 6 — CLI / Tooling
- Overlay: docs
- PLAN-EVAL: N/A, small/mechanical owner-locked contract

## Next

1. Run separate formal IMPL-EVAL against the committed implementation and carrier slices.
2. Regenerate the Aspire surface manifest once more if the evaluator record adds a tracked path.
3. Commit final run evidence, push, and open the requested non-draft `status:impl` PR.

## Commits

- `33083a6f0` — Harness bootstrap and locked plan.
- `a3f929c23` — expectations-only RED.
- `86c71bc97` — printed-surface GREEN.
- `e6dbee80d` — mechanically regenerated docs carriers.

All requested non-runtime gates are green except the repository-wide README standard baseline,
which still reports only untouched `packages/bench/README.md`.

## Boundaries

No runtime suite, republish, workflow edit, harness-only flag injection, shim, environment override,
or `-f` addition.
