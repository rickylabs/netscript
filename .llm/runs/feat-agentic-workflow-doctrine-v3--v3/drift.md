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
- **D3-lane-override (significant, 2026-07-04)**: Owner directive overrides the design §8 per-slice
  lane assignments for the implementation phase. The **supervisor stays Fable 5** (unchanged), but
  **all implementation slices S2–S8 run on Opus 4.8 sub-agents** instead of the planned Tier-D Codex
  (S2/S4/S6/S8) and Tier-C Sonnet Workflows (S3/S7), given V3's high importance and Opus's authoring
  quality on doctrine/tooling prose. **WSL Codex (Tier D) is retained ONLY as a final adversarial
  validation pass before IMPL-EVAL** (close-all-gaps sweep). This does not change the design's
  written lane-policy doctrine (S2 still documents the general Tier A–E model per §2); it is a
  run-scoped execution choice, recorded here per "drift is explicit". IMPL-EVAL remains OpenHands,
  separate session.
