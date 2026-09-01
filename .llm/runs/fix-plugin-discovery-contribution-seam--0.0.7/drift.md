
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

## 2026-09-01 — S3 scope authorization supersedes the S2 ceiling

- **What:** the supervisor approved `plan-s3.md` and its exact 12-path ceiling, including official
  connector declarations, the quality guard, and canonical MCP corpus regeneration.
- **Mandatory addition:** pre-S3 projects with contribution calls but no regenerated declaration
  must fail loudly, naming the callee and directing the user to plugin sync/update or
  `additionalBuilders`; an empty project remains quiet.
- **Impact:** no hard-stop condition was triggered. No manifest schema, `packages/config` constant,
  or forbidden cross-package dependency edge was needed.
- **Severity:** planned scope expansion.
- **Action:** implemented as separate RED/GREEN declaration and guard slices. Fresh exact-head
  separate-session IMPL-EVAL remains supervisor-owned.

## 2026-09-01 — MCP corpus regenerated under S3 authorization

- **What:** `deno task check:mcp-export-corpus` reproduced the known stale-corpus exit 1; the
  canonical generator changed only
  `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`, after which
  the check exited 0.
- **Impact:** this incidentally clears the deterministic corpus staleness tracked by #1873. It does
  not address or claim #1873's separate CI-gating work.
- **Severity:** planned generated-artifact movement.
- **Action:** keep the PR body explicit about the incidental fix and the narrower claim.

## 2026-09-01 — static guard limits

- **What:** `plugin-discovery-core-coupling` catches literal factory/axis mapping objects and literal
  comparisons or string predicates on `callee`/`axis` in host/core `packages/**` source. A fixture
  using the arbitrary future factory `defineExample` proves the rule is not a snapshot of today's
  three names.
- **Limit:** encoded strings, computed property keys, and cross-file aliases are not resolved by this
  token-level check.
- **Severity:** accepted bounded-static-analysis limit; existing `PLG-WALKER-AST` debt remains.
- **Action:** state the limit without overclaiming in PR/handoff evidence.
