# Drift — comparison docs programme #1551

Append-only.

## 2026-08-13 — carried provisional Session baseline corrected before planning

The live #1551 comment's provisional sketch diverges materially from EIS-Chat commit `5191de83f3da97559f21d8891c6c8afdf1cf473a`: route context access, resource ownership, cache-read flow, generated-route aliases, authoritative partial ownership, and local presentation helpers differ. Its LOC/ASC values were estimates.

Disposition: no implementation drift. Research was re-baselined to the immutable source; estimates were discarded; private contents remain excluded; the plan pins exact evidence inputs and exposes absent measurements. No coordinator rescope is required.

## 2026-08-15 — S1 rendered-navigation assertion deferred to its owning slice

Severity: **significant** — plan-acceptance correction. Rescope: **none**. Scope growth: **none**.

The approved plan assigned `docs/site/migration/index.md` and
`docs/site/migration/nextjs.md` to S3, while S1's manual gate required both
`/comparisons/` and `/migration/` roots to render under Concepts. Folder-derived
navigation cannot render the migration root before its S3-owned index exists, so
that S1 assertion was unsatisfiable from S1's own six-file list. The contradiction
was in the approved acceptance text, not in the implementation boundary.

Topic orchestrator `topic-docs-0.0.7` ruled that S1 asserts only
`/comparisons/` and `/comparisons/methodology/` under Concepts. S3 inherits the
`/migration/` rendered-root assertion and must assert both comparison and migration
roots after it lands the two migration files. No migration content moves into S1.

Formal PLAN-EVAL cycle 1 returned `PASS` on evaluated head `d35cbca30` without
detecting this inconsistency. Recording the miss here keeps it visible to later
IMPL-EVAL rather than burying it in the corrected gate result.
