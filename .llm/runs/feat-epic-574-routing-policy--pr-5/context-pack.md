# Context pack — canonical routing policy migration (#581)

## State

Plan & Design prepared on branch `feat/epic-574-routing-policy`, stacked on `908d4f25`. Implementation
must not begin until the Claude coordinator completes Plan-Gate approval. This Codex session does not
self-certify.

## Locked scope

Migrate one canonical routing policy across harness/skills/docs/templates/generated mirrors and make
Codex/OpenHands launch edges enforce and record provider/model/effort using existing #577
`RouteIdentity`. Preserve #577–#580 and keep #582 rollout/promotion/canaries deferred.

## Key decisions

- One complete table: `.llm/harness/workflow/lane-policy.md`.
- Dated Fable planning override through 2026-07-12; GPT-5.6 Sol max from 2026-07-13.
- Deep analysis primary GPT-5.6 Sol xhigh; Fable only after classified quota exhaustion.
- Massive research/extraction uses Antigravity `agy`; Gemini wording is superseded drift.
- Outside-plan/higher-effort Fable is policy data only and requires explicit approval.
- Opposite-family evaluator session remains mandatory.
- `.claude/skills` is generator-owned; never hand-edit.

## Resume point

Await coordinator Plan-Gate. After approval, implement slices 2–5 from `plan.md`, one reviewed,
committed, explicitly pushed, and PR-commented slice at a time while updating this run directory.

