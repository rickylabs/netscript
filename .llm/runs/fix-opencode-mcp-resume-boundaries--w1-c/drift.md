# Drift Log: OpenCode MCP attachment and provider-valid resume

Drift is append-only.

## 2026-08-07 — Prepared coordination context is absent and stale at the implementation baseline

- **What:** The owner-named coordination paths do not exist in baseline `1455231b`; they were read
  from commit `3e757c273`. Their planned branch, worktree, base, implementation route, evaluator,
  dispatch hold, and lock hash no longer match the live owner prompt/policy/checkout.
- **Source:** `git log/show --all`; live owner prompt; `workflow/lane-policy.md`; raw git/lock checks.
- **Expected:** Prepared branch `fix/opencode-mcp-resume-1324`, canary.14 base, Sol-low sender,
  Qwen evaluator, and older coordination lock hash.
- **Actual:** Owner-provisioned `fix/opencode-mcp-resume-boundaries` at exact `origin/main`
  `1455231b`, current sole Codex writer, Minimax conditional PLAN-EVAL, DeepSeek V4 Flash 0731 max
  IMPL-EVAL, and implementation-base lock hash `d32ef0c1…`.
- **Severity:** significant
- **Action:** accept owner-authorized live contract and re-baseline all technical facts.
- **Evidence:** `research.md`, `supervisor.md`, #1324/#1330 live bodies/comments.

## 2026-08-07 — No managed agentic session identity is attached to this existing writer

- **What:** Read-only `agentic:runtime status` found zero sessions and returned
  `MISSING_IDENTITY`; the worktree itself is clean and the user explicitly designated this current
  session as the sole writer.
- **Source:** `deno task agentic:runtime status --worktree ...` and raw `git status`.
- **Expected:** Prepared notes described launching a new daemon-attached sender thread.
- **Actual:** The implementation writer is already active; launching another sender would violate
  the exactly-one-writer rule.
- **Severity:** minor
- **Action:** accept; do not launch a rival app-server sender. Use only separate sequential formal
  evaluator sessions after writer work is quiescent.
- **Evidence:** `supervisor.md` route override.
