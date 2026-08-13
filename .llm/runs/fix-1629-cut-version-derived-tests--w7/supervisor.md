# Supervisor Identity — fix-1629-cut-version-derived-tests--w7

| Field | Value |
| --- | --- |
| Model | OpenAI GPT-5.6 Sol |
| Session | Current Codex workspace session (thread id not exposed) |
| Host | Linux / `/home/codex` |
| Checkout | `/home/codex/repos/ns006-w7` |
| Worktree | `/home/codex/repos/ns006-w7` |
| Branch | `fix/1629-cut-version-derived-tests` |
| Baseline | `origin/main@bf4b877f17b5cf34a96b6b40a424f19ca5073ddf` (2026-08-13) |
| Run ID | `fix-1629-cut-version-derived-tests--w7` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `normal_implementation` | Codex / OpenAI GPT-5.6 Sol / medium | Research, implementation, gates, draft PR |
| `formal_impl_eval` | Automatic draft-to-ready workflow route | Exactly one IMPL-EVAL after owner flips draft to ready |

## Recorded lane/eval overrides

- Owner explicitly controls the draft-to-ready transition. This session must not flip the PR or
  dispatch a manual evaluator.

