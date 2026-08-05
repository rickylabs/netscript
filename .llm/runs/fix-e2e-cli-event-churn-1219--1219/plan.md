# Plan

1. Mirror `ci.yml` by removing labeled/unlabeled from the e2e-cli pull-request event set.
2. Add a policy test that rejects metadata triggers and proves skip labels still drive the next normal trigger.
3. Run focused classifier/policy tests and workflow YAML validation.

Locked: keep ref-scoped cancellation for actual code synchronizations; only metadata respawn is removed.
Open decisions: none. Risk: skip labels could become inert; mitigate with the next-trigger classifier matrix.
Deferred: broader concurrency redesign and workflow path filtering.

Per D6, no local PLAN-EVAL is spawned.

