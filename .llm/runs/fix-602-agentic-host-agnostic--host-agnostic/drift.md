# Drift Log: host-agnostic agentic WSL execution

## 2026-07-11 — Supervisor route observability

- **What:** The current Codex workspace exposes the model family but not the exact lane-policy model suffix/effort.
- **Source:** current session metadata.
- **Expected:** Explicit provider/model/effort in `supervisor.md`.
- **Actual:** Provider/family are known; suffix/effort are not observable.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`; separate opposite-family evaluation remains mandatory.
