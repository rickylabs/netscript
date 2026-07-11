# Research

## Re-baseline

- Issue #270 and its full owner comment were read on 2026-07-12.
- `packages/ai/src/ports/` has embedding and vision capability seams but no retriever.
- `@netscript/ai` has root, `./contracts`, `./ports`, and `./testing` exports; no export-map addition is required.
- E6's `EmbeddingProviderPort.embed()` is the existing query-vector dependency.
- No citation provenance contract currently exists in `packages/ai`; this slice must own the shared shape.

## Findings

- Archetype 2 (Integration) fits: a consumed retrieval seam plus an injected reference adapter.
- ANN/FTS and persistence remain app-owned. The reference adapter operates only on injected documents.
- The issue comment asks for broader chunker/cache work, but the supplied slice brief explicitly locks the deliverable to port, hybrid retrieval, citation provenance, and reference adapter.
- Existing package entrypoints already expose ports and testing adapters, so additions can remain additive.

## Publishability risks

- All new public symbols need explicit JSDoc and portable inferred types.
- No new dependency or permission is needed.
- Export-map unchanged; dry-run is still run as package evidence.

## Open questions resolved

- `k <= 0` returns an empty result rather than throwing, keeping the bound total and predictable.
- Documents may provide precomputed content/title vectors. Query embedding is injected and optional; unavailable/failing embeddings degrade to keyword-only retrieval.
