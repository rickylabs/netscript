# Drift Log: #1046 run-owned teardown

## 2026-08-02 — Mandatory implementation artifacts absent after bootstrap

- **What:** `worklog.md`, `context-pack.md`, and `drift.md` were absent after the research/plan
  bootstrap commit; `codex-thread-ids.md` was generated but untracked.
- **Source:** direct run-directory listing and `git status --short` before implementation.
- **Expected:** harness activation requires all three artifacts and the Design checkpoint before
  implementation files are created.
- **Actual:** research, plan, supervisor, implement brief, and PLAN-EVAL existed, but the resumability
  artifacts did not.
- **Severity:** minor
- **Action:** fix
- **Evidence:** slice 1 commit adds the missing artifacts before slice 2 begins.

## 2026-08-02 — Foreign staleness needed probed creation time

- **What:** The initial reporter derived age only from this run's registry, leaving foreign and
  unproven resources with unknown age even when Docker exposed `Created`.
- **Source:** Supervisor Amendment A1 live review after slice 7.
- **Expected:** Staleness reporting applies to every survivor without changing actionability.
- **Actual:** Ownership/reporting were correct, but staleness was inert outside the current registry.
- **Severity:** minor
- **Action:** fix
- **Evidence:** red-first test plus Docker RFC3339Nano creation-time fallback; live report now shows
  non-null ages for foreign and unproven containers.
