# Context Pack: homepage capability story

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-1334-homepage-capability-story--leaf` |
| Branch | `docs/1334-homepage-capability-story` |
| Current phase | `implement` |
| Archetype | N/A — docs-only |
| Scope overlays | `SCOPE-docs.md` |

## Current State

Slice 2.4 proves the rendered contract on a fresh 617-file build: semantic h2s are “One definition,
carried end to end”, “What the framework carries for you”, and “Where to go”; the destination count
is exactly five; card nested anchors are zero; `check-rendered-output.ts` is byte-unchanged from L1.

## Completed

- Confirmed both prerequisite merges and inspected L1 homepage/diagram hunks.
- Re-baselined live issue #1334 and recorded requested/observed identity.
- Selected docs overlay; PLAN-EVAL is N/A with rationale; separate IMPL-EVAL remains mandatory.
- Opened draft PR #1442 with required labels, milestone, closing keyword, and acceptance map.
- Added capability presentation; `Docs source format: OK`, build PASS, nested anchors = 0.
- Verified `definePage`, `freshUiRegistryManifest`, `createQueryFactories`,
  `createQueryCollection`, `createAuthBackendRegistry`, `definePlugin`, `defineSaga`, `defineJob`,
  `withSpan`, and `createScalarDocs` with `deno doc`; verified `db generate` and `agent mcp` with
  live CLI help.
- Rendered output PASS across 220 HTML files with the checker unchanged; semantic DOM probe PASS.

## In Progress

- Commit, push, and comment slice 2.4 rendered semantics.

## Next Steps

1. Run full docs gates, browser matrix, acceptance mapping, and lock proof.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Preserve L1 two-origin story | merge `714a4ef9b` | Do not edit its acceptance-critical regions. |
| Keep destination count 5/checker unchanged | F3/D12 | Capability section is independent. |
| Data card/collections/streams structure | F2/D13 | No inline anchor in linked card body. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/docs-1334-homepage-capability-story--leaf/*` | new | Harness bootstrap artifacts. |
| `docs/site/index.vto` | changed | Outcome cards and adjacent canonical task links only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | baseline PASS | worklog |
| Docs | source/build PASS | `Docs source format: OK`; 617 files; rendered output OK |
| HTML | PASS | `.ns-cards-grid__card a` count 0 |
| Rendered semantics | PASS | three expected h2s; 5 destinations; checker unchanged |
| Browser | pending | slice 2.5 |
| Lock hygiene | pending final proof | slice 2.5 |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
