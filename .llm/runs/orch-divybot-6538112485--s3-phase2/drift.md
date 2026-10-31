# Drift

- 2026-10-31: S2 and handoff are still open, contrary to an assumption that
  they might already be merged. Read handoff from its branch and use existing
  registry until main advances. No implementation scope changed.
- 2026-10-31: RTK is not installed. Use raw focused commands and repository
  structured wrappers; retained phase1 memory confirms the same limitation.

- PLAN-EVAL round1 FAIL_PLAN: one plan correction made before implementation.
  Phase-specific owner instruction "Refs #2416 only" wins over the generic
  assignment closing-keyword template; no partial work auto-closes #2416.

- 2026-10-31 user steering: "merge-conflict: rebase onto the latest base branch,
  resolve conflicts, force-push." This supersedes the earlier no-force rule for
  this repair only. Rebase onto main6b7f152 retains merged S2 and moves7 items
  into canonical registry.json/style-utility map/collections. Compatibility TS
  projection is unchanged; generated carriers are rebuilt, not conflict-spliced.
  Calendar WIP was saved separately and remains uncommitted.
- Independent registry integration review FAIL_FIX: preserve frozen legacy-v1
  baseline while admitting explicit post-v1 additions. Added a reviewed list and
  missing/changed/unexpected-item negative controls; no baseline snapshot edit.
