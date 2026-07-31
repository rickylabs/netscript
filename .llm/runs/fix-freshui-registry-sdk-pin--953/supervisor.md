# Supervisor Identity — fix-freshui-registry-sdk-pin--953

| Field     | Value                                                              |
| --------- | ------------------------------------------------------------------ |
| Model     | Claude Opus 5 (`claude-opus-5`)                                    |
| Session   | Claude Code CLI session (non-interactive fix lane)                 |
| Host      | Linux WSL2 / codex                                                 |
| Checkout  | `/home/codex/repos/fixes/freshui-registry-pin`                     |
| Worktree  | `/home/codex/repos/fixes/freshui-registry-pin` (dedicated)         |
| Branch    | `fix/freshui-registry-sdk-pin`                                     |
| Baseline  | `8e0bcef39` (= `origin/main`), 2026-07-31                          |
| Run ID    | `fix-freshui-registry-sdk-pin--953`                                |

## Routes in force

| Task lane            | Provider / model / effort | Role in this run                     |
| -------------------- | ------------------------- | ------------------------------------ |
| supervisor (Tier A)  | Claude Opus 5             | research, plan, implement, gate       |

## Recorded lane/eval overrides

- **Single-session run.** The owner assigned this fix directly to one session. PLAN-EVAL and
  IMPL-EVAL require a *separate* session per `workflow/run-loop.md` §4/§7 and cannot be
  self-certified here. Both are recorded as `NOT_RUN — requires separate evaluator session` in
  `worklog.md`, not as `PASS`. Mirrored in `drift.md`.
