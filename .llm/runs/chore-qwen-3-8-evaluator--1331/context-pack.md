# Context Pack: canonical Qwen 3.8 formal evaluator

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-qwen-3-8-evaluator--1331` |
| Branch | `chore/qwen-3-8-evaluator` |
| Current phase | `plan-eval` |
| Archetype | N/A — maintainer harness/tooling/configuration |
| Scope overlays | docs |

## Current State

Issue #1331 is re-baselined against `origin/main` at `57c9b5ab3`. Research, plan, Design checkpoint,
supervisor identity, context, and drift artifacts are complete. No implementation/config/model file
has been edited. The run is at the hard PLAN-EVAL stop and requires a separate OpenRouter
`qwen/qwen3.8-max` session.

## Completed

- Read governing AGENTS, harness, PR, tooling, and RTK instructions plus required harness workflow
  and Plan-Gate documents.
- Verified live issue #1331 scope, acceptance, and milestone id 23.
- Fetched current `origin/main`; baseline and branch HEAD match.
- Audited tracked 3.7/Qwen references and canonical generation paths.
- Locked three implementation slices and their focused/full/generated/live gates.
- Recorded exact requested/observed Codex launch identity and owner-authorized route overrides.

## In Progress

- Draft PR creation and transition to formal PLAN-EVAL.

## Next Steps

1. Commit only `.llm/runs/chore-qwen-3-8-evaluator--1331/**`; exclude `deno.lock`.
2. Push explicit refspec and open draft PR to `main` with `Closes #1331`, labels, milestone 0.0.5,
   and plan phase comment.
3. Launch a separate OpenRouter `qwen/qwen3.8-max` PLAN-EVAL session and require `PASS` in
   `plan-eval.md` before S1.
4. After PASS, implement S1–S3 with gate → ordinary review → supervisor sign-off → push/comment per
   slice.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Exact formal evaluator id is `qwen/qwen3.8-max` | owner / issue #1331 | Both formal passes; separate sessions. |
| Generator is Codex GPT-5.6 Sol low/full access | owner / launch record | Observed identity matches request. |
| Ordinary review temporarily uses Kimi K3 or Grok 4.5 | owner | Anthropic subscription exhausted until Saturday. |
| Three sequential slices | `plan.md` / `worklog.md` | Shared central config makes parallel edits conflict-prone. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/chore-qwen-3-8-evaluator--1331/**` | new | Planning/bootstrap artifacts only. |
| `deno.lock` | pre-existing unrelated modification | Not owned, edited, or staged by this run. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Plan | READY_FOR_PLAN_EVAL | `research.md`, `plan.md`, `worklog.md#design` |
| Static | Planned | Concrete commands in `plan.md` |
| Fitness | N/A unless package/plugin scope appears | Current non-package scope |
| Runtime | Planned | Exact bounded Qwen 3.8 canary in S2 |
| Consumer | Planned | Canonical Claude/consumer generators and checks in S3 |

## Open Questions

- None blocking PLAN-EVAL. Kimi versus Grok for each ordinary review is safe to choose at dispatch.

## Drift and Debt

- Drift: owner-authorized evaluator/reviewer overrides and unrelated dirty lockfile are recorded in
  `drift.md`.
- Debt: none created; historical 3.7 debt/run attributions will be classified during final audit.

## Commits

- See the draft PR's commit list + per-slice PR comments. V3 has no `commits.md`.
