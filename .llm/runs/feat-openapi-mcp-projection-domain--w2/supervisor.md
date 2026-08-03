# Supervisor Identity — feat-openapi-mcp-projection-domain--w2

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Codex / GPT-5 supervisor session |
| Session | Current Codex workspace session (opaque id) |
| Host | `YogaBook9i` · WSL2 Linux 6.18.33.2 · x86_64 |
| Checkout | `/home/codex/repos/ns005-s4` |
| Worktree | `/home/codex/repos/ns005-s4` |
| Branch | `feat/openapi-mcp-projection-domain` |
| Baseline | `2c8865e8c4ec60ef080276d327fc75ab32c0cb85` (`origin/main`, 2026-08-04) |
| Run ID | `feat-openapi-mcp-projection-domain--w2` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `planning_decisions` fallback | Codex / OpenAI / current supervisor session | Research, plan lock, slice supervision, PR authority |
| `complex_implementation` | Codex / OpenAI / GPT-5.6 Sol / high | Delegated source implementation, one stopped slice at a time |
| `review_codex_complex` | Claude / Anthropic / Fable 5 / medium | Opposite-family code review through the milestone composed review path |
| cloud evaluator | OpenHands / approved open model only | Milestone-run composed evaluation after draft→ready |

Reference `.llm/harness/workflow/lane-policy.md`; model ids remain centralized in the agentic
runtime configuration.

## Recorded lane/eval overrides

- The current supervisor is the in-product Codex session rather than the primary Fable
  `planning_decisions` route; the owner explicitly assigned this session as implementation
  supervisor.
- Formal local PLAN-EVAL is not launched. The owner explicitly invoked
  `.llm/harness/workflow/milestone-run.md` § Evaluator protocol and ruling D6: the plan is locked in
  this run and the gate is composed by draft→ready augment review, OpenHands, and the orchestrator
  pre-merge gate.
