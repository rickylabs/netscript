# Context Pack: automatic OpenHands docs-accuracy gate

## Run Metadata

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| Run ID         | `ci-docs-openhands-gate--docs-accuracy` |
| Branch         | `ci/docs-openhands-gate`                |
| Current phase  | `impl-eval`                             |
| Archetype      | N/A                                     |
| Scope overlays | `SCOPE-docs.md`                         |

## Current State

Research, Design, PLAN-EVAL, implementation, focused validation, A1 slice review, and IMPL-EVAL are
complete. Draft PR #806 contains implementation commit `4eeb4479`; local Qwen session
`83719d9f-797c-448c-96b7-d1b1d3d49024` returned IMPL-EVAL `PASS` with no blockers. The new workflow
uses a PAT-only comment, exact Minimax M3 guard, trusted-base prompt, explicit skip summary, and
exact-body/head-SHA unanswered dedupe.

## Completed

- Required skills and harness workflow references read.
- Clean branch/current-main/model/token/marker/mirror/fallback-doc facts verified.
- Plan and Design checkpoint recorded.
- PLAN-EVAL `PASS` recorded in `plan-eval.md`.
- Planning commit pushed and draft PR #806 opened with milestone 13 and phase metadata.
- Slice 1 implemented; workflow/schema/prompt assertions, volatile guard, skill mirror, and focused
  formatting are green.
- Opposite-family A1 slice review passed; PR state/comments reconciled with no plan adjustment.
- Implementation commit explicitly pushed; PR moved to `status:impl-eval` while remaining draft.
- Separate-session IMPL-EVAL passed; live OpenHands dispatch remained owner-prohibited N/A.

## In Progress

- Final harness-evidence commit, explicit-refspec push, and PR phase-comment reconciliation.

## Next Steps

1. Owner review of draft PR #806.
2. Consolidate the fallback audit note after the canonical PR #805 document lands.

## Key Decisions

| Decision                            | Source  | Notes                                               |
| ----------------------------------- | ------- | --------------------------------------------------- |
| Exact Minimax route with hard guard | plan D3 | Future cloud gate only.                             |
| Conditional executable testing      | plan D6 | Pure prose emits the owner-specified one-line note. |
| PAT-only posting                    | plan D4 | Fail visibly if unavailable.                        |

## Files Changed

| Path                                                | Status    | Notes                                  |
| --------------------------------------------------- | --------- | -------------------------------------- |
| `.github/workflows/docs-openhands-eval.yml`         | new       | Guarded, skippable automatic trigger.  |
| `.llm/tools/agentic/openhands/docs-eval-prompt.md`  | new       | Cheap-and-quick evaluator prompt.      |
| `.llm/harness/workflow/doc-audit-openhands-gate.md` | new       | Pending PR #805 consolidation pointer. |
| `.github/labels.yml`                                | changed   | Adds `docs-eval:skip`.                 |
| `.agents/skills/netscript-pr/SKILL.md`              | changed   | Canonical taxonomy note.               |
| `.claude/skills/netscript-pr/SKILL.md`              | generated | Synchronized mirror.                   |
| `.llm/runs/ci-docs-openhands-gate--docs-accuracy/*` | changed   | Harness evidence and handoff state.    |

## Gates

| Gate family | Current status    | Evidence                                                                            |
| ----------- | ----------------- | ----------------------------------------------------------------------------------- |
| Static      | PASS              | YAML/schema/prompt assertions; volatile guard; mirror; format; A1 review; IMPL-EVAL |
| Fitness     | PASS              | docs overlay source/link/terminology review                                         |
| Runtime     | N/A               | no eval dispatch                                                                    |
| Consumer    | PASS (structural) | docs/skip/dedupe scenarios asserted                                                 |

## Open Questions

- none

## Drift and Debt

- Drift: none.
- Debt: none.

## Commits

- `820f38a4` — approved plan and PLAN-EVAL evidence.
- `4eeb4479` — workflow, prompt, taxonomy, documentation, and A1 sign-off.
