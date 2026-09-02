# Drift Log: CLI auth-session typed credential transport

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-09-02 — RTK unavailable on run host

- **What:** The repository-preferred `rtk` output proxy is not installed in this shell.
- **Source:** `rtk git status` returned `command not found` during baseline inspection.
- **Expected:** Read-heavy git/grep commands use `rtk`.
- **Actual:** Focused raw `git`, `rg`, and Deno commands are required.
- **Severity:** minor
- **Action:** accept
- **Evidence:** host `ai-agents`; no product behavior or verdict semantics are affected.
