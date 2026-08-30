# Context Pack: adopt six clean package references

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-exports-drift-clean-six--1778` |
| Branch | `docs/exports-drift-clean-six` |
| Current phase | `evaluate` handoff |
| Archetype | N/A — docs tooling policy |
| Scope overlays | docs |

## Current State

Implementation and generator validation are complete on baseline `de57fab0`. All six candidates
are mapped: `cron` uses `complete`; the other five use `entrypoints-only`. All requested gates exit
0, while the extra README standard task reproduces the same exit 1 on clean `origin/main`.

## Completed

- Read issues #1778 and #1777 in full (both have zero comments).
- Read required skills and harness workflow files.
- Re-derived all six entrypoint results and all six complete-mode results.
- Verified generator input boundaries from source.
- Recorded justified `PLAN-EVAL: N/A` before implementation.
- Added all six policy records; the mapping grew from 8 to 14.
- Ran every requested gate with a real exit code.
- Proved zero `docs/site/**` and `deno.lock` changes.
- Reproduced the README baseline failure in a detached clean-main worktree.

## In Progress

- Final implementation commit/push, PR body evidence, and PR verification.

## Next Steps

1. Commit and push the implementation slice with the explicit refspec.
2. Post the structured implementation comment and replace the PR body with final evidence.
3. Hand off to Tier-A review and supervisor-dispatched IMPL-EVAL without changing `status:impl`.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| One complete, five entrypoints-only | `research.md`, live probes | Strongest policies the current pages support. |
| No dropped packages | `plan.md` D3 | All five incomplete tables make bounded rather than exhaustive promises. |
| No generated asset changes expected | Generator source inspection | Freshness gates still mandatory. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/tools/docs/check-exports-drift.ts` | changed | Six policy records added. |
| `.llm/runs/docs-exports-drift-clean-six--1778/codex-thread-ids.md` | new (launcher-owned) | Session identity and steering record. |
| `.llm/runs/docs-exports-drift-clean-six--1778/{supervisor,research,plan,worklog,context-pack,drift}.md` | new | Harness run record. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | Eight requested commands exit 0; detailed table in `worklog.md`. |
| Fitness | PASS | Source alignment, scope separation, link integrity, and asset freshness proven. |
| Runtime | N/A | No runtime change. |
| Consumer | PASS | `deno task docs:exports-drift` exits 0. |

## Open Questions

- None.

## Drift and Debt

- Drift: none; no packages dropped.
- Debt: none created or changed.

## Commits

- See the PR commit list and per-slice comments after push.
