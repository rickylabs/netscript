# Supervisor Identity — docs-rfc-runtime-versioned-automation--supervisor

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field    | Value                                                                                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model    | Claude Fable 5 (`claude-fable-5`), medium effort                                                                                                                 |
| Session  | Claude Code session `9125bc86-2125-4a58-a594-acbbc89dc636` (https://claude.ai/code/session_01PxfW6uzysZaXSQnyPrD7By), bypass permissions, Remote Control enabled |
| Host     | WSL2 Linux (6.18.33.2-microsoft-standard-WSL2), user `codex`                                                                                                     |
| Checkout | /home/codex/repos/ns-rfc-runtime-versioned-automation (dedicated worktree)                                                                                       |
| Worktree | /home/codex/repos/ns-rfc-runtime-versioned-automation                                                                                                            |
| Branch   | `docs/rfc-runtime-versioned-automation`                                                                                                                          |
| Baseline | `2256a67bf` = `origin/main`, 2026-08-11                                                                                                                          |
| Run ID   | `docs-rfc-runtime-versioned-automation--supervisor`                                                                                                              |

## Read-only reference surfaces

| Surface          | Path                                             | Constraint                                                                                 |
| ---------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Legacy product   | /home/codex/repos/netscript-start-ref            | read-only; refresh from `origin/master` only; never push/mutate                            |
| Active #1443 run | /home/codex/repos/ns-1443-plugin-ai-orchestrator | read-only design interaction with PR #1444; never write; never compete with its supervisor |

## Routes in force

| Task lane                                | Provider / model / effort                           | Role in this run                                                                       |
| ---------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `planning_decisions` (supervisor)        | Claude · Anthropic · **Fable 5 · medium**           | RFC orchestrator/synthesis — **owner override**, see below                             |
| archaeology / current-state verification | Codex · OpenAI · GPT-5.6 Sol (low–medium per slice) | independent code archaeology sub-agents                                                |
| `formal_plan_evaluation`                 | Codex · OpenAI · **GPT-5.6 Sol · xhigh**            | final adversarial PLAN-EVAL of the Claude-authored RFC — **owner override**, see below |

## Recorded lane/eval overrides (owner directives from the launch brief, 2026-08-11)

1. **Supervisor model override.** Canonical `planning_decisions` route is Opus 5 · high. The owner
   explicitly assigned **native Claude Fable 5 · medium** with bypass permissions and Remote Control
   for this complex RFC run. Mirrored in `drift.md` (D-1).
2. **PLAN-EVAL effort override.** Canonical `formal_plan_evaluation` for Claude-authored work is Sol
   · high. The owner explicitly requires a fresh native **Codex GPT-5.6 Sol · xhigh** formal
   adversarial PLAN-EVAL at the end because the RFC is Claude-authored and unusually complex.
   Mirrored in `drift.md` (D-2).
3. **Deliverable shape.** Research + architecture RFC only; disposable smokes/E2E probes allowed
   under run evidence; **no implementation** of the selected architecture; draft PR only; no
   epic/issue filing and no ready-for-review until owner ratification.
4. **Escalation policy.** No OpenHands/OpenRouter unless the native opposite-family route is blocked
   or a genuine third opinion is needed — must be recorded here + `drift.md`.
