# Drift Log: canonical agentic task separator

## 2026-08-31 — local main advanced after slice allocation

- **What:** The local `main` ref is `0274c0a7`, while the owner locked this slice to `58a4a10e`.
- **Source:** raw `git rev-parse HEAD` / `git rev-parse main` during bootstrap.
- **Expected:** Branch and base at owner-specified `58a4a10e`.
- **Actual:** Feature branch is correctly at `58a4a10e`; only the local `main` ref advanced.
- **Severity:** minor
- **Action:** accept; preserve the explicit slice base and do not rebase.
- **Evidence:** `supervisor.md`, bootstrap command capture in session transcript.
