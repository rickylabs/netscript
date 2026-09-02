# Merge packet — PR #1949 (Closes #1947) @ `5c0d6c582`

- **PR**: rickylabs/netscript#1949 `docs(cli): top up the 0.0.7 changelog before the stable cut`
- **Head**: `5c0d6c582` on `docs/changelog-0-0-7-topup`; base `main` = `88fc6d69d` (behind 0, no
  conflict). One file, `packages/cli/CHANGELOG.md`, additions only under `## 0.0.7`.
- **CI** (run 33680959025 on this exact head): classify / check-test / quality / close-gate all
  **success**; REST `mergeable=true`, `mergeable_state=clean`.
- **close-gate**: `status:ready-merge` live; `acceptance-evidence` block mirrored 4/4 boxes on #1947.
- **Evals** (all GLM 5.3 Flash · max, artifacts in this directory):
  - `85ca65cc4` IMPL-EVAL → FAIL_FIX (4 wording findings) → applied.
  - `be6a4d471` delta → **PASS** (rewords + folded #1944/#1942/#1943/#1948).
  - `cf43a85c4` delta2 (S9 fold) → FAIL_FIX (1 finding: two unreceipted command names) → applied
    exactly as prescribed in `5c0d6c582` (deletion-only; every other clause VERIFIED).
- **Coverage**: every user-visible 0.0.7 merge through main `88fc6d69d` has a bullet, including
  S9. Still open and undescribed: #1856 (user-visible; draft staged), #1664; #1895/#1883/#1940 are
  test-only. If #1856 lands before the cut, Docs folds it and re-runs the exact-head cycle.
- **Merge authority**: primary coordinator. Squash; body carries `Closes #1947`.
