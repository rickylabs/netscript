# Context Pack: #1709 lint partial-exclusion fail-closed

## Run Metadata

| Field          | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| Run ID         | `release-0.0.7-internals--orchestration/slices/lint-partial-exclusion-fail-closed` |
| Branch         | `fix/lint-partial-exclusion-fail-closed`                                           |
| Current phase  | `plan-eval` pending; implementation blocked                                        |
| Archetype      | `6-cli-tooling`                                                                    |
| Scope overlays | none                                                                               |
| Thread         | `01a047f0-f17e-7692-b6f0-83a6d22888c9`                                             |
| Baseline       | `cf648f1ff973d74c213bb125a6f5f5b9328e693b`                                         |

## Current State

Research and plan are complete under the plan-only authorization. No product/tool/config/workflow
source has been changed. The selected repair parses Deno's own `Checked N file(s)` summary and uses
same-config per-file probes only to identify a short batch's dropped paths; ambiguity fails closed.
The root doctor task correction is S1, before guard tightening in S2. Canonical CLI asset generation
is S3.

PLAN-EVAL is required and not performed by the author. The supervisor must evaluate the exact
committed/pushed plan head in a fresh Tier-A session before any implementation authorization.

## Completed

- Read the required skills, harness workflow/plan gate, Archetype 6, doctrine/JSR rubric, issue,
  frozen leaf contract, and supervisor research.
- Reproduced lint mixed-batch exit 0 versus batch-size-1 exit 2.
- Reconfirmed root lint `2037/35/0 → 2041/36/0`, both exit 0.
- Audited `run-deno-fmt.ts`; analogous defect proven and deferred behind explicit rescope.
- Captured CLI per-member audit baseline: exit 0/dry-run OK, 19 existing WARN findings.
- Locked signal, JSON/refusal semantics, semantic controls, three ordered slices, risks, and gates.

## In Progress

- Independent Tier-A PLAN-EVAL handoff on the exact pushed plan head.

## Next Steps

1. Supervisor runs fresh independent Tier-A PLAN-EVAL on the reported plan head.
2. If and only if verdict is `PASS`, coordinator separately authorizes implementation.
3. Later implement S1 → S2 → S3, each with gate evidence, supervisor review, commit, push, and PR
   phase comment.
4. Separately decide whether to rescope the format-wrapper defect; do not mix it into this leaf.

## Key Decisions

| Decision                                                        | Source                            | Notes                                          |
| --------------------------------------------------------------- | --------------------------------- | ---------------------------------------------- |
| Any silently dropped selected lint file forces exit 2.          | frozen coordinator decision       | Report-only green rejected.                    |
| `Checked N` + mismatch-only per-file probes establish identity. | `plan.md` D3-D5                   | Probe output never duplicates diagnostics.     |
| Doctor task exclusion removed first.                            | frozen sequencing                 | Exact expected transition `2037 → 2041`.       |
| Generated asset via canonical task only.                        | JSR/asset contract                | Embedded text/hash delta, no export/API delta. |
| Fmt mutation deferred.                                          | frozen surface + research finding | Explicit rescope required.                     |

## Files Changed

Only permitted harness artifacts in this leaf run directory are changed in the planning phase. The
planned later product surface is exactly the four paths listed in `plan.md`.

## Gates

| Gate family        | Current status                         | Evidence                                                                       |
| ------------------ | -------------------------------------- | ------------------------------------------------------------------------------ |
| Plan gate          | READY FOR INDEPENDENT EVALUATION       | `research.md`, `plan.md`, `worklog.md` Design section                          |
| Static / test      | NOT_RUN for implementation             | Planned commands locked; planning repros recorded separately                   |
| Quality            | NOT_RUN for implementation             | Must retain `allowCount: 7`                                                    |
| Consumer / publish | Baseline captured, after-state NOT_RUN | CLI audit baseline is 19 WARN findings; generated asset/member dry-run planned |
| Runtime / E2E      | N/A                                    | Frozen contract explicitly excludes these surfaces                             |

## Open Questions

- Leaf: none.
- Coordinator rescope outside leaf: whether to repair the proven format-wrapper analogue.

## Drift and Debt

- Drift: significant fmt analogue recorded in `drift.md`; deferred, no mutation.
- Debt: no new architecture debt planned; existing CLI warnings/doc debt remain baseline.

## Commits

- See the draft PR's commit list and phase comments after push. No implementation commit exists.
