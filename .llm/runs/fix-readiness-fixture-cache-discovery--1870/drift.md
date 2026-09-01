# Drift Log: readiness fixture cache discovery

## 2026-09-01 — RTK unavailable on implementation host

- **What:** The named `rtk` command is absent from PATH.
- **Source:** Shell returned `/bin/bash: rtk: command not found`.
- **Expected:** The RTK skill states the proxy is installed machine-wide.
- **Actual:** Focused raw `rg` is required; structured wrappers remain available for verdicts.
- **Severity:** minor
- **Action:** accept for this slice
- **Evidence:** implementation session command output
