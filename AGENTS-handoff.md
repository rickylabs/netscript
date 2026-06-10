# Agent Handoff Protocol

This repo treats GitHub PR and issue comments as the shared message bus between local agents,
OpenHands in Actions, OpenHands on the VPS, Copilot, and Augment.

## Triggers

Use one of these from GitHub mobile, a local agent, or another cloud agent:

- Add `fix-me` or `openhands` to an issue or PR.
- Add a model label: `agent:sonnet`, `agent:gpt`, or `agent:gemini`.
- Comment with `@openhands-agent ...` from an owner, member, or collaborator account.
- Push a commit whose message contains `[openhands ...]`.
- Run `OpenHands Agent` manually from Actions.

Model selection is per run:

```text
@openhands-agent model=anthropic/claude-sonnet-4 use harness proceed to IMPL-EVAL
@openhands-agent agent=gemini output=respond-comments fix the legitimate Augment comments
[openhands model=openai/gpt-5.1 output=pr-comment] run a focused evaluator pass
@openhands-agent provider=openrouter model=openai/gpt-5.1 run through OpenRouter
```

The model precedence is:

1. manual workflow `model` input,
2. `model=...` in a comment or commit message,
3. `agent=<profile>` in a comment or commit message,
4. `agent:<profile-or-literal>` label,
5. repository variable `OPENHANDS_DEFAULT_MODEL`,
6. `anthropic/claude-sonnet-4`.

The workflow infers the provider from the selected model prefix unless `provider=...` is present.
For example:

| Model prefix           | Provider     | Preferred secret         |
| ---------------------- | ------------ | ------------------------ |
| `anthropic/`           | `ANTHROPIC`  | `LLM_API_KEY_ANTHROPIC`  |
| `openai/`              | `OPENAI`     | `LLM_API_KEY_OPENAI`     |
| `gemini/` or `google/` | `GEMINI`     | `LLM_API_KEY_GEMINI`     |
| `openrouter/`          | `OPENROUTER` | `LLM_API_KEY_OPENROUTER` |

Provider-specific secrets fall back to `LLM_API_KEY` when the specific key is absent. Optional
provider-specific base URLs use the same suffix pattern, such as `LLM_BASE_URL_OPENROUTER`, with
`LLM_BASE_URL` as the fallback.

## Output Modes

| Mode               | Behavior                                                                                |
| ------------------ | --------------------------------------------------------------------------------------- |
| `pr-comment`       | Post one summary comment to the target issue or PR.                                     |
| `respond-comments` | Post one summary comment that explicitly responds to relevant review or issue comments. |
| `thread-replies`   | Post the summary and any review-thread replies from `OPENHANDS_REPLIES_PATH`.           |
| `summary-only`     | Upload artifacts only; do not comment.                                                  |

The agent must write `OPENHANDS_SUMMARY_PATH` before exit. The workflow gives each run a fresh
`OPENHANDS_RUN_DIR` outside the repository checkout and mirrors compact trace metadata to
`OPENHANDS_TRACE_DIR`, usually under `.llm/tmp/run/openhands/<source>/run-<id>-<attempt>/`.
Do not write or reuse `.llm/tmp/openhands/summary.md`; that legacy shared path is ignored to avoid
posting stale summaries from old PR branches.

The workflow owns GitHub comments: it reacts to the trigger comment, posts one running status
comment with the Actions URL, then edits that same comment with the final summary. Agents should not
post their own PR or issue comments during OpenHands runs.

## Token Rule

GitHub does not trigger follow-up workflows from events created with the default `GITHUB_TOKEN`. Use
a dedicated bot PAT or GitHub App token in `PAT_TOKEN` when cloud-emitted commits, comments, or
labels should trigger another workflow.

Local agents that push with your own credentials already produce chainable events.

## Review Comment Workflow

For Augment or Copilot review comments:

1. Trigger with `@openhands-agent output=respond-comments ...` or `output=thread-replies`.
2. The workflow writes current issue comments to `OPENHANDS_ISSUE_COMMENTS_PATH`.
3. For PRs, the workflow writes review comments to `OPENHANDS_PR_REVIEW_COMMENTS_PATH`.
4. The agent fixes legitimate comments first when the prompt asks for that.
5. The final summary names each addressed comment and the validation result.

Use `thread-replies` only when the agent can map a response to exact PR review-comment IDs.

## Long-Running VPS Sessions

Use `ops/openhands/docker-compose.yml` for the Dokploy deployment. The VPS session is for multi-step
work that needs the OpenHands Web UI, pause/resume, or a human-in-the-loop checkpoint.

Recommended split:

- Actions workflow: short PR/issue fixups, evaluator passes, small research tasks, mobile triggers.
- VPS Web UI/SDK session: long-running implementation, planning with checkpoints, or work requiring
  human review before continuing.
