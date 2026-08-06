# Supervisor — NetScript 0.0.5 milestone continuation

| Field            | Value                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Run id           | `release-0.0.5--orchestration`                                                                                                          |
| Supervisor model | Codex GPT-5.6 Sol · high                                                                                                                |
| Route            | Owner-authorized override of canonical `planning_decisions` Fable route                                                                 |
| Permission mode  | bypass / danger-full-access (owner-authorized)                                                                                          |
| Host             | WSL2, `/home/codex/repos/ns005-milestone-orchestrator`                                                                                  |
| Branch           | `orchestrator/0.0.5-continuation`                                                                                                       |
| Baseline         | `origin/main@2508eb8c99c9cfc55e0c9f1d7ab72fea745db492`                                                                                  |
| Milestone        | GitHub milestone 23, `0.0.5`                                                                                                            |
| Draft PR         | #1337, `chore(harness): orchestrate the 0.0.5 continuation`                                                                             |
| Resumed          | 2026-08-06                                                                                                                              |
| Profile          | `.llm/harness/workflow/milestone-run.md`                                                                                                |
| Legacy run       | local `orchestrator/0.0.5@8399126ef74e79e935a5e90b871fadc612c1656b`, `/home/codex/repos/ns-005/.llm/runs/release-0.0.5--orchestration/` |

## Continuation boundary

The Claude run is preserved as historical evidence and is never rewritten from memory. This
continuation re-baselines all decisions against current GitHub state and current `origin/main`.
Historical merge/canary records are cited by commit and source path until they are mechanically
imported or reconciled; new merge records are appended here only from live first-parent history.

## Lane bindings

| Purpose                                  | Route                                                                            |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| Orchestration                            | Codex GPT-5.6 Sol high, owner override                                           |
| Focused implementation                   | `light_implementation`: Codex GPT-5.6 Sol low                                    |
| Decision-heavy implementation            | `normal_implementation`: Codex GPT-5.6 Sol medium, only when justified           |
| PLAN-EVAL                                | `formal_plan_evaluation`: OpenRouter `minimax/minimax-m3`                        |
| IMPL-EVAL                                | `formal_impl_evaluation`: OpenRouter `qwen/qwen3.8-max`                          |
| Ordinary review during Claude exhaustion | owner-authorized OpenRouter Grok 4.5 or Kimi K3; temporary drift recorded per PR |

Formal generator/evaluator session separation and the Tier-A slice-review gate remain mandatory. The
orchestrator alone holds merge and release-canary authority.

## Primary-session launch evidence

Current Codex thread/goal id: `019fd77c-f583-7b01-aed8-c8665ac09230`. Runtime inspection at
2026-08-06 reported zero daemon-managed sessions; remote-control/mobile attachment and a real CLI
tmux pane are therefore **not yet proven**. This is recorded as failed/not-attached, not presented
as observable. Repair must use `agentic:runtime`; every delegated Codex lane must use the agentic
launcher and record worktree, branch, thread, observed route/effort, connection proof, same-thread
steering command, draft PR, and tmux attach command.

## Plan-Gate handoff

Plan commit: `a463f0766`. Draft PR #1337 carries `status:plan-eval`, milestone 23, and no closing
keyword. Minimax and Qwen live provider canaries passed before evaluator launch. Separate Minimax M3
high evaluator session `567e3125-0fe9-4637-b0bb-30c20f9d3c26` ran through the supported
`formal_plan_evaluation` route and returned `PASS` in 247,552 ms. Its prompt is
`plan-eval-prompt.md`; its verbatim verdict is `plan-eval.md`. Implementation is authorized under
wave plan v3. Qwen remains reserved for separate per-slice IMPL-EVAL sessions.
