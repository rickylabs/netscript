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

Issue #1673 is re-baselined at `origin/main` `13878a80a`. S3 now implements manifest-backed,
bidirectional runtime-registry comparison across exactly the six locked product/test paths. The
focused structured suite is green (`passed=5 failed=0`), the related suite is green
(`passed=47 failed=0`), and exact-file type-checking reports zero diagnostics. S4 final-head gates
and independent IMPL-EVAL remain pending.

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
- Dry-run generator evidence now exposes normalized `sourceFiles` per manifest registry target.
- Doctor now detects missing entries, reverse orphan imports, and imported-but-unused bindings, and
  names the exact manifest-backed healthy/no-target evidence ceiling.
- Production composition supplies the existing generator closure while focused legacy doctor seams
  remain source-compatible because inspection is optional at the dependency interface.

## In Progress

- Slice-3 commit/push, PR body progress, and structured PR evidence comment.

## Next Steps

1. Commit/push S3 with the focused and related green evidence.
2. Update the draft PR's S2/S3 progress and post the S3 structured comment.
3. Run gates 1–10 plus the two measured cascade checks at the final implementation head.
4. Commit/push S4 evidence, finalize the PR body/comment, and stop for Tier-A.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Manifest discovery is authoritative | research / generator code | Avoids hard-coded plugin names. |
| Healthy wording is evidence-bounded | issue target / streams re-baseline | No claim about non-registry stream topology. |
| No generated cascade | path ceiling | No templates/assets/docs/exports touched. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| six locked `packages/cli` product/test paths | changed/new | Internal discovery evidence, comparison policy, orchestration, production wiring, and semantic regression coverage. |
| `.llm/runs/fix-plugin-doctor-registry-drift--0.0.7/*.md` | updated | S3 evidence and migrated-host implementation identity. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | PASS (authoring completeness only) | `research.md`, `plan.md`, `worklog.md`; PLAN-EVAL N/A, not self-certification |
| Static | PASS_S3 | focused `5/5`, related `47/47`, exact-file check zero diagnostics |
| Fitness | NOT_RUN | S4 final-head quality/doctrine and JSR gates pending |
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
- Red-before regression: `c947b8fa4` (pushed; S2 PR comment posted).
- Bidirectional comparison and production wiring: the S3 commit containing this context update;
  exact SHA is recorded in the PR comment after push.
