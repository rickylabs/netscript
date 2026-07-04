# Supervisor Identity

Every V3 run dir records its supervisor here so other supervisors can cross-peek.

| Field | Value |
| --- | --- |
| Role | Feature supervisor (Tier A) |
| Agent | Claude Code — Fable 5 (`claude-fable-5`) |
| Session | https://claude.ai/code/session_012wKHquACkXnWPDgJYhhFjN |
| Host machine | Windows 11 (`win32`), user `chaut` |
| Repo checkout | `C:\Dev\repos\netscript-framework` (main working copy) |
| Supervisor worktree | `C:\Dev\repos\netscript-framework\.llm\tmp\wt-harness-v3` |
| Branch | `feat/agentic-workflow-doctrine-v3` |
| Run dir (tracked) | `.llm/runs/feat-agentic-workflow-doctrine-v3--v3/` |
| Baseline | `1b42ba88` (origin/main, post 0.0.1-beta.2 cut) |
| Started | 2026-07-04 |

## Sub-agent lanes (tiering in force for this run)

- **B — Opus 4.8**: research / deep analysis; reports here, supervisor decides.
- **C — Sonnet 5 Workflows** (steps may escalate to Opus): batch/parallel codebase work.
  Generated `workflow.js` MUST be copied into `workflows/` in this run dir and committed
  BEFORE the workflow runs.
- **D — WSL Codex GPT-5.5-high**: long/deterministic refactors + housekeeping; daemon-attached
  (`codex-wsl-remote` skill), thread id + steering command recorded per slice in worklog.md.
- **Eval**: OpenHands, separate session (PLAN-EVAL / IMPL-EVAL per `.llm/harness/evaluator/`).
