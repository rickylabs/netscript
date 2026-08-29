# Context Pack: plugin doctor registry/source drift

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-plugin-doctor-registry-drift--0.0.7` |
| Branch | `fix/plugin-doctor-registry-drift` |
| Current phase | `plan` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

Issue #1673 is re-baselined at `origin/main` `13878a80a`. Research confirms saga/worker doctor
checks compare registry syntax to itself, while the installed runtime generator already owns the
manifest-based source discovery needed for a generic bidirectional check. The exact six-path product
ceiling and all applicable gates are locked before implementation. PLAN-EVAL is justified N/A;
independent IMPL-EVAL remains pending.

## Completed

- Required skills, harness activation/run-loop/lane policy, Archetype 6, plan gate, relevant doctrine,
  CLI command reference, JSR rubric, and current debt/verdict read.
- `deno doc packages/cli/mod.ts` inspected before source implementation reads.
- Current issue #1673 fetched; its five existing target-contract bullets were preserved and
  normalized into close-gated `## Acceptance` checkboxes so the requested structured evidence block
  is valid. Labels, milestone, state, and all other content were unchanged.
- Research, path ceiling, plan, design checkpoint, context pack, worklog, drift, and supervisor
  identity created.

## In Progress

- Bootstrap commit, explicit-refspec push, and draft PR creation.

## Next Steps

1. Commit/push Slice 1 and open the draft PR with `Closes #1673`.
2. Author the late-saga regression only; run it against unchanged product code and record the
   structured red output.
3. Implement within the six-path ceiling, run focused green/reverse tests and selected gates.
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
| Static | NOT_RUN | implementation not started |
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

- See the draft PR's commit list + per-slice PR comments after bootstrap.
