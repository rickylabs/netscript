
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
