# Context Pack: GitHub Copilot cloud lane for the NetScript harness

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `feat-copilot-cloud-harness--copilot-cloud-lane` |
| Branch         | `feat/copilot-cloud-harness`                     |
| Current phase  | plan-eval (pending)                              |
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
  `agy` subscriptions by default. Catalog-attested Copilot Gemini is allowed only after native `agy`
  is unavailable. Cloud Agent Tasks remains a measured implementation canary; no immediate OpenHands
  removal.
- OpenCode GitHub Copilot device OAuth is complete. Live catalog attestation exposed exact IDs
  `github-copilot/claude-fable-5.1`, `github-copilot/gemini-3.8-flash`, `github-copilot/kimi-k3`,
  and `github-copilot/grok-4.6`. Fable through Copilot is a same-model plan fallback only after the
  native Claude subscription returned its terminal limit; it does not change the default route.

## In Progress

- PLAN-EVAL. `plan.md` is written (14 locked decisions, 10-item open-decision sweep, 12 slices, risk
  register, gate set, jsr-audit N/A, deferred scope). `worklog.md` `## Design` is populated.

## Next Steps

1. Run separate-session PLAN-EVAL on `glm_5_3@provider_default` (skip same-family Fable fallback);
   max two cycles, evaluator repairs on cycle two.
2. Implement only the ratified slices S1–S12 after `PASS`, committing per slice with PR comments.
3. Live Copilot canary only after static gates and explicit owner authorisation (`plan.md` D9).

## Drift and Debt

- Drift: declared Fable→Muse plan route was unavailable; plan generated on the owner-authorised
  same-model Copilot Fable fallback (see `drift.md` 2026-09-04 plan-generation entry).
- Debt: none accepted.
