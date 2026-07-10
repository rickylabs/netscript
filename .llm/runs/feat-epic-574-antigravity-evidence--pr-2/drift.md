# Drift Log: Antigravity evidence-acquisition lane (#578)

## 2026-07-10 — stale origin fetch refspec

- **What:** Plain `git fetch origin` exited 128 because `remote.origin.fetch` references a deleted branch.
- **Source:** Pre-flight command and `git config --get-all remote.origin.fetch`.
- **Expected:** Plain origin fetch succeeds.
- **Actual:** `feat/fresh-ui-pixel-polish` was not found; required integration/feature refs fetched explicitly.
- **Severity:** minor
- **Action:** accept for this issue; do not mutate coordinator repository configuration.
- **Evidence:** `research.md` pre-flight section.

## 2026-07-10 — live Antigravity session unavailable

- **What:** Minimal headless success retry exited 1 with authentication/service-timeout indicators.
- **Source:** Memory-only classified live canary.
- **Expected:** Owner-verified prior Google Sign-In might permit a bounded success response.
- **Actual:** No stdout; classified stderr indicators; 30,660 ms duration; raw output discarded.
- **Severity:** significant
- **Action:** defer live integration; owner verifies Google Sign-In outside automation, then resumes this thread.
- **Evidence:** `antigravity-capability-evidence.json`.

## 2026-07-10 — initial classifier record missing

- **What:** The first bounded live invocation returned no classifier record through orchestration.
- **Source:** Tool execution result.
- **Expected:** One classified JSON line with a raw child exit.
- **Actual:** No evidentiary line; no exit assigned. A single shorter retry was used.
- **Severity:** minor
- **Action:** accept as `probe_capture_failed`; never infer provider behavior from missing capture.
- **Evidence:** `antigravity-capability-evidence.json`.
