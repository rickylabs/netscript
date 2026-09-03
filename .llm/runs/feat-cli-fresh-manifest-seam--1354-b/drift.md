# Drift

Append-only log. No drift recorded at activation.

## 2026-09-02 — carrier path exceeds the locked ceiling

The required public-surface carrier cascade changes
`packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`. The locked
Slice B touch set enumerates six product files and says to stop if another product path is needed.
The implementation is therefore paused before commit/push/PR. Resolution requires an owner-approved
ceiling/touch-set amendment adding the generated MCP corpus, or an explicit ruling that carrier
outputs are exempt from the Slice B ceiling. No such ruling was inferred.

## 2026-09-02 — resolved: generated carriers are ceiling-exempt

The owner ruled that generated carrier outputs are ceiling-exempt for this slice and the later
#1354 slices. The corpus remains tooling-generated and was not hand-edited. Slice B resumes with the
original six scoped product paths, the accepted one-line dependency-only lock delta, and the
required generated corpus side effect. No handwritten scope was added.
