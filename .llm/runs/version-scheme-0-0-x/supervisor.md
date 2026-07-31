# Supervisor Identity — version-scheme-0-0-x

| Field | Value |
| --- | --- |
| Model | Codex · OpenAI · GPT-5.6 Sol · high |
| Session | `019fb9c4-b209-7ab3-b3fa-21eef1e8b8ec` |
| Host | Linux / WSL agentic runtime |
| Checkout | `/home/codex/repos/b12-scheme` |
| Worktree | `/home/codex/repos/b12-scheme` |
| Branch | `chore/version-scheme-0-0-x` |
| Baseline | `8dca679855ab6b5f45d7e3d597432769cc3afaeb` (`origin/main`, 2026-07-31) |
| Run ID | `version-scheme-0-0-x` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `complex_implementation` | OpenAI / GPT-5.6 Sol / high | Research, plan, and implementation slices |
| `review_codex_complex` | Anthropic / Fable 5 / medium | Opposite-family slice review before sign-off |
| `formal_evaluation` | OpenRouter / Qwen 3.7 Max / bound preset | Separate PLAN-EVAL and IMPL-EVAL sessions |

Reference `.llm/harness/workflow/lane-policy.md`; route identity is enforced by the agentic suite.

## Recorded lane/eval overrides

- None. The owner-established run directory omits the canonical branch-derived suffix; this naming
  drift is recorded in `drift.md` and does not alter route selection.
