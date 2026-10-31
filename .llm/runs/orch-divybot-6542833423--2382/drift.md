# Drift

- Owner-selected Claude Opus 5.5/high evaluator overrides current pinned matrix routes; exact grant in worklog.md.
- rtk unavailable; raw bounded commands used per recorded memory.
- #2517 already repairs versioned JSON mapping, so this run completes scalar persistence/filtering and migration rather than restoring a parallel query mapper.
- Owner prohibits local scaffold.runtime; runtime scaffold verdict remains CI/coordinator-owned, never claimed from unit tests.

PLAN-EVAL round 1 FAIL_PLAN: manifest declaration and actual PostgreSQL migration-upgrade regression were missing from the initial plan. Before product edits, expanded the permitted surface to manifest/test and existing database conformance test/helper. Existing command-postgres workflow already covers all touched paths; no CI config edit needed. Round 2 addresses both blockers, no acceptance weakened.

IMPL-EVAL round 1 FAIL_FIX identified the existing PostgreSQL projection fixture creates its table manually without the new column. Expanded test-only scope to that fixture and added create/update scalar assertions. Also strengthened upgrade proof with a real pre-upgrade information_schema assertion so a future regex mismatch cannot masquerade as an old-schema upgrade.

PR-reference precedence: the highest-priority issue-specific operator directive requires a reference-only PR under coordinator ownership. It overrides the assignment generator's generic closing-footer template. Final PR retains the issue reference without an automatic closing instruction.

Closure records (dated lesson, final local evidence and context) are included with the independently reviewed S1 sign-off commit rather than an extra metadata-only commit, so the subsequent exact-head review can remain the last head. The final evaluator verdict is published in the PR timeline and excluded final-report handoff; committing a verdict about its own commit would invalidate its SHA. S2 is non-mutating review/publication after that sign-off. Actual sidecar name is instance-status.migration.sql.
