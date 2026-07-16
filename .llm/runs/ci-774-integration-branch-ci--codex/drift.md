# Drift Log: honest integration-branch CI

## 2026-07-16 — Runtime desired-state identity absent

- **What:** `agentic:runtime status --worktree` found no persisted runtime identity, while
  `agentic:codex-status`, rollout metadata, and the managed `--remote-control` process independently
  match the active worktree and thread.
- **Source:** agentic runtime/status commands and rollout session metadata.
- **Expected:** The Tier-D worktree would also be represented in desired-state runtime data.
- **Actual:** Direct attachment is proven, but the controller's desired-state worktree/session arrays
  are empty.
- **Severity:** minor
- **Action:** accept for this run; record direct proof in `supervisor.md`.
- **Evidence:** thread `019f6c7a-51dc-7910-9c76-009283d02223`, worktree
  `/home/codex/repos/b10-774-ci`, managed app-server process with `--remote-control`.
