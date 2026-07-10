# Research — PR 4 Codex sender ownership and remote recovery

## Re-baseline

- Carried-in source: issue #580 brief and integration run `rickylabs-epic-574-wsl-agentic-runtime--supervisor`.
- Re-derived against integration baseline `fe3c63fb` and branch HEAD `4756eb4666f3d43d28c005b9aed4c04502950968` on 2026-07-10.
- `git fetch origin` is locally misconfigured to fetch deleted branch `feat/fresh-ui-pixel-polish`; an explicit two-branch fetch succeeded. `git merge-base --is-ancestor fe3c63fb HEAD` exited 0.
- The branch contains #576–#579. `RuntimeCommand`, `RuntimeResult`, diagnostics, actions, state, and ports are already canonical and must be extended rather than forked.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `repair-codex-remote` already parses at the CLI and is a legal plan/apply command, but the planner returns a #580 deferred block. | `agentic-runtime.ts`; `runtime/contract.ts`; `runtime/planner.ts` |
| 2 | Live launch/resume apply is deliberately blocked pending durable sender ownership. | `runtime/planner.ts` `planLifecycleAction` |
| 3 | Codex launch and resume already route through `launch-codex-slice.ts` and `codex-resume.ts`; resume never creates a sender. | `runtime/adapters/codex-adapter.ts` |
| 4 | Existing diagnostics already name `version_skew`, `ownership_conflict`, `active_session`, `duplicate_sender_risk`, `mobile_disconnected`, and `unowned_resource`. | `runtime/contract.ts` |
| 5 | The mutation controller consumes planned `RuntimeAction`s through injected ports, allowing daemon destruction to remain absent from tests. | `runtime/controller.ts`; `runtime/ports.ts` |
| 6 | The remote-control operating rule requires inspecting sessions and child work before repair; only PIDs whose argv begins with `$HOME/.codex/.../codex app-server` may be terminated, and only the known control socket may be removed. | `.agents/skills/codex-wsl-remote/SKILL.md` |
| 7 | Existing runtime tests explicitly preserve #581 routing/global-default and #582 rollout boundaries. | `runtime/deferred-boundaries_test.ts`; prior PR run artifacts |
| 8 | The worktree is native ext4 and has one pre-existing untracked `codex-thread-ids.md`; it is run identity evidence and will be included in the plan slice, not discarded. | pre-flight `git status --short --branch` |

## JSR audit surface scan

- N/A: changes are repo-internal `.llm/tools/agentic` CLI/tooling and harness artifacts, not a published package or plugin export.
- Slow-type/public-surface risk: none. New exported repo-internal types/functions still require explicit return types and JSDoc where exposed across modules.

## Open questions resolved by the plan

- Lock location/format: a privacy-safe JSON ownership record under the existing NetScript agentic state root, keyed by a deterministic worktree fingerprint; no prompt, credential, username, or arbitrary command text.
- Stale ownership: never inferred from age alone; validate owner PID/session/turn evidence. A live owner deterministically blocks launch and points to resume.
- Repair authority: plan/apply use inspected daemon facts; apply refuses active work, rejects unanchored PIDs and unknown sockets, and performs ordered anchored termination → known-socket removal → restart/pair → verify → evidence persistence.
- Interactive reconnect proof: owner directive accepts the live mobile/sleep/network canaries. Automated seams cover state transitions; artifacts must not claim a raw reconnect run.
