# Plan

## Profile and verdict

- Archetype 2 — Integration.
- Current doctrine verdict has no dedicated `@netscript/ai` row; new code is held to the doctrine immediately.

## Locked decisions

1. Add an async `RetrieverPort.retrieve(query, k)` contract under `src/ports/`.
2. Own citation provenance as `{ sourceId, title, span }`, where span contains character offsets and optional quoted text.
3. Return content, normalized score, `matchedBy`, and provenance in every ranked result.
4. Implement `InMemoryRetriever` under `src/adapters/`; all documents and vectors are constructor-injected and module loading is effect-free.
5. Blend normalized vector and keyword scores using configurable alpha, plus a configurable title boost. Deduplicate by document id before final ranking.
6. Treat failed/unavailable query embedding as a keyword-only fallback.
7. Do not add ANN, FTS, SQL, persistence, chunking, or embedding cache behavior.

## Gates

- Scoped check, lint, and format wrappers for `packages/ai`.
- Unit tests for vector-only, keyword-only, hybrid overlap/dedup/rank fusion, title boost, tags, provenance, and k-bound.
- Full package unit tests.
- `deno task doc:lint --root packages/ai --pretty`.
- Package publish dry-run because the public surface changes (export map itself does not).

## Risks

- Score scales differ: normalize each candidate channel before weighted fusion.
- Zero vectors: cosine returns no vector match.
- Citation span invalidity: preserve injected provenance rather than guessing offsets.
- Existing unrelated worktree changes: inspect status before staging and stage only owned files.

## Debt

No new doctrine debt expected.

## Deferred scope

Sentence chunking, TTL/MRU query cache, real ANN/FTS adapters, persistence, and application wiring.
