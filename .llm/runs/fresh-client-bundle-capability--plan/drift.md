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
- **Actual:** After the new module was added, all three browser modules type-checked and all three
  tests failed only at `playwright-cli` process spawn.
- **Severity:** minor
- **Action:** defer
- **Evidence:** CI installs `@playwright/cli@0.1.17` and Chromium before the impact-gated browser
  receipt; do not add or vendor a second driver.

## 2026-09-02 — PLAN-EVAL supervisor waiver

- **What:** The supervisor waived the separate PLAN-EVAL hard stop for this test-only leaf and
  directed implementation to continue with `plan.md` unchanged as the contract.
- **Source:** Supervisor resume directive in the implementation session.
- **Expected:** The original plan required a native Fable PLAN-EVAL before RED.
- **Actual:** Plan commit `1e54fa598` was pushed unchanged and RED/GREEN proceeded directly.
- **Severity:** minor
- **Action:** accept
- **Evidence:** worklog progress and commit receipts; independent IMPL-EVAL remains required.
