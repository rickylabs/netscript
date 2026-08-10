# Supervisor Identity — fix-1408-docs-gates-on-pull-request--leaf

| Field | Value |
| --- | --- |
| Model | Codex · OpenAI · GPT-5.6 Sol · low effort (observed) |
| Session | Current Codex implementation session; session ID is not exposed to the agent |
| Host | YogaBook9i · WSL2 Linux · Rickylabs |
| Checkout | `/home/codex/repos/ns-docs-1408` |
| Worktree | `/home/codex/repos/ns-docs-1408` |
| Branch | `fix/1408-docs-gates-on-pull-request` |
| Baseline | `da40fbfe377a9e728f190056771298100297a8f8` (`origin/main`, 2026-08-10) |
| Run ID | `fix-1408-docs-gates-on-pull-request--leaf` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `light_implementation` | Codex · OpenAI · GPT-5.6 Sol · low | CI-plumbing implementation |
| `review_codex_light` | Claude · Anthropic · Opus 5 · high | Separate-session IMPL-EVAL, supervisor-owned |

Reference `.llm/harness/workflow/lane-policy.md`. No lane override is in force.
