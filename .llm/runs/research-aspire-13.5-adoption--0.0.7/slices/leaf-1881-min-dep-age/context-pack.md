# Context Pack — README minimum dependency age

## State

- Branch: `fix/aspire-1881-readme-min-dep-age`
- Baseline: `3149d18e18fdd7cfbd0fac5a06f48f781d3a391a`
- Phase: manifest-freshness repair green; focused IMPL-EVAL re-verdict pending
- Archetype: 6 — CLI / Tooling
- Overlay: docs
- PLAN-EVAL: N/A, small/mechanical owner-locked contract

## Next

1. Commit the evidence-only manifest repair and request the focused re-verdict.
2. Confirm the final evaluator verdict and parity remain green.
3. Commit final run evidence, push, and open the requested non-draft `status:impl` PR.

## Commits

- `33083a6f0` — Harness bootstrap and locked plan.
- `a3f929c23` — expectations-only RED.
- `86c71bc97` — printed-surface GREEN.
- `e6dbee80d` — mechanically regenerated docs carriers.
- `957cff9ff` — initial gate evidence; formal evaluation found its manifest ordering stale.

All requested non-runtime gates are green except the repository-wide README standard baseline,
which still reports only untouched `packages/bench/README.md`.

## Boundaries

No runtime suite, republish, workflow edit, harness-only flag injection, shim, environment override,
or `-f` addition.
