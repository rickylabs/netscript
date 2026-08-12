# Supervisor Identity — fix-1377-gate--leaf

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Codex · OpenAI · GPT-5.6 Sol |
| Session | Current Codex implementation session (thread identifier not exposed) |
| Host | `YogaBook9i` · Linux/WSL · `codex` |
| Checkout | `/home/codex/repos/netscript-547-lffix` (shared Git common directory) |
| Worktree | `/home/codex/repos/ns006-1377-gate` |
| Branch | `fix/1377-docs-reference-gate-scope` |
| Baseline | `fa5d0d411054ba8aea272df392eb4e85b57c0d41` from `main`, dispatched 2026-08-12 |
| Run ID | `fix-1377-gate--leaf` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `normal_implementation` | Codex · OpenAI · GPT-5.6 Sol · medium | Plan author and, only after PLAN-EVAL PASS, implementation agent |
| `review_codex` | Claude · Anthropic · Opus 5 · low | Fable prohibited this milestone; this is the declared in-plan fallback in `routing-policy.ts:441` |
| formal PLAN-EVAL | Claude · Anthropic · Opus 5 · read-only | Native fallback dispatched by the orchestrator for each immutable head after the cloud evaluators stalled and were cancelled; no label cycling or paid retrigger. |

Reference `.llm/harness/workflow/lane-policy.md`; no lane overrides are in force.
