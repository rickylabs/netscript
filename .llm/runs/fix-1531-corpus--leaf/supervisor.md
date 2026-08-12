# Supervisor Identity — fix-1531-corpus--leaf

Written at run start per `workflow/lane-policy.md` § Supervisor identity. A run dir without this
file is not activated. Other supervisors cross-peek a run by reading this file — it is how a run's
operating identity is discoverable without chat memory.

| Field | Value |
| --- | --- |
| Model | Codex · OpenAI · GPT-5.6 Sol · medium |
| Session | Current Codex implementation session (opaque session id) |
| Host | Linux / Codex workspace |
| Checkout | `/home/codex/repos/ns006-1531-corpus` |
| Worktree | `/home/codex/repos/ns006-1531-corpus` |
| Branch | `fix/1531-agent-docs-corpus-gate` |
| Baseline | `0551ff59283adccf75e251cd5e8c78d45bb35643` (`origin/main`, verified 2026-08-12) |
| Run ID | `fix-1531-corpus--leaf` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `normal_implementation` | Codex · OpenAI · GPT-5.6 Sol · medium | Implement the mechanical corpus rebuild and reproducibility gate. |
| `formal_impl_evaluation` | Native Claude · Anthropic · Opus 5 · read-only fallback (effort assigned by orchestrator) | Separate-session evaluation dispatched by the orchestrator per immutable head. |

Reference `.llm/harness/workflow/lane-policy.md`; do not copy its complete route table here.

## Recorded lane/eval overrides

- Owner directive for milestone `0.0.6`: Fable is prohibited at every depth. The orchestrator will
  dispatch a native Opus 5 read-only IMPL-EVAL fallback per immutable head; this implementation
  session does not launch or self-perform evaluation.
