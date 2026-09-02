# Drift Log: #1920 MCP export-corpus CI gate

## 2026-09-02 — RTK executable unavailable

- **What:** The requested and documented `rtk` command is not available on this host's PATH, and
  `/home/agent/.local/bin/rtk` is absent.
- **Source:** `command -v rtk`; direct filesystem probe.
- **Expected:** The `rtk` skill states that v0.38.0 is installed at the machine level.
- **Actual:** Shell returned `rtk: command not found`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Focused raw `rg`/git reads are used as the fallback. Durable evidence continues to
  use repository gate runners and explicitly captured real exits.
