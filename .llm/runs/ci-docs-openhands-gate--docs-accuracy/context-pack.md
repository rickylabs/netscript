# Context Pack: automatic OpenHands docs-accuracy gate

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `ci-docs-openhands-gate--docs-accuracy` |
| Branch | `ci/docs-openhands-gate` |
| Current phase | `implement` |
| Archetype | N/A |
| Scope overlays | `SCOPE-docs.md` |

## Current State

Research, Design, PLAN-EVAL, implementation, focused validation, and A1 slice review are complete.
Draft PR #806 is open from planning commit `820f38a4`. Separate Claude Opus 4.8 high session
`aecf5196-28e3-4e9e-9158-6f5ee4e2f3f2` returned slice-review `PASS` with no blockers. The new
workflow uses a PAT-only comment, exact Minimax M3 guard, trusted-base prompt, explicit skip summary,
and exact-body/head-SHA unanswered dedupe.

## Completed

- Required skills and harness workflow references read.
- Clean branch/current-main/model/token/marker/mirror/fallback-doc facts verified.
- Plan and Design checkpoint recorded.
- PLAN-EVAL `PASS` recorded in `plan-eval.md`.
- Planning commit pushed and draft PR #806 opened with milestone 13 and phase metadata.
- Slice 1 implemented; workflow/schema/prompt assertions, volatile guard, skill mirror, and focused
  formatting are green.
- Opposite-family A1 slice review passed; PR state/comments reconciled with no plan adjustment.

## In Progress

- Supervisor sign-off commit and explicit-refspec push.

## Next Steps

1. Sign off, commit/push slice 1, update PR body/phase comment and reconcile metadata.
2. Run separate-session IMPL-EVAL without dispatching OpenHands.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Exact Minimax route with hard guard | plan D3 | Future cloud gate only. |
| Conditional executable testing | plan D6 | Pure prose emits the owner-specified one-line note. |
| PAT-only posting | plan D4 | Fail visibly if unavailable. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.github/workflows/docs-openhands-eval.yml` | new | Guarded, skippable automatic trigger. |
| `.llm/tools/agentic/openhands/docs-eval-prompt.md` | new | Cheap-and-quick evaluator prompt. |
| `.llm/harness/workflow/doc-audit-openhands-gate.md` | new | Pending PR #805 consolidation pointer. |
| `.github/labels.yml` | changed | Adds `docs-eval:skip`. |
| `.agents/skills/netscript-pr/SKILL.md` | changed | Canonical taxonomy note. |
| `.claude/skills/netscript-pr/SKILL.md` | generated | Synchronized mirror. |
| `.llm/runs/ci-docs-openhands-gate--docs-accuracy/*` | changed | Harness evidence and handoff state. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | YAML/schema/prompt assertions; volatile guard; mirror; format; A1 review |
| Fitness | PASS | docs overlay source/link/terminology review |
| Runtime | N/A | no eval dispatch |
| Consumer | PASS (structural) | docs/skip/dedupe scenarios asserted |

## Open Questions

- none

## Drift and Debt

- Drift: none.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments after bootstrap.
