# Worklog

## Design

### Public surface

- `RetrieverPort.retrieve(query, k)`
- `CitationProvenance`, `CitationSpan`, `RetrievalResult`, `RetrievalMatchKind`
- `InMemoryRetriever`, `InMemoryRetrieverDocument`, `InMemoryRetrieverOptions`

### Domain vocabulary

- Retrieval match kinds: `vector`, `keyword`, `hybrid`.
- Citation provenance: stable source id, display title, character span.
- Reference document: stable id, content, provenance, optional content/title embeddings.

### Ports

- New consumed `RetrieverPort`.
- Existing `EmbeddingProviderPort` optionally supplies query vectors to the reference adapter.

### Constants

- `RETRIEVAL_MATCH_KINDS`
- Defaults: alpha `0.5`, title boost `0.15`, over-fetch factor `4`.

### Commit slices

1. Contract + reference adapter + focused tests + public exports; prove with scoped/static, unit, doc, and publish gates.
2. Evidence/worklog closeout and commit/push verification.

### Deferred scope

ANN/FTS adapters, SQL, chunking, caches, and runtime composition are deliberately excluded.

### Contributor path

Read `src/ports/retriever.ts` for the stable contract, then copy the constructor-injected pattern in `src/adapters/in-memory-retriever.adapter.ts` for app-owned adapters.

## Process

- PLAN-EVAL owner-waived by the slice brief (carried drift D1).

## Evidence

| Gate | Result |
| --- | --- |
| Scoped format wrapper (`packages/ai`, `ts,tsx`) | PASS — 80 selected, 0 findings |
| Scoped check wrapper (`packages/ai`, `ts,tsx`, `--unstable-kv`) | PASS — 80 selected, 0 diagnostics |
| Scoped lint wrapper (`packages/ai`, `ts,tsx`) | PASS — 80 selected, 0 findings |
| Focused retriever tests | PASS — 7 passed, 0 failed |
| Full `packages/ai` tests | PASS — 96 passed, 0 failed |
| `deno task doc:lint --root packages/ai --pretty` | PASS — 0 combined errors |
| Package `deno task publish:dry-run` | PASS — dry run complete; three pre-existing MCP dynamic-import warnings |

## Implementation notes

- The first focused test run found that clamping a perfect keyword score erased title-boost ordering. Fusion now divides the boosted raw score by its maximum possible scale, preserving title ordering and the public 0–1 score invariant.
- Query embedding failures intentionally degrade to keyword-only results.
- Reconcile: issue #270 remains open and in `status:plan`; no PR or issue mutation was authorized. The branch push is the required handoff.
- No new or deepened architecture debt identified.

## Commit and push

- Implementation/evidence commit: `3bae03b9` (`feat(ai): prove hybrid retrieval with citation provenance`).
- Push: PASS — `origin/feat/270-retriever-port` created at `3bae03b9`.
