# Drift Log — Agentic Workflow Doctrine V3

Append-only. Severity: minor | significant | architectural.

- **D1 (architectural, 2026-07-04)**: Harness v2 mandates run dirs at `.llm/tmp/run/<run-id>/`,
  but `.gitignore` excludes all of `.llm/tmp/` — run artifacts + generated `workflow.js` cannot be
  committed or reviewed from GitHub/mobile there. This run dogfoods the V3 target: tracked run dirs
  under `.llm/runs/<run-id>/`. Subject to PLAN-EVAL; v2 docs updated as part of V3 itself.
- **D2 (significant, 2026-07-04)**: `commits.md` intentionally NOT instantiated for this run —
  V3 drops it (requirement 10); the draft PR commit list + per-slice PR comments are the commit
  trail. v2 activation.md still lists it as mandatory; superseded by this run's design, pending
  PLAN-EVAL.
