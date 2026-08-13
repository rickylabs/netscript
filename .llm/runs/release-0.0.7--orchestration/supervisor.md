# Supervisor identity — release 0.0.7

| Field | Value |
| --- | --- |
| Profile | `milestone-cluster` |
| Run id | `release-0.0.7--orchestration` |
| Coordinator | `codex-root-0.0.7` |
| Control branch | `chore/release-0.0.7-orchestration` |
| Baseline `main` | `01e0960494c95ce56eb35892c211a095eb13e6ed` |
| Target milestone | GitHub milestone `0.0.7` (`#27`) |
| Started | `2026-08-13T18:35:10.000Z` |
| Coordinator runtime | Codex via ChatGPT subscription; current app session on WSL |
| PLAN-EVAL session | Claude `2439b19d-5df7-4920-9fce-fa5831ec4fdf`; opposite family |
| PLAN-EVAL cycle | 2 of 2: `APPROVED` at plan head `331f7c664` |

The coordinator is the sole merge authority. Exactly four topic orchestrators will own the
`docs`, `internals`, `fixes`, and `features` lanes after Step 0 validates. The release captain and
writer lease remain inactive until every committed issue is terminal and exact-`main` gates pass.

| Lane | Orchestrator id | Active issues | Capacity |
| --- | --- | ---: | --- |
| docs | `topic-docs-0.0.7` | 1 | two implementers + one evaluator |
| internals | `topic-internals-0.0.7` | 16 | two implementers + one evaluator |
| fixes | `topic-fixes-0.0.7` | 26 | two implementers + one evaluator |
| features | `topic-features-0.0.7` | 17 | two implementers + one evaluator |

Read-only watchers are `milestone-main-watcher-0.0.7` and `milestone-ci-watcher-0.0.7`; both carry
`mutationAuthority:false`. The first evaluation was mistakenly routed to Claude Opus/high instead
of the canonical Fable/medium plan-evaluator route. The family separation was valid, but the route
deviation is recorded. Fable completed the cycle-2 evidence pass but hit its monthly spend limit;
the same conversation used the recorded Opus fallback for final synthesis and approved dispatch.

Quota at the checkpoint: Codex primary window had 77% remaining (weekly reset 2026-08-20 05:31
Europe/Zurich); Claude Max showed 6% all-model weekly remaining and 2% Fable weekly remaining
(reset 2026-08-15 00:00), with its current-session window resetting 2026-08-13 23:10. Implementation
therefore routes through WSL Codex; Claude is reserved for the bounded opposite-family re-review.

At dispatch, all four topic-control sessions use the documented Codex Sol/high route fallback
because native Claude capacity is insufficient for four persistent orchestrators. Their clean
control worktrees are `/home/codex/repos/netscript-007-{docs,internals,fixes,features}` at exact
`main` `01e096049`; thread identities and steering commands are recorded after launch.

| Lane | Topic thread | Worktree | Same-thread steering |
| --- | --- | --- | --- |
| docs | `019ffcc0-e19b-71d1-95ce-8c72559eb026` | `/home/codex/repos/netscript-007-docs` | `codex exec resume 019ffcc0-e19b-71d1-95ce-8c72559eb026 -- "<follow-up>"` |
| internals | `019ffcc0-e1b5-74f0-96eb-cdeb298d6b17` | `/home/codex/repos/netscript-007-internals` | `codex exec resume 019ffcc0-e1b5-74f0-96eb-cdeb298d6b17 -- "<follow-up>"` |
| fixes | `019ffcc0-e1ae-7b70-b3b8-8804ebd6f773` | `/home/codex/repos/netscript-007-fixes` | `codex exec resume 019ffcc0-e1ae-7b70-b3b8-8804ebd6f773 -- "<follow-up>"` |
| features | `019ffcc0-e1d2-7850-a308-354b670c6f3d` | `/home/codex/repos/netscript-007-features` | `codex exec resume 019ffcc0-e1d2-7850-a308-354b670c6f3d -- "<follow-up>"` |

All four sessions were launched attached through `agentic:launch-codex-slice`; live status reports
one working Sol/high agent at each exact worktree and no route or worktree ownership collision.

Owner visibility invariant: every 0.0.7 session assigned a Claude supervisor/orchestrator role must
run with native Claude `/remote-control`. Attachment is proven only by the native session registry
matching PID and cwd and exposing a non-empty `bridgeSessionId`; custom-endpoint/OpenRouter Claude
sessions do not satisfy this invariant. The four active topic controls above are Codex daemon lanes,
so they use the corresponding daemon/thread visibility proof instead.
