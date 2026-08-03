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

## 2026-08-03 — Owner approval + implementation (PR #1155)

- Owner ratified the plan directly and ordered proceed-to-green (see drift.md); PLAN-EVAL formal
  pass superseded by owner authority.
- #1153 (=#1151) merged to main after: full green run incl. rerun of a transient npm flake
  (`Failed caching npm package '@types/pg' — error reading a body from connection`), close-gate
  green via evidence mirror (all 4 acceptance boxes on #1151 checked with provenance comment).
  Issue #1151 CLOSED, `status:shipped`.
- Slices landed on `ci/scope-expensive-jobs`:
  - S1+S2 (one commit): classifier capability vector + tier-defining-workflow and root
    `deno.json` tasks-only precision; **50 unit tests green**, scoped lint 0, fmt clean.
  - S3 e2e-cli.yml: desktop → `needs_desktop`; runtime documented as docker tier; root config
    extraction step; lane visibility.
  - S4 ci.yml: classify job + `check-test` ← `needs_deno`, `quality` ← `needs_deno || needs_docs`
    with skipped-by-policy; lane visibility distinguishes policy skips.
  - S5 surface-diff.yml: paths filter folded into `needs_surface`.
  - chore: all version-tagged actions bumped to Node-24 majors (checkout/upload-artifact/
    download-artifact/setup-dotnet v5; pages trio latest; SHA-pinned actions untouched).
  - merge commits: #1151 branch based in; main synced post-squash (conflicts resolved to the
    #1152 header/desktop versions).
- **Live verification (stacked demo PRs, e2e-cli-gate label):**
  - docs-only demo PR #1156 → run 30827771974: scaffold-static, scaffold-runtime AND
    desktop-native-linux all `success` with ONLY "Skipped by policy" steps.
  - release-workflow-only demo PR #1157 (the #1122 class) → run 30827782060: same — all three
    expensive jobs skipped by policy on a `release-canary.yml`-only diff.
  - The #1155 PR itself is the positive case: tier workflow edits → everything runs in full.
