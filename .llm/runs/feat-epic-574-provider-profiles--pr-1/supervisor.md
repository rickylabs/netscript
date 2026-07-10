# Supervisor: PR 1 — native + OpenRouter provider profiles

## Identity

| Field | Value |
| --- | --- |
| Run ID | `feat-epic-574-provider-profiles--pr-1` |
| Issue | #577 |
| Branch | `feat/epic-574-provider-profiles` |
| Native WSL worktree | `/home/codex/repos/netscript-epic-574-pr1-providers` |
| Base (integration) | `rickylabs-epic-574-wsl-agentic-runtime` @ `93eb4f02` (contains #585) |
| Archetype | 6 — CLI / Tooling |
| Coordinator | Claude Opus 4.8 (this supervisor session, WSL) |

## Lane Assignment

| Role | Route | Status |
| --- | --- | --- |
| Coordinator / Plan-Gate / Tier-A review | Claude Opus 4.8 | active |
| Planning + implementation | WSL Codex (send-message-v2, GPT-5.6 Sol, effort high) | to launch |
| PLAN-EVAL / IMPL-EVAL | owner-authorized external-evaluator waiver | recorded as drift (per #584/#585 precedent) |

Generator (Codex) ≠ evaluator/coordinator (Claude): session separation preserved. One active sender
per worktree; steer by `codex exec resume` only. No credentials in argv/repo/logs/artifacts.
