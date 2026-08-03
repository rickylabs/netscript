# Worklog — ci-scope-expensive-jobs--1152

## 2026-08-03 — Bootstrap + Research + Plan

- Read #1151/#1152 in full + owner brief (`.llm/tmp/BRIEF.md`).
- #1151 shipped separately first, per the brief: PR #1153
  (`fix/desktop-native-honors-classifier`, commit 5848e903), desktop-native-linux gated on
  `run_static || run_runtime` with the scaffold-static skipped-by-policy pattern. Verified live via
  stacked docs-only demo PR #1154 → run 30825776156: desktop reported SUCCESS with only the
  "Skipped by policy" step. Acceptance evidence mirrored on PR #1153; demo PR closed, branch
  deleted. Classifier untouched; its 30 unit tests green locally.
- Wrote `research.md` (baseline measurements, #1122 precision failure, required-check inventory,
  `.llm/tools` classification edge) and `plan.md` (capability vector D1–D5, slices S1–S6).
- **Design checkpoint**: plan locked pending PLAN-EVAL. No implementation before PASS.
