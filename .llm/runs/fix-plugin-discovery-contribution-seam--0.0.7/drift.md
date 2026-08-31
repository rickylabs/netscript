
## 2026-08-31 — PLAN-EVAL ruled N/A by the supervisor

- **What:** `PLAN-EVAL: N/A`; implementation authorized.
- **Concrete reason:** the seam decision is settled from the code (D1 uses the existing injected
  `ExtractorPort`; D3 chooses per-instance immutable configuration over a global registry; D4 avoids a
  manifest schema change), the ceiling is 6 paths, and the published-surface movement is **purely
  additive** — an optional constructor parameter plus two new exported types, with the three official
  mappings preserved as frozen defaults so no-arg CLI consumers and official factories are unaffected.
- **The plan's one deferred question is now answered by evidence, not deferral.** It locked the public
  names "unless PLAN-EVAL identifies a collision with an existing exported noun". The supervisor
  checked mechanically across `packages/`: `ContributionBuilderPattern` and `AstExtractorOptions` each
  have **0** existing exports, as do `ContributionBuilder` and `ExtractorOptions`. No collision; the
  names stand.
- **Severity:** minor
- **Action:** implement the locked slices within the 6-path ceiling. **Separate-session IMPL-EVAL
  remains mandatory** and is supervisor-dispatched; this leaf does not self-certify. MCP corpus
  staleness stays reported external scope per D6 — do not absorb it.

## 2026-08-31 — additive SDK surface leaves the MCP corpus stale

- **What:** S2 adds the exported `ContributionBuilderPattern` and `AstExtractorOptions` types and
  optional parameters on `AstExtractor` and `startWalker`. `deno doc` confirms all four published
  `@netscript/plugin/sdk` surface changes.
- **Impact:** the generated consumer
  `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` is now stale
  because its generator serializes package Deno-doc signatures. The corpus file was not regenerated
  or edited, and no `packages/mcp/**` path moved in this leaf.
- **Severity:** minor (planned external-scope handoff under D6)
- **Action:** the supervisor must coordinate the corpus refresh with its owner. This leaf preserves
  the hard six-path product/test ceiling and stops rather than absorbing that generated change.
