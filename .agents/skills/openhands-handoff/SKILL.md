---
name: openhands-handoff
description: >
  Operate NetScript's OpenHands GitHub Actions, VPS, and PR-comment handoff workflow,
  including per-run model selection, output modes, and agent-to-agent triggers.
---

This skill is the routing card for OpenHands handoffs: comments and labels start cloud work, and the
required summary artifacts keep local and cloud agents synchronized.

## When to Use

- The user asks to trigger, configure, review, or debug OpenHands in this repo.
- A task mentions `@openhands-agent`, `agent:<model>`, `fix-me`, `[openhands ...]`, or OpenHands
  output modes.
- A local agent needs to hand work to cloud Actions or a VPS Web UI session.
- A cloud agent must respond to PR, issue, Copilot, or Augment review comments.

## When Not to Use

- For package or plugin architecture decisions, use `netscript-doctrine`.
- For harness run planning, evaluator protocol, or run artifacts, use `netscript-harness` first and
  this skill only for the OpenHands trigger/handoff mechanics.
- For JSR publish readiness, use `jsr-audit`.

## Key Concepts

| Concept          | Meaning                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| Actions agent    | `.github/workflows/openhands-agent.yml`, used for short cloud runs.                             |
| VPS session      | Long-running OpenHands Web UI/SDK deployment from `ops/openhands/docker-compose.yml`.           |
| Model profile    | `sonnet`, `gpt`, or `gemini`; maps to a LiteLLM model id in the workflow.                       |
| Literal model    | Any LiteLLM-compatible `provider/model` string supplied with `model=...`.                       |
| Provider secret  | `LLM_API_KEY_<PROVIDER>`, inferred from the model prefix, with `LLM_API_KEY` fallback.          |
| Output mode      | `pr-comment`, `respond-comments`, `thread-replies`, or `summary-only`.                          |
| Iteration budget | `iterations=<n>` trigger token (default 500, clamped 50-3000); a run cut off at the limit reports `agent-failed` and keeps partial workspace files via the commit-back step. |
| Summary artifact | `OPENHANDS_SUMMARY_PATH`, required before the workflow exits.                                   |
| Status comment   | One workflow-owned PR/issue comment that starts as running and is edited with the final result. |
| Thread replies   | Optional `OPENHANDS_REPLIES_PATH` review-comment replies.                                      |
| Chainable token  | `PAT_TOKEN` or GitHub App token; required for cloud-created events to trigger more workflows.   |

## Trigger Syntax

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

## Workflow

1. Use the trigger syntax and token rules in this skill.
2. If the prompt says `use harness`, load `netscript-harness` and follow its evaluator separation.
3. Choose the smallest trigger:
   - add `fix-me` or `openhands` for default model work,
   - add `agent:<profile>` for a model-label run,
   - comment `@openhands-agent model=<provider/model> ...` for a per-run literal model,
   - add `provider=<provider>` when routing a model through a provider gateway such as OpenRouter,
   - use `[openhands model=... output=...]` in a commit message for local-to-cloud handoff.
4. Choose an output mode:
   - `pr-comment` for ordinary summaries,
   - `respond-comments` when review comments must be addressed in one summary,
   - `thread-replies` only when exact PR review-comment IDs are available,
   - `summary-only` for artifact-only runs.
5. Require the cloud agent to write `OPENHANDS_SUMMARY_PATH` with changes, validation, comment
   responses, and risks. The workflow ignores legacy `.llm/tmp/openhands/summary.md`.
6. For long-running work, use the VPS Web UI deployment and leave a PR/issue comment that links the
   session outcome back to the GitHub thread.

## Common Pitfalls

- **Relying on `GITHUB_TOKEN` for chains**: GitHub suppresses workflows triggered by events created
  with the default Actions token. Use `PAT_TOKEN` or a GitHub App token when one cloud agent should
  trigger another.
- **Choosing thread replies without IDs**: `thread-replies` needs PR review-comment IDs in
  `OPENHANDS_REPLIES_PATH`. Use `respond-comments` for a single high-quality response when IDs are
  uncertain.
- **Skipping the summary artifact**: GitHub comments and PR bodies come from
  `OPENHANDS_SUMMARY_PATH`; missing summaries produce workflow failure diagnostics.
- **Reusing legacy OpenHands scratch files**: `.llm/tmp/openhands/` is gitignored runtime scratch.
  The workflow uses a clean per-run `OPENHANDS_RUN_DIR` and mirrors compact trace metadata to
  `OPENHANDS_TRACE_DIR`.
- **Posting duplicate comments**: the workflow owns the status/final comment. Agents write
  artifacts; they do not call `gh issue comment` directly.
- **Using Actions for long sessions**: move multi-step, human-in-the-loop work to the VPS Web UI.
- **Oversized single-run tasks**: a research+design+plan mega-prompt can exhaust the iteration
  budget during exploration, leaving zero artifacts. Split the task into sequential triggers
  and/or raise `iterations=`, and require the agent to create deliverable files early and grow
  them incrementally.

## Reference Files

| File                                     | Load when                                  |
| ---------------------------------------- | ------------------------------------------ |
| `.agents/skills/openhands-handoff/SKILL.md` | Any OpenHands trigger or handoff task   |
| `.github/workflows/openhands-agent.yml`  | Debugging or changing the Actions workflow |
| `.openhands/setup.sh`                    | Adjusting cloud bootstrap/toolchain setup  |
| `.openhands/microagents/repo.md`         | Updating OpenHands repo context            |
| `ops/openhands/docker-compose.yml`       | Deploying or changing the VPS Web UI       |
| `.llm/harness/workflow/agent-handoff.md` | Integrating OpenHands with harness phases  |

## Checklist

- [ ] Trigger names the model/profile when default model is not desired.
- [ ] Output mode matches the requested comment behavior.
- [ ] `PAT_TOKEN` or GitHub App token is configured for chained cloud events.
- [ ] `OPENHANDS_SUMMARY_PATH` is written before exit.
- [ ] Harness evaluator separation is preserved when the task says `use harness`.
