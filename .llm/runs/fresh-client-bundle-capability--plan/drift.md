# Drift Log: deterministic Fresh client-bundle capability

## 2026-09-02 — #1557 browser-capability premise superseded

- **What:** The repository now has a package-level Playwright/Vite client-navigation gate.
- **Source:** Issue #1557 re-triage comment; `packages/fresh/tests/form-navigation_browser.ts`;
  `packages/fresh/deno.json`; `.github/workflows/ci.yml`.
- **Expected:** The carried-in brief described no repo browser driver or client-bundle gate.
- **Actual:** Current main drives client navigation in Playwright and provisions it selectively in CI.
- **Severity:** significant
- **Action:** accept
- **Evidence:** `research.md` findings 5–6; `plan.md` design note.

## 2026-09-02 — Local Fresh browser runtime unavailable

- **What:** `playwright-cli` is not installed on this host.
- **Source:** `deno task --cwd packages/fresh test:browser`.
- **Expected:** The package task requires the external CLI installed by CI.
- **Actual:** Both existing browser tests failed at process spawn after 10.8 seconds.
- **Severity:** minor
- **Action:** defer
- **Evidence:** CI installs `@playwright/cli@0.1.17` and Chromium before the impact-gated browser
  receipt; do not add or vendor a second driver.
