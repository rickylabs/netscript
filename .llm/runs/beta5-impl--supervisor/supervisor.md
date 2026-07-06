# Supervisor Identity — beta5-impl--supervisor

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Claude Fable 5 (`claude-fable-5[1m]`) |
| Session | https://claude.ai/code/session_01MUhKsbXoyxesJHKXWeJzTE |
| Host | Windows 11 Home, user `chaut`, WSL companion `codex-wsl` |
| Checkout | `C:\Dev\repos\netscript-framework` (main) |
| Worktree | supervisor stays on main; per-slice worktrees under `.worktrees/` (Windows) + WSL clones for Codex |
| Branch | main (run artifacts committed per-slice to chore branches or main-artifact push) |
| Baseline | origin/main `1c175990` (2026-07-06, routing adjustments merged) |
| Run ID | `beta5-impl--supervisor` |

## Charter

`charter.md` in this dir is the verbatim owner prompt (2026-07-06) — full-autonomy overnight run,
merge-on-green granted (single IMPL-EVAL loop per PR), owner cuts the release. Re-read after every
compaction; re-anchor the merge grant from it.

## Lane table in force (per ROUTING-ADJUSTMENTS.md, owner override 2026-07-06)

| Tier | Binding | Role in this run |
| --- | --- | --- |
| A | Fable 5 (this session) | orchestration, briefs, GitHub surface, slice review + sign-off, run-dir upkeep. Never writes framework code. |
| B | Opus 4.8 **high** sub-agents | UI slices, complex-thinking implementation, docs prose authoring (docs exception), deep research |
| C | Sonnet 5 **high** dynamic Workflows | Step-0 cross-reference map, batch/mechanical fan-out; never Fable in fan-out |
| D | WSL Codex GPT-5.5 **high** (daemon-attached) | framework/plugin/tool source slices; high effort always (medium only trivially mechanical); adversarial reviews (incl. docs validation — never docs author) |
| E | OpenHands (separate session) | IMPL-EVAL qwen-3.7-max, ONE eval loop per PR; PLAN-EVAL minimax-M3 where plan-gate applies |

## Recorded lane/eval overrides

- Owner override 2026-07-06 (`design/ROUTING-ADJUSTMENTS.md`): UI + complex-thinking impl → Opus 4.8
  high (not Codex); Codex always high; docs authoring Claude-only; ONE IMPL-EVAL loop per PR
  (charter). Mirrored in drift.md.
- Merge-on-green grant for this run (charter): squash + `--delete-branch`, retarget stacked children
  first. Grant does NOT survive compaction — re-anchor from charter.md.
