# Context Pack: GitHub Copilot cloud lane for the NetScript harness

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `feat-copilot-cloud-harness--copilot-cloud-lane` |
| Branch         | `feat/copilot-cloud-harness`                     |
| Current phase  | plan                                             |
| Archetype      | `6 - CLI / Tooling`                              |
| Scope overlays | docs, GitHub workflow                            |

## Current State

Harness run activated from `origin/main` at merge commit `1c9eeef1`. The owner requested research,
plan, review, and then a harnessed Copilot integration. No implementation is authorized yet.

## Completed

- Clean worktree and branch created without touching the canonical clone's user-owned `deno.lock`.
- New typed matrix read from the merged head.
- Feature-tier deep-research route selected: Gemini 3.8 Flash high through native `agy`.
- Research generated in a separate native `agy` session, then corrected against current primary
  GitHub and OpenCode documentation.
- Copilot cloud capability preflight passed: `copilot-swe-agent` is assignable to this repository.
- Owner-ratified route: OpenCode GitHub Copilot first for every Copilot-supported matrix model
  except OpenAI, Anthropic, and Gemini; those remain on native Codex/ChatGPT, Claude, and Google
  `agy` subscriptions. Cloud Agent Tasks remains a measured implementation canary; no immediate
  OpenHands removal.

## In Progress

- Plan generation. The declared feature-plan chain was exhausted before inference: Fable 5.1 hit its
  monthly spend limit, OpenCode Go rejected Muse Spark 1.3 while rate-limited, and OpenRouter's
  account privacy guardrail excluded Muse's paid-training endpoint.

## Next Steps

1. Complete the one-time OpenCode GitHub Copilot device authorization, attest the exposed catalog,
   and resume plan generation through the newly owner-ratified Copilot transport if the selected
   model is available.
2. Run separate-session PLAN-EVAL before implementation.
3. Implement only the ratified slices after `PASS`.

## Drift and Debt

- Drift: declared Fable→Muse plan route is temporarily unavailable; no model/tier substitution was
  made.
- Debt: none accepted.
