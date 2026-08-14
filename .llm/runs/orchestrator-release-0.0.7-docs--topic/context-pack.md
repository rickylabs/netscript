# Context pack — topic-docs-0.0.7

## Authority chain

1. Common contract:
   `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/briefs/topic-claude-reset-common.md`
2. Coordinator dispatch set (supersedes both the pre-reset six-Fable matrix and the rejected
   Sonnet-low matrix):
   `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/briefs/reset-gates/dispatch.json`
3. Coordinator central record: that run's `supervisor.md`, `worklog.md`, `context-pack.md`,
   `drift.md`, `milestone-cluster-state.json`, `leaf-contracts.json`, `milestone-leaf-plan.json`.
4. This topic run: `supervisor.md`, `worklog.md`, `drift.md`, this file.
5. Leaf harness run:
   `/home/codex/repos/netscript-007-docs-comparison/.llm/runs/docs-comparison-docs-programme--1551`
   (`research.md`, `plan.md`, `implement.md`, `worklog.md`, `drift.md`, `context-pack.md`,
   `codex-thread-ids.md`; expected gate output `plan-eval.md`, absent).

## Lane identity

- Supervisor: native Claude Opus 5 / high, session `fcf04b0f-3c2f-4844-9508-84c52ce8298c`, bridge
  `session_01PLRauSHN1PnvrNF2ucefF6`, PID `2429469`, cwd `/home/codex/repos/netscript-007-docs`.
- Branch `orchestrator/release-0.0.7-docs`; push only via
  `git push origin HEAD:refs/heads/orchestrator/release-0.0.7-docs`.
- Lane scope is exactly one committed milestone issue: **#1551**.

## Verified state at reconciliation (2026-08-15)

| Fact                | Value                                                                                          | Source                        |
| ------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------- |
| `main`              | `01e0960494c95ce56eb35892c211a095eb13e6ed`                                                     | `git ls-remote origin`        |
| topic branch remote | `f6ee57afa0d8855d868f2a3a1374c9871061b18c`                                                     | `git ls-remote origin`        |
| leaf branch remote  | `d35cbca30872d1f55118d63437638e93270c2ac3`                                                     | `git ls-remote origin`        |
| leaf worktree       | clean at `d35cbca30`                                                                           | `git status --short --branch` |
| PR #1652            | open · **draft** · mergeable `clean` · milestone `0.0.7`                                       | GitHub API                    |
| PR #1652 head       | `d35cbca30872d1f55118d63437638e93270c2ac3`                                                     | GitHub API                    |
| PR #1652 labels     | `type:docs`, `area:docs`, `priority:p2`, `ci:skip-e2e`, `ci:skip-scaffold`, `status:plan-eval` | GitHub API                    |
| PR #1652 CI         | `pr-checks PASS`, 49 checks, **0 current failures**                                            | `agentic:pr-checks --pretty`  |
| Docker containers   | none                                                                                           | `docker ps -a`                |
| Leaf Codex thread   | `019ffcc9-16c2-7573-b7f6-d627172408e8`, not running                                            | `ps -eo args`                 |
| Parked topic thread | `019ffcc0-e19b-71d1-95ce-8c72559eb026`, not running                                            | `ps -eo args`                 |
| Rival controllers   | none; the other three live Claude supervisors sit at their own worktrees                       | `~/.claude/sessions/*.json`   |

## Next authorized action

**None.** The lane is on a formal hold: fresh PLAN-EVAL cycle 1 for `comparison-docs-programme`,
dispatch order 6, not yet granted by the coordinator. On grant, launch exactly one fresh native
Claude Opus 5 / **low** evaluator session, opposite-family to the Codex generator thread
`019ffcc9-16c2-7573-b7f6-d627172408e8`, against the immutable head `d35cbca30`, writing
`plan-eval.md` in the leaf run dir. On `PASS`, the leaf resumes S1 by steering the same Codex thread
(`codex exec resume 019ffcc9-16c2-7573-b7f6-d627172408e8`) — never a second `send-message-v2`.
