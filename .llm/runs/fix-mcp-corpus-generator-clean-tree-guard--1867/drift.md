# Drift log — #1867 F-3 generator clean-tree guard

## 2026-09-02 — RTK executable unavailable

- **What:** The requested `rtk` tool is absent from this host's PATH.
- **Source:** `command -v rtk` returned exit 1 on run bootstrap.
- **Expected:** The loaded RTK skill describes a machine-level v0.38.0 installation.
- **Actual:** No executable was found.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Use narrow direct commands and direct Deno-spawned Git ground-truth checks; never
  treat filtered exploratory output as durable gate evidence.
