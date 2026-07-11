# Plan — #269 MemoryPort

## Locked decisions

1. Preserve `AgentMemoryPort` and its optional recall signature; extend its existing record vocabulary.
2. Add `VectorMemoryStorePort` as the app-owned persistence axis and an in-memory starter.
3. `createVectorAgentMemory` composes the store with `EmbeddingProviderPort`, embeds distilled message
   text on store, cosine-ranks on recall, clamps `k`, and bumps retrieval metadata.
4. Distillation remains upstream: callers provide the already-distilled `MemoryRecord`.
5. `recallAgentMemory` is the future loop/prompt-assembly boundary: absent recall loads transcript;
   a present recall that fails returns `[]` and never breaks the turn.

## Open-decision sweep

- Vector database adapters: safe to defer; the injected store contract is sufficient.
- Pruning policy based on usage metadata: safe to defer; E10 records the signals only.
- Prompt formatting/insertion: safe to defer to E15; this slice returns records.
- Cross-thread/global recall: safe to defer; the existing thread-scoped contract is authoritative.

## Commit slice

1. Vector memory behavior and evidence — changes memory port/application/adapter, exports, tests,
   and run artifacts. Proved by scoped check/lint/fmt, unit tests, doc lint, and package dry-run.

## Risks

- Zero/mismatched vectors: cosine score deterministically degrades to zero.
- Invalid limits: clamp to a non-negative integer and available results.
- Embedding outage: recall catches and returns empty; transcript fallback is only for absent recall.
- Persistence coupling: store is injected; in-memory implementation is an explicit starter.

## Required gates

Scoped check/lint/fmt, package unit tests, doc lint, publish dry-run (public surface changed through an
existing export), and focused doctrine/manual consumer review. No runtime service gate is needed.

## Deferred scope

Summarization/distillation, database adapters, pruning, prompt assembly, and provider-specific policy.
