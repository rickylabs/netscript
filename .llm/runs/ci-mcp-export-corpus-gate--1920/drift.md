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

## 2026-09-02 — Expected public-surface collision materialized

- **What:** `origin/main` advanced from the dispatched base to `37452f11f`; the delta changes the
  CI classifier and the generated MCP export corpus.
- **Source:** `git fetch origin main`; `git diff --name-status ec848e6b..origin/main`.
- **Expected:** The brief warned that concurrent public-surface work, including #1842 or another
  lane, would invalidate the generated blob before handoff.
- **Actual:** #1917 changed classifier coverage and #1915 added typed credential contribution
  surface plus a regenerated corpus.
- **Severity:** significant
- **Action:** fix
- **Evidence:** Slice 3 will integrate exact main SHA `37452f11f`, regenerate, and repeat all
  load-bearing checks before handoff. No concurrent package surface will be hand-edited.
