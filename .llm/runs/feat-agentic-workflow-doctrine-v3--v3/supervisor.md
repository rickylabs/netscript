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

## Phase 2 — Implementation (lane override, owner directive 2026-07-04)

**Supervisor is UNCHANGED — stays Fable 5** (`claude-fable-5`, Tier A, the originating supervisor
above). Only the implementation lane changes.

| Field | Value |
| --- | --- |
| Supervisor | Claude Code — **Fable 5** (`claude-fable-5`) — unchanged |
| PLAN-EVAL | PASS (OpenHands minimax-M3, separate session; `plan-eval.md`) — impl unblocked |
| Worktree | `C:\Dev\repos\netscript-framework\.llm\tmp\wt-harness-v3` (unchanged) |

**Lane override (owner directive):** given V3's high importance, the implementation of **all slices
S2–S8 is executed by Opus 4.8 sub-agents** (Tier B elevated to the implementation lane), replacing
the design's original Tier-D Codex / Tier-C Workflow assignments. **WSL Codex (Tier D) is used ONLY
for a final adversarial validation pass before IMPL-EVAL**, to close gaps ahead of the evaluator.
Tier E (OpenHands, separate session) still owns IMPL-EVAL. The Fable 5 supervisor orchestrates:
briefs, sequencing, run-dir upkeep, GitHub surface, and per-slice review. Recorded in `drift.md`
(D3-lane-override).
