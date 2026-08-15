# Drift Log: package-gate-honesty

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-15 — Coordinator thread record preseeded the run directory

- **What:** The first ground-truth status check found only
  `.llm/runs/release-0.0.7-internals--orchestration/slices/package-gate-honesty/codex-thread-ids.md`
  as untracked content.
- **Source:** `git status --short` and the launcher-generated file contents.
- **Expected:** A completely clean worktree before bootstrap.
- **Actual:** The agentic launcher had staged this exact session's identity in the target run dir.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `codex-thread-ids.md` identifies this thread, worktree, branch, base, and matched
  route.

## 2026-08-15 — Root task exclusion does not satisfy standalone formatter acceptance

- **What:** Root `fmt:check` already supplies a wrapper-level exclusion for the MCP doctor fixture,
  but the exact standalone scoped command in #1618 still selects fixture TS and aborts during nested
  config discovery.
- **Source:** `deno.json:139-148`; exact wrapper reproduction in `worklog.md`.
- **Expected:** The issue report could have implied no exclusion existed anywhere.
- **Actual:** Task-level selection is protected, but the reusable standalone wrapper remains red.
- **Severity:** minor
- **Action:** fix
- **Evidence:** Baseline 115 selected / one config crash; explicit wrapper exclusion 110 selected /
  exit 0.
