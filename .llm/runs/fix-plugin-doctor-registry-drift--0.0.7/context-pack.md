# Context Pack: plugin doctor registry/source drift

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-plugin-doctor-registry-drift--0.0.7` |
| Branch | `fix/plugin-doctor-registry-drift` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

Issue #1673 is re-baselined at `origin/main` `13878a80a`. The late-saga regression has been authored
and run against unchanged product code: the structured wrapper exited `1` only because
`assertRejects` observed doctor incorrectly succeed (`passed=0 failed=1`). The exact six-path
product ceiling and all gates remain locked. Product implementation has not started; independent
IMPL-EVAL remains pending.

## Completed

- Required skills, harness activation/run-loop/lane policy, Archetype 6, plan gate, relevant doctrine,
  CLI command reference, JSR rubric, and current debt/verdict read.
- `deno doc packages/cli/mod.ts` inspected before source implementation reads.
- Current issue #1673 fetched; its five existing target-contract bullets were preserved and
  normalized into close-gated `## Acceptance` checkboxes so the requested structured evidence block
  is valid. Labels, milestone, state, and all other content were unchanged.
- Research, path ceiling, plan, design checkpoint, context pack, worklog, drift, and supervisor
  identity created.
- Red-before regression: generated a registry, added `sagas/late-saga.ts`, did not regenerate, and
  captured `AssertionError: Expected function to reject.` from the focused structured test.

## In Progress

- Slice-2 regression commit/push and PR evidence comment.

## Next Steps

1. Commit/push the red-before regression slice.
2. Implement within the six-path ceiling, then add reverse/aligned assertions and run focused green.
3. Run selected scoped gates and collect final-head receipts.
4. Push final implementation/evidence commits, comment phase evidence, and stop for Tier-A.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Manifest discovery is authoritative | research / generator code | Avoids hard-coded plugin names. |
| Healthy wording is evidence-bounded | issue target / streams re-baseline | No claim about non-registry stream topology. |
| No generated cascade | path ceiling | No templates/assets/docs/exports touched. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-plugin-doctor-registry-drift--0.0.7/*.md` | new | Harness lifecycle and evidence artifacts. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | PASS (authoring completeness only) | `research.md`, `plan.md`, `worklog.md`; PLAN-EVAL N/A, not self-certification |
| Static | RED_BASELINE | focused test exit `1`; expected assertion failure proves current doctor stayed green |
| Fitness | NOT_RUN | implementation not started |
| Runtime | N/A | prohibited live surfaces |
| Consumer | NOT_RUN | focused temp-workspace regression planned |

## Open Questions

- None blocking implementation. Supervisor must later decide Tier-A/IMPL-EVAL verdicts.

## Drift and Debt

- Drift: issue's generic stream wording exceeds current registry-manifest surface; recorded as minor
  and handled by truthful evidence wording, not a product rescope.
- Debt: none created or closed.

## Commits

- Bootstrap: `d37b278b6` (pushed; draft PR #1739 opened).
- Red-before regression: pending commit.
