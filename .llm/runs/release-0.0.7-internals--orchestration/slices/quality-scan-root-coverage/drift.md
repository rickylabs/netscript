# Drift Log: quality-scan-root-coverage

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state documentation.

## 2026-08-15 — Launcher metadata pre-seeded the run directory

- **What:** The initial worktree check found the target run directory untracked because the agentic launcher had written `codex-thread-ids.md` before this session began.
- **Source:** Initial `git status --short --branch` and the launcher-authored file.
- **Expected:** A clean worktree before harness bootstrap.
- **Actual:** Only the target run directory was untracked; its sole file matched the requested thread, worktree, branch, baseline, and route.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `.llm/runs/release-0.0.7-internals--orchestration/slices/quality-scan-root-coverage/codex-thread-ids.md`
