# Context Pack: `plugin install --no-samples`

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1017-plugin-install-no-samples--codex` |
| Branch | `fix/1017-plugin-install-no-samples` |
| Current phase | `evaluate` |
| Archetype | `6 — CLI / Tooling` with Archetype 5 connectors |
| Scope overlays | `none` |

## Current State

Research and design are complete. The reported subprocess/adapter cause holds. Every official
plugin barrel references samples, so the plan includes generic no-samples structural fallback input.
The approved implementation slice is complete. The flag crosses the subprocess boundary, the
adapter applies the published samples policy, all six sample paths are absent in the four-kind
black-box suite, and structural output type-checks. Scoped gates are green. The single mandated
`scaffold.runtime` run failed only at Aspire AppHost startup during `database.init` after all
scaffold/plugin gates passed.

Follow-up 2026-08-02: the stale suite-registry presentation expectation is aligned with the
intentional four-plugin no-samples suite while retaining one exact ordered full-list `assertEquals`.
All four historical workers plugin-package materialisation paths were empirically absent under
no-samples, so Task 2 was dropped. Focused and whole-CLI tests plus the scoped check and E2E lint
pass; the requested broad E2E format check exposes only an unrelated pre-existing README reflow.

## Completed

- Required skill/doctrine/harness reads.
- Cause re-baseline and caller/resource inspection.
- Plan and Design checkpoint.

## In Progress

- Plan-stage commit and draft PR are complete; PLAN-EVAL amendment is accepted.
- Production implementation, focused tests, and black-box E2E are complete.
- All requested scoped checks/lint/tests are green; runtime one-pass evidence is recorded.

## Next Steps

1. Commit and push the signed-off implementation slice.
2. Post the implementation evidence comment on PR #1028.
3. Hand off to the owner-designated Opus supervisor for IMPL-EVAL; do not mark ready.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Additive samples policy supports omit or fallback input | plan D2 | Default remains emit-all. |
| Empty barrels remain structural | plan D3 | Runtime glue remains unchanged and sample-independent. |
| Published alternate scaffolder policy | amended plan D2 | `samples` is undefined/omit/alternate; undefined preserves emit-all. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `packages/plugin/src/adapter/*` | changed | Published samples policy and install filtering. |
| `packages/cli/src/public/features/plugins/*` | changed | Threaded and serialized `includeSamples`. |
| `plugins/{workers,sagas,triggers,streams}/src/adapter/*` | changed | Sample classification and empty barrel alternatives. |
| `packages/cli/e2e/*` | changed | Four-kind exact-path black-box evidence. |
| `.llm/runs/fix-1017-plugin-install-no-samples--codex/*` | changed | Plan amendment, drift, and gate evidence. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | amendment accepted; implementation authorized | `plan-eval.md`, owner waiver |
| Static | PASS | scoped checks/lint/format; adapter and CLI tests |
| Fitness | PASS with pre-existing warnings | quality gate, doc lint, publish dry-run |
| Runtime | black-box PASS; scaffold.runtime environmental FAIL | worklog raw summaries |
| Consumer | PASS | sample-enabled tests plus sample-free workspace check |

## Open Questions

- None.

## Drift and Debt

- Drift: evaluator credential block resolved by owner waiver; Aspire AppHost timeout recorded without rescope.
- Debt: no new debt expected.

## Commits

- See the draft PR commit list + per-slice comments.
