# Context Pack — README minimum dependency age

## State

- Branch: `fix/aspire-1881-readme-min-dep-age`
- Baseline: `3149d18e18fdd7cfbd0fac5a06f48f781d3a391a`
- Phase: implementation and evidence complete; IMPL-EVAL `PASS`; ready to push/open `status:impl` PR
- Archetype: 6 — CLI / Tooling
- Overlay: docs
- PLAN-EVAL: N/A, small/mechanical owner-locked contract

## Next

1. Commit the final evaluator verdict and run-status evidence.
2. Confirm parity and the worktree are clean, then push.
3. Open the requested non-draft `status:impl` PR without applying ready-merge.

## Commits

- `33083a6f0` — Harness bootstrap and locked plan.
- `a3f929c23` — expectations-only RED.
- `86c71bc97` — printed-surface GREEN.
- `e6dbee80d` — mechanically regenerated docs carriers.
- `957cff9ff` — initial gate evidence; formal evaluation found its manifest ordering stale.
- `a074ba2a9` — evidence-only manifest repair; parity returned to green.

All requested non-runtime gates are green except the repository-wide README standard baseline,
which still reports only untouched `packages/bench/README.md`. Formal IMPL-EVAL is `PASS` after a
focused re-evaluation of the manifest repair.

## Boundaries

No runtime suite, republish, workflow edit, harness-only flag injection, shim, environment override,
or `-f` addition.
