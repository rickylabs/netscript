# Context Pack: plugin doctor registry/source drift

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-plugin-doctor-registry-drift--0.0.7` |
| Branch | `fix/plugin-doctor-registry-drift` |
| Current phase | `evaluate handoff` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

Issue #1673 is implemented at product head `e5123a0e4f3d6844dbc173d5b09249a24e637fb8`
across exactly the six locked product/test paths. S4 has recorded every locked gate plus the two
supervisor-required measured cascade checks. Quality/doctrine, doc lint, publish dry-run, both
cascade checks, focused/related tests, exact-file check/lint, and lock hygiene pass. Scoped format
is red with exact attribution: three findings reproduce on pristine base `13878a80a`; the fourth is
the accepted S2 regression test present when this dispatch began. Tier-A and independent
opposite-family IMPL-EVAL remain coordinator-owned next steps.

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

- S4 evidence-only commit/push, final PR body evidence, and structured S4 comment.

## Next Steps

1. Commit/push S4 evidence by explicit refspec.
2. Finalize draft PR #1739's boxes and evidence block, then post the S4 structured comment.
3. Stop for supervisor Tier-A and the mandatory separate opposite-family IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Manifest discovery is authoritative | research / generator code | Avoids hard-coded plugin names. |
| Healthy wording is evidence-bounded | issue target / streams re-baseline | No claim about non-registry stream topology. |
| Generated cascade is measured | supervisor addition | `check:mcp-export-corpus` and `check:publish-assets` both pass; `check:assets-barrel` has no input path. |

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
| Fitness | PASS | exact-head quality/doctrine and doc-lint receipts; package publish dry-run exit `0` |
| Runtime | N/A | prohibited live surfaces |
| Consumer | PASS | focused `5/5`, related `47/47`; no live services |

## Open Questions

- None blocking implementation. Supervisor must later decide Tier-A/IMPL-EVAL verdicts.

## Drift and Debt

- Drift: issue's generic stream wording exceeds current registry-manifest surface; recorded as minor
  and handled by truthful evidence wording, not a product rescope.
- Debt: none created or closed.

## Commits

- Bootstrap: `d37b278b6` (pushed; draft PR #1739 opened).
- Red-before regression: `c947b8fa4` (pushed; S2 PR comment posted).
- Bidirectional comparison and production wiring: `e5123a0e4f3d6844dbc173d5b09249a24e637fb8`
  (pushed; S3 PR comment posted).
- S4: evidence-only commit is created after this context update and recorded in the PR comment.
