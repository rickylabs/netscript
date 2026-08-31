# Supervisor Identity — openhands-dispatch-claim-and-refusal

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | OpenAI GPT-5.6 Sol |
| Session | `01a00443-abab-7261-8905-74ed71467929` |
| Host | `YogaBook9i` · WSL2 Linux x86_64 |
| Checkout | `/home/codex/repos/netscript-007-openhands-dispatch` |
| Worktree | `/home/codex/repos/netscript-007-openhands-dispatch` |
| Branch | `fix/openhands-dispatch-claim-and-refusal` |
| Baseline | `7737d8903bb2925c3fcefbda362168fe297eebd4` (`main`, 2026-08-15) |
| Run ID | `release-0.0.7-internals--orchestration/slices/openhands-dispatch-claim-and-refusal` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `normal_implementation` | OpenAI / GPT-5.6 Sol / medium | Single Codex implementation thread; bootstrap, research, and planning only until the plan gate is disposed |
| `formal_plan_evaluation` | Native opposite-family / Fable 5 / medium | Required separate-session PLAN-EVAL; coordinator launches after this plan handoff |
| `formal_impl_evaluation` | Native opposite-family / Fable 5 / medium | Required separate-session IMPL-EVAL after implementation; not active this turn |

## Recorded lane/eval overrides

None. The requested and observed implementation route matches the canonical
`normal_implementation` route. Evaluator routes are recorded for handoff only and are not launched
by this thread.
