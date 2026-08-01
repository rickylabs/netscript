# Context Pack: preserve resident AppHost during database CLI operations

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1011-db-apphost-lifecycle--codex` |
| Branch | `fix/1011-db-apphost-lifecycle` |
| Current phase | `gate` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

Branch is clean at `origin/main` baseline `3ab64720f`. Research identifies unconditional
`aspire stop --apphost <resident path>` in `executeDetached` as the concrete sufficient cause.
The canonical local Qwen evaluator launch failed authentication before reading the plan. The owner
explicitly approved D1–D4 and waived PLAN-EVAL due to the external evaluator outage, without a
fabricated verdict artifact. Slice 1 is implemented and all valid targeted, scoped, and harness
gates pass. The requested check spelling used an unsupported wrapper argument; the supported
equivalent passed and confirms `--unstable-kv` is enabled internally.

## Completed

- Skills/doctrine/archetype selection and current verdict review.
- Issue and code/test re-baseline.
- Plan, risk register, Design checkpoint, and gate selection.
- Supervisor PLAN-EVAL waiver recorded exactly as authorized.
- Ownership probe, conditional cleanup, and four requested lifecycle scenarios implemented.
- Targeted tests, scoped check/lint/fmt, quality scan, architecture check, and substantive review
  completed.

## In Progress

- Sign-off commit, push, and PR #1027 implementation update.

## Next Steps

1. Commit and push the reviewed slice.
2. Update PR #1027 body, labels, and implementation evidence while leaving it draft.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Explicit pre-start ownership probe | plan D1 | Never stop a pre-existing AppHost. |
| Studio unchanged | plan D3 | Interactive path remains out of scope. |

## Files Changed

- `operation-runner.ts` — pre-start liveness probe and ownership-bound cleanup.
- `operation-runner_test.ts` — exact resident, owned, failed-operation, ambiguous-probe sequences.
- Run artifacts — waiver, gates, review, and resumable state.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | waived | evaluator unavailable; owner/supervisor approved D1–D4 |
| Static | pass | adapter tests + supported scoped check/lint/fmt exit 0 |
| Fitness | pass | quality scan + architecture check exit 0 |
| Runtime | pass (executor seam) | resident path records no stop; owned paths do |
| Consumer | pass | studio regression assertion unchanged and green |

## Open Questions

- None.

## Drift and Debt

- Drift: issue diagnosis differed; concrete explicit-stop cause is established. PLAN-EVAL was
  explicitly owner-waived after the local transport outage.
- Debt: none created or deepened.

## Commits

- See the draft PR commit list + per-slice PR comments.
