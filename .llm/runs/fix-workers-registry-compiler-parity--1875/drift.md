# Drift Log: workers registry compiler parity

Drift is append-only.

## 2026-09-01 — RTK unavailable on implementation host

- **What:** The repository-preferred `rtk` executable is not installed on PATH.
- **Source:** `rtk ls .llm/harness/archetypes` returned exit 127.
- **Expected:** The `rtk` skill describes a machine-level executable available on PATH.
- **Actual:** `/bin/bash: rtk: command not found`.
- **Severity:** minor
- **Action:** accept; use raw focused non-interactive commands and structured gate wrappers.
- **Evidence:** implementation session command output; no product impact.
