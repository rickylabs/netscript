# Drift Log: release cut regenerates agent-docs prose

## 2026-08-13 — corpus paths are transitively staged already

- **What:** The owner brief says both corpus paths are absent from
  `PREPARED_RELEASE_GENERATED_OUTPUTS`, but baseline `PUBLISH_ASSET_OUTPUTS` already begins with both
  paths, so the spread includes them transitively.
- **Source:** `.llm/tools/generate-publish-assets.ts` and the focused staging assertion.
- **Expected:** No staging coverage.
- **Actual:** Staging coverage exists indirectly; explicit prepared-release ownership is absent.
- **Severity:** minor
- **Action:** fix by explicitly classifying the paths in the prepared-release set without duplicates.
- **Evidence:** `evidence.md` pre-fix assertion 2.
