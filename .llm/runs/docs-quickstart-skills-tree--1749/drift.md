# Drift Log: quickstart canonical skills tree

Drift is append-only.

## 2026-08-30 — RTK unavailable on implementation host

- **What:** The prescribed token-saving proxy was not on `PATH`.
- **Source:** `rtk rg --files .llm/harness`.
- **Expected:** `.agents/skills/rtk/SKILL.md` says the machine-level binary is installed.
- **Actual:** Bash returned `rtk: command not found`.
- **Severity:** minor
- **Action:** accept for this run; use focused raw reads and raw Git for authoritative state.
- **Evidence:** activation command exited 127 before any mutation.

## 2026-08-30 — Reduced run artifact set is slice-locked

- **What:** The slice requires exactly four run artifacts in S1 rather than the generic harness set.
- **Source:** user-provided commit-shape contract.
- **Expected:** Harness activation ordinarily adds research/context-pack artifacts.
- **Actual:** Research is retained in `worklog.md`; the PR and phase comments carry the resumable handoff.
- **Severity:** minor
- **Action:** accept as owner-directed run shape.
- **Evidence:** S1 path list and PR body.
