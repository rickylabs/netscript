# Context Pack: generated design registry catalog drift gate

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-design-registry-catalog-drift-gate--0.0.7-wave1` |
| Branch | `fix/design-registry-catalog-drift-gate` |
| Current phase | `plan` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `frontend` |

## Current State

The immutable base and branch identity are verified. Research reproduced the defect before edits:
66 live manifest items, 50 generated gallery entries/declared total, 16 manifest-only names, and 0
catalog-only names. The gallery kind filter covers every kind, so the independent incomplete static
snapshot is the root cause. Plan and design are locked; `PLAN-EVAL: N/A` is justified as a complete
mechanical contract.

## Completed

- Read all requested skills and their required harness/doctrine/fresh-ui authority files.
- Inspected public surfaces with `deno doc` before focused source reads.
- Fetched live issue #1358 and preserved its full acceptance contract.
- Recorded red-first counts, exact missing names, Git history, root cause, JSR risks, plan, and
  design checkpoint.

## In Progress

- S0 bootstrap commit, explicit-refspec push, draft PR creation, taxonomy, milestone, and opening
  structured comment.

## Next Steps

1. Commit and push S0; open the draft PR against `main` with `Closes #1358` and required anchors.
2. S1: mechanically project the missing items and all collections into the CLI template.
3. S2: add the semantic real/negative drift tests and run authorized gates.
4. Stop at the `fresh-browser` lease boundary and hand off for Tier-A review.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| `PLAN-EVAL: N/A` | worklog | Complete mechanical contract; no unresolved rework decision. |
| Static app-owned projection | plan LD-1 | Avoids published runtime file/import-meta/self-import traps. |
| Symmetric semantic comparator | plan LD-4/LD-5 | Names missing/extra/changed values and supports negative fixtures. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-design-registry-catalog-drift-gate--0.0.7-wave1/*` | new | Coordinator thread identity preserved; mandatory harness artifacts added. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | red reproduced; implementation gates pending | `research.md` 66/50/16 probe |
| Fitness | pending | `quality:scan`, `arch:check`, JSR audits planned |
| Runtime | lease-blocked | Aspire/Docker/E2E/browser not run |
| Consumer | pending | static generated catalog then lease-gated browser proof |

## Open Questions

- None for implementation. A fresh coordinator lease is required only when `fresh-browser` becomes
  the remaining gate.

## Drift and Debt

- Drift: minor missing legacy `.claude/05-frontend.md` pointer; applicable authorities were read.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments after S0 is pushed.
