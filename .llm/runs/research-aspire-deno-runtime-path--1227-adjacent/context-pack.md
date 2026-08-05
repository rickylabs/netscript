# Context Pack: Aspire Deno runtime / NuGet dependency research

## Run Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `research-aspire-deno-runtime-path--1227-adjacent` |
| Branch         | `research/aspire-deno-runtime-path`                |
| Current phase  | `research`                                         |
| Archetype      | `6 — CLI / Tooling` subject; docs-only changeset   |
| Scope overlays | `docs`                                             |

## Current State

Research is complete. The branch began exactly at `origin/main` `00f96af76`; the draft PR is #1307.
The only pre-existing worktree change is `deno.lock`, which remains out of scope and uncommitted.

## Completed

- Required skills and harness/doctrine routing references read.
- Issue #1227 and its reopening evidence re-baselined.
- Archetype 6 + docs overlay, owner route, D6 waiver, and two-slice evidence design recorded.
- Both live upstream PRs and all current review threads/review summaries inspected.
- Seven isolated restore graphs measured; external export and a real Deno resource tested.
- Evidence-backed verdict and exact upstream watch signal written in `research.md`.

## In Progress

- S1 validation, commit, explicit-refspec push, and PR handoff.

## Next Steps

1. Run scoped documentation gates.
2. Commit and push S1 without `deno.lock`.
3. Complete the milestone-composed implementation evaluation and PR metadata.

## Key Decisions

| Decision                    | Source                | Notes                                  |
| --------------------------- | --------------------- | -------------------------------------- |
| No migration                | owner brief / plan D1 | No scaffold or source edits.           |
| Quantify package identities | plan D4               | Counts alone are insufficient.         |
| No local PLAN-EVAL          | owner ruling D6       | Recorded as composed waiver, not PASS. |

## Files Changed

| Path                                                            | Status            | Notes                                      |
| --------------------------------------------------------------- | ----------------- | ------------------------------------------ |
| `.llm/runs/research-aspire-deno-runtime-path--1227-adjacent/**` | new               | Harness metadata and research deliverable. |
| `deno.lock`                                                     | inherited/unowned | Preserve and exclude.                      |

## Gates

| Gate family      | Current status | Evidence                                        |
| ---------------- | -------------- | ----------------------------------------------- |
| Static/docs      | pending        | S1                                              |
| Fitness          | N/A            | No package/source change.                       |
| Runtime research | pass           | Seven restores; Toolkit generation/run/wait.    |
| Consumer/release | N/A            | No scaffold output or published surface change. |

## Open Questions

- None for the research verdict; upstream merge/release state remains intentionally conditional.

## Drift and Debt

- Drift: process overrides recorded in `drift.md`.
- Debt: none expected.

## Commits

- See the draft PR's commit list + per-slice PR comments.
