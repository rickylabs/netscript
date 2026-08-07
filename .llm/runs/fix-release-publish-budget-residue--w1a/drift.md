# Drift log

## D-001 — proportional PLAN-EVAL waiver

- Severity: procedural
- Source: owner instruction for Canary.15 continuation
- Decision: skip PLAN-EVAL for this small, connected W1 cluster; retain research/design artifacts, slice review, trustworthy gates, and mandatory independent IMPL-EVAL.
- Scope: W1-A only.
- Written waiver locations: `supervisor.md`, `plan.md`, `worklog.md`, and this drift entry.

## D-002 — issue #1312 partial-canary premise re-baselined

- Severity: factual
- Source: current same-semver republish implementation and release doctrine on `origin/main`
- Observation: issue prose says a partial canary can never be completed, but current tooling can
  fill only the missing member versions at the same semver when the tag tree is identical.
- Decision: preserve immutable published members and document identical-tree completion for missing
  members; otherwise advance to a new canary. This changes no acceptance scope.
