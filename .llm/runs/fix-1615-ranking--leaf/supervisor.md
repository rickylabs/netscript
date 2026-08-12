# Supervisor Identity — fix-1615-ranking--leaf

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Codex · OpenAI · GPT-5.6 Sol · high |
| Session | Current implementation session (session identifier not exposed) |
| Host | Linux / WSL (`/home/codex`) |
| Checkout | `/home/codex/repos/ns006-1615-ranking` |
| Worktree | `/home/codex/repos/ns006-1615-ranking` |
| Branch | `fix/1615-guidance-ranking-determinism` |
| Baseline | `6aee2b414` (`origin/main` at dispatch, 2026-08-12) |
| Run ID | `fix-1615-ranking--leaf` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `complex_implementation` | Codex · OpenAI · GPT-5.6 Sol · high | Measure the candidate score gap, choose the narrow deterministic remedy, implement it, and record gate evidence. |
| `formal_impl_evaluation` | Native Claude · Anthropic · Opus 5 · read-only fallback | Orchestrator-dispatched evaluation of the immutable implementation head; separate from this generator session. |

## Recorded lane/eval overrides

- Owner/orchestrator directive: use native Opus 5 as the read-only final evaluator fallback for
  this immutable head. Fable is prohibited for milestone 0.0.6 and must not appear in the
  evaluation chain at any depth.
- This implementation session must stop after opening the draft PR at `status:impl`; it must not
  mark ready for review, merge, cycle labels, or issue an evaluator retrigger.
