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

Slice 2.3 ties every capability outcome to current `deno doc` exports or live CLI help and to worked
code/committed diagrams on its canonical task page. No TS/TSX sample changed, so the required D10
snippet table records scratch checking as not applicable with a focused diff command.

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

## In Progress

- Commit, push, and comment slice 2.3 substantiation.

## Next Steps

1. Prove rendered semantics with the checker unchanged.
2. Run full docs gates, browser matrix, acceptance mapping, and lock proof.

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
| Browser | pending | slice 2.5 |
| Lock hygiene | pending final proof | slice 2.5 |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
