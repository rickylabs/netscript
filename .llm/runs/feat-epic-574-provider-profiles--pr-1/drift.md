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
