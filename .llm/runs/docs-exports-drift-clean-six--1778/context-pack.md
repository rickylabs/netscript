# Context Pack: adopt six clean package references

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-exports-drift-clean-six--1778` |
| Branch | `docs/exports-drift-clean-six` |
| Current phase | `plan` |
| Archetype | N/A — docs tooling policy |
| Scope overlays | docs |

## Current State

Research and policy probing are complete on baseline `de57fab0`. The planned mapping uses
`complete` for `cron` and `entrypoints-only` for the other five candidates. Implementation and the
required gates remain.

## Completed

- Read issues #1778 and #1777 in full (both have zero comments).
- Read required skills and harness workflow files.
- Re-derived all six entrypoint results and all six complete-mode results.
- Verified generator input boundaries from source.
- Recorded justified `PLAN-EVAL: N/A` before implementation.

## In Progress

- Harness bootstrap commit and initial PR surface.

## Next Steps

1. Commit/push the run bootstrap and open the non-draft PR as owner-directed.
2. Add the six policy records.
3. Run every required gate and clean-main README baseline.
4. Update artifacts and PR body with pushed-head evidence.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| One complete, five entrypoints-only | `research.md`, live probes | Strongest policies the current pages support. |
| No dropped packages | `plan.md` D3 | All five incomplete tables make bounded rather than exhaustive promises. |
| No generated asset changes expected | Generator source inspection | Freshness gates still mandatory. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/docs-exports-drift-clean-six--1778/codex-thread-ids.md` | new (launcher-owned) | Session identity and steering record. |
| `.llm/runs/docs-exports-drift-clean-six--1778/{supervisor,research,plan,worklog,context-pack,drift}.md` | new | Harness run record. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pending | Required commands not yet run after implementation. |
| Fitness | partial | Source alignment research complete; final scope proof pending. |
| Runtime | N/A | No runtime change. |
| Consumer | pending | Export-drift task pending after edit. |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none created or changed.

## Commits

- See the PR commit list and per-slice comments after push.
