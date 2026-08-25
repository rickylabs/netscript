# Supervisor Identity — claude-graft-integration-benchmark-wgvfw1--graft-harness-bench

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field    | Value                                                                  |
| -------- | ---------------------------------------------------------------------- |
| Model    | Claude Fable 5 (`claude-fable-5`)                                      |
| Session  | https://claude.ai/code/session_01L3H1bBzmENNGrvCt11MQyn                 |
| Host     | Claude Code Remote (cloud container, Linux)                             |
| Checkout | /home/user/netscript                                                    |
| Worktree | same as checkout (single-branch cloud session)                          |
| Branch   | `claude/graft-integration-benchmark-wgvfw1`                             |
| Baseline | `c73d361` (main tip at run start, 2026-08-25)                           |
| Run ID   | `claude-graft-integration-benchmark-wgvfw1--graft-harness-bench`        |

## Routes in force

| Task lane                  | Provider / model / effort                | Role in this run                                            |
| -------------------------- | ---------------------------------------- | ----------------------------------------------------------- |
| Tier A (supervisor)        | Anthropic / Claude Fable 5 / session     | Coordination, integration slices, slice review, PR comments |
| Benchmark probe agents     | Anthropic / Claude Opus 5 / medium       | Before/after codebase-task probes (owner-specified lane)    |
| Benchmark judge            | Anthropic / Claude Opus 5 / medium       | Blind pairwise answer grading                               |

## Recorded lane/eval overrides

- **Owner directive (chat, 2026-08-25):** this cloud Claude session performs the integration and
  runs the benchmark through Opus 5 medium subagents — WSL Codex Tier-D lanes are not reachable
  from this cloud container. Authorized by the task owner in the session prompt ("benchmark it
  through sub agents (opus 5 medium)"). Mirrored in `drift.md`.
- **Merge decision:** the owner decides merge from the complete benchmark + review posted as a PR
  comment; the PR stays draft until that decision. IMPL-EVAL route recorded in `plan.md`.
