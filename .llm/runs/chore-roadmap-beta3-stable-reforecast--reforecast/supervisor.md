# Supervisor Identity

Every V3 run dir records its supervisor here so other supervisors can cross-peek.

| Field | Value |
| --- | --- |
| Role | Feature supervisor (Tier A) |
| Mission | beta.3 → 0.0.1-stable roadmap & milestone re-forecast |
| Agent | Claude Code — Fable 5 (`claude-fable-5`) |
| Session | https://claude.ai/code/session_012wKHquACkXnWPDgJYhhFjN |
| Host machine | Windows 11 (`win32`), user `chaut` |
| Repo checkout | `C:\Dev\repos\netscript-framework` (main working copy) |
| Supervisor worktree | `C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap` |
| Branch | `chore/roadmap-beta3-stable-reforecast` |
| Run dir (tracked) | `.llm/runs/chore-roadmap-beta3-stable-reforecast--reforecast/` |
| Baseline | `1b42ba88` (origin/main, post 0.0.1-beta.2 cut) |
| Epic | #391 (child of #301; cross-links #389) |
| Draft PR | #TBD (set at bootstrap commit) |
| Started | 2026-07-04 |

## Sub-agent lanes (V3 tiering in force for this run)

- **B — Opus 4.8**: evidence sweeps (open issues / beta.2 PRs / epics) + code verification dives;
  report here, supervisor decides.
- **C — Sonnet 5 Workflows**: not expected (no batch codebase edits in a planning run); if used,
  `workflow.js` committed into `workflows/` BEFORE execution.
- **D — WSL Codex**: not expected (no framework source edits — planning run; code defects get filed
  as issues, never implemented here).
- **Eval**: OpenHands, separate session — PLAN-EVAL on the roadmap artifact before it leaves
  `status:plan-eval`. This supervisor does not self-certify.

## Constraints in force

- Evidence over labels: no issue/PR text is trusted without code/gate verification.
- Milestone/label edits are reversible → applied directly. Strategic roadmap (stable definition,
  cut sequence) → proposed for owner ratification, not finalized.
- No framework/plugin source edits. No merges. No force-push. No `git add -A`.
