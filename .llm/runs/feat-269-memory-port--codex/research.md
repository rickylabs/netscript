# Research — #269 MemoryPort

## Re-baseline

- Baseline `955b4abf639522c7da50bd15d20c6e999acb808f` on `feat/269-memory-port` is clean.
- Issue #269 and its owner comment were read in full from `rickylabs/netscript`.
- Contrary to the original issue sketch, `packages/ai/src/ports/memory.ts` already owns
  `AgentMemoryPort`, `RecallQuery`, and `RecallResult`. The port combines transcript `append/load`
  with an optional `recall(threadId, query)` seam. E10 must implement, not redeclare, that seam.
- `EmbeddingProviderPort.embed` already supports scalar and batch inputs.
- No agent-loop code currently calls memory. The fallback invariant therefore needs a small
  application helper that future prompt assembly can consume without changing E3 input contracts.
- Distilled entries can use the existing `MemoryRecord.message` payload; E10 adds only the issue's
  category and retrieval metadata. No summarizer belongs in core.

## Architecture

Archetype 2 (Integration): embeddings and persistence are injected boundaries. No scope overlay.
The current doctrine verdict for `@netscript/ai` is Keep; this slice introduces no known debt.
AP-3, AP-8, AP-11, AP-17, AP-23, AP-25 are the principal risks.

## Publishability scan

The planned types use explicit return types and package-owned records; no inferred public slow
types or upstream re-exports are introduced. The existing `./ports` export reaches the new surface,
so the export map need not change.
