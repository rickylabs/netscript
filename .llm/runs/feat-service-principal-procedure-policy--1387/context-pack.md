# Context Pack: #1387 typed principal and procedure policy

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `feat-service-principal-procedure-policy--1387` |
| Branch         | `feat/service-principal-procedure-policy`       |
| Current phase  | `plan`                                          |
| Archetype      | contracts: 1; service/plugin: 4                 |
| Scope overlays | `SCOPE-service` plus package doctrine           |

## Current State

Research and the locked nine-slice plan are complete on the recorded `625447f1` main baseline. No
product code exists in this leaf. #1466's PR #1731 remains open, so implementation has two
independent blockers: the metadata dependency must merge and a fresh opposite-family PLAN-EVAL must
return `PASS`.

After the research baseline froze, `main` advanced from `625447f1` to `f8b4f804` through an
unrelated cross-host skill-documentation/generated-assets commit. Its focused delta does not change
the researched policy surfaces, and Slice 0 already requires the authoritative post-#1466 rebase and
full base-gate rerun.

## Completed

- Re-derived all issue anchors and public surfaces with `deno doc` plus focused reads.
- Classified contracts/service/plugin archetypes, layering, verdicts, and existing debt.
- Inspected #1466's actual `NetScriptProcedureMeta` and SDK propagation.
- Enumerated all direct/context-forwarded `withContext` consumers.
- Counted the 54 currently undeclared first-party procedures and scaffold exposure.
- Resolved opt-in fail-closed migration, contract/fallback precedence, OpenAPI/MCP reach, and #884
  extension space.
- Ran every candidate gate at base and excluded pre-existing red gates.
- Produced planning artifacts only.

## In Progress

- None. This planning author must stop after draft PR/comment delivery.

## Next Steps

1. Dispatch a fresh Anthropic Claude / Fable 5 / medium PLAN-EVAL session using the run artifacts.
2. Require the evaluator to explicitly adjudicate fail-closed optional-auth binding and the
   corrected router-rename acceptance proof.
3. Wait for #1466/PR #1731 to merge.
4. Only after both conditions pass, rebase, re-run the base census, and dispatch implementation from
   Slice 1 under the current lane policy.

## Key Decisions

| Decision                         | Source                      | Notes                                         |
| -------------------------------- | --------------------------- | --------------------------------------------- |
| One additive metadata vocabulary | #1466 branch, plan LD-1/2   | `access.authorization` only                   |
| Service owns principal/context   | Doctrine, plan LD-3         | Plugin re-exports public service types        |
| Opt-in enforcement               | Migration census, plan LD-5 | Existing consumers/scaffolds unchanged        |
| Contract wins over fallback      | Plan LD-6/7                 | Same resolver informs authn and authz         |
| Optional runtime fails closed    | Plan LD-8                   | Await typed absent-vs-invalid credentials     |
| Rename proof corrected           | Drift, plan LD-11           | Metadata follows procedure; old SDK key fails |

## Files Changed

| Path                                                                      | Status | Notes                                      |
| ------------------------------------------------------------------------- | ------ | ------------------------------------------ |
| `.llm/runs/feat-service-principal-procedure-policy--1387/supervisor.md`   | new    | Non-identifying run identity and route     |
| `.llm/runs/feat-service-principal-procedure-policy--1387/research.md`     | new    | Re-derived evidence and migration analysis |
| `.llm/runs/feat-service-principal-procedure-policy--1387/plan.md`         | new    | Locked decisions, ceilings, slices, gates  |
| `.llm/runs/feat-service-principal-procedure-policy--1387/drift.md`        | new    | Append-only deviations/findings            |
| `.llm/runs/feat-service-principal-procedure-policy--1387/worklog.md`      | new    | Design and base gate evidence              |
| `.llm/runs/feat-service-principal-procedure-policy--1387/context-pack.md` | new    | Resumable handoff                          |

## Gates

| Gate family | Current status                    | Evidence                                                        |
| ----------- | --------------------------------- | --------------------------------------------------------------- |
| Static      | PASS at base                      | Five-root check/lint/fmt and 371 package tests                  |
| Fitness     | PASS for contracted gates         | `quality:gate`, export drift, service doc lint, four JSR audits |
| Runtime     | NOT_RUN                           | Forbidden/no runtime lease                                      |
| Consumer    | PASS at base / dependency pending | Plugin compile census; #1466 not merged                         |

## Open Questions

- PLAN-EVAL must explicitly accept LD-8 and LD-11 or return FAIL with a bounded alternative.

## Drift and Debt

- Drift: branch re-baseline, unmerged dependency, impossible rename wording, missing RTK, base-red
  candidate gates, and the unrelated post-freeze main advance are recorded in `drift.md`.
- Debt: no new debt proposed; existing service/plugin/#1278 items are preserved and excluded.

## Commits

- See the draft PR's commit list and phase comments.
