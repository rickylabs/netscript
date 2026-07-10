# Drift Log: native + OpenRouter provider profiles (#577)

## 2026-07-10 — stale origin fetch refspec

- **What:** The required broad `git fetch origin` failed before fetching current refs.
- **Source:** `remote.origin.fetch` and fetch stderr.
- **Expected:** Origin fetch updates the integration and feature tracking refs.
- **Actual:** The only configured fetch refspec names nonexistent
  `feat/fresh-ui-pixel-polish`. A scoped fetch of the authorized integration and feature refs then
  succeeded.
- **Severity:** minor
- **Action:** accept for this issue; do not mutate coordinator Git configuration.
- **Evidence:** pre-flight output recorded in `research.md`.

## 2026-07-10 — S1 matched locked profile design

- **What:** No implementation drift in S1; all three OpenRouter slugs matched current provider docs.
- **Source:** OpenRouter model pages and focused profile tests.
- **Expected:** Typed profiles/presets remove only #577 route deferral.
- **Actual:** Expected design landed; #578 Antigravity and #580 apply blocks remain.
- **Severity:** minor
- **Action:** accept as a no-divergence checkpoint.
- **Evidence:** `provider-profiles.ts`; focused tests 30 passed / 0 failed.
