# Drift Log: Merge-aware canary payload derivation (#1166)

Drift is append-only.

## 2026-08-03 — Owner-opened supervisor route

- **What:** The active supervisor is Codex rather than the canonical Fable primary.
- **Source:** User-opened implementation-supervisor session and `workflow/lane-policy.md`.
- **Expected:** `planning_decisions` primary routes to Fable 5 low.
- **Actual:** Codex supervises; the lane policy documents Codex as the planning fallback family.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`; implementation, opposite-family review, and formal evaluation remain
  separate canonical sessions.
