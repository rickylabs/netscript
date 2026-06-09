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
| Summary artifact | `.llm/tmp/openhands/summary.md`, required before the workflow exits.                            |
| Status comment   | One workflow-owned PR/issue comment that starts as running and is edited with the final result. |
| Thread replies   | Optional `.llm/tmp/openhands/replies.json` review-comment replies.                              |
| Chainable token  | `PAT_TOKEN` or GitHub App token; required for cloud-created events to trigger more workflows.   |

## Workflow

1. Read `AGENTS-handoff.md` for trigger syntax and token rules.
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
5. Require the cloud agent to write `.llm/tmp/openhands/summary.md` with changes, validation,
   comment responses, and risks.
6. For long-running work, use the VPS Web UI deployment and leave a PR/issue comment that links the
   session outcome back to the GitHub thread.

## Common Pitfalls

- **Relying on `GITHUB_TOKEN` for chains**: GitHub suppresses workflows triggered by events created
  with the default Actions token. Use `PAT_TOKEN` or a GitHub App token when one cloud agent should
  trigger another.
- **Choosing thread replies without IDs**: `thread-replies` needs PR review-comment IDs in
  `replies.json`. Use `respond-comments` for a single high-quality response when IDs are uncertain.
- **Skipping the summary artifact**: GitHub comments and PR bodies come from
  `.llm/tmp/openhands/summary.md`; missing summaries produce weak handoffs.
- **Posting duplicate comments**: the workflow owns the status/final comment. Agents write
  artifacts; they do not call `gh issue comment` directly.
- **Using Actions for long sessions**: move multi-step, human-in-the-loop work to the VPS Web UI.

## Reference Files

| File                                     | Load when                                  |
| ---------------------------------------- | ------------------------------------------ |
| `AGENTS-handoff.md`                      | Any OpenHands trigger or handoff task      |
| `.github/workflows/openhands-agent.yml`  | Debugging or changing the Actions workflow |
| `.openhands/setup.sh`                    | Adjusting cloud bootstrap/toolchain setup  |
| `.openhands/microagents/repo.md`         | Updating OpenHands repo context            |
| `ops/openhands/docker-compose.yml`       | Deploying or changing the VPS Web UI       |
| `.llm/harness/workflow/agent-handoff.md` | Integrating OpenHands with harness phases  |

## Checklist

- [ ] Trigger names the model/profile when default model is not desired.
- [ ] Output mode matches the requested comment behavior.
- [ ] `PAT_TOKEN` or GitHub App token is configured for chained cloud events.
- [ ] `.llm/tmp/openhands/summary.md` is written before exit.
- [ ] Harness evaluator separation is preserved when the task says `use harness`.
