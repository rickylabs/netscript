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
```

The model precedence is:

1. manual workflow `model` input,
2. `model=...` in a comment or commit message,
3. `agent=<profile>` in a comment or commit message,
4. `agent:<profile-or-literal>` label,
5. repository variable `OPENHANDS_DEFAULT_MODEL`,
6. `anthropic/claude-sonnet-4`.

## Output Modes

| Mode               | Behavior                                                                                |
| ------------------ | --------------------------------------------------------------------------------------- |
| `pr-comment`       | Post one summary comment to the target issue or PR.                                     |
| `respond-comments` | Post one summary comment that explicitly responds to relevant review or issue comments. |
| `thread-replies`   | Post the summary and any review-thread replies from `.llm/tmp/openhands/replies.json`.  |
| `summary-only`     | Upload artifacts only; do not comment.                                                  |

The agent must write `.llm/tmp/openhands/summary.md` before exit.

## Token Rule

GitHub does not trigger follow-up workflows from events created with the default `GITHUB_TOKEN`. Use
a dedicated bot PAT or GitHub App token in `PAT_TOKEN` when cloud-emitted commits, comments, or
labels should trigger another workflow.

Local agents that push with your own credentials already produce chainable events.

## Review Comment Workflow

For Augment or Copilot review comments:

1. Trigger with `@openhands-agent output=respond-comments ...` or `output=thread-replies`.
2. The workflow writes current issue comments to `.llm/tmp/openhands/issue-comments.json`.
3. For PRs, the workflow writes review comments to `.llm/tmp/openhands/pr-review-comments.json`.
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
