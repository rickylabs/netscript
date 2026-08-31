# Drift Log: residual Aspire key-normalization mismatches (#1833)

Drift is append-only.

## 2026-08-31 — RTK unavailable in implementation shell

- **What:** The repo instructions advertise `rtk`, but the binary is not on this shell's `PATH`.
- **Source:** `rtk rg --files .agents/rules .llm/runs` exited 127 (`rtk: command not found`).
- **Expected:** Use RTK for token-compressed exploratory Git/search/task output.
- **Actual:** Direct `rg` and Git reads are available; structured Deno wrappers remain available for
  verdict evidence.
- **Severity:** minor
- **Action:** accept for this run; use direct `rg`/Git and mandated structured wrappers.
- **Evidence:** bootstrap command output in the implementation session.

