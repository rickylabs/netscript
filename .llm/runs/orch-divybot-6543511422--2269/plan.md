# Plan & Design — READY FOR REVIEW

One feature-tier leaf for issue 2269, coordinator 2474, E2. No merge/tag/release.
PLAN-EVAL is required before implementation. Archetypes: MCP integration/tooling and CLI 6;
no CLI spine/command/registry changes. Existing doctrine architecture retained.

Locked decisions:
- MCP owns the existing full compressed docs carrier via @netscript/mcp/docs. CLI imports this
  public subpath, with compatibility exports only where needed. Same canonical site generator,
  same per-page integrity, no curated fallback list or second prose transport.
- Exclude the derived llms-full aggregate from indexing; every source page still resolves.
- Preserve canonical returned pages/... slugs for compatibility; deterministic lookups accept
  with/without pages/, /index, extension, and trailing slash. Explicit aliases remain deterministic.
- Release responses carry framework version and content-addressed corpus citation.
- Guidance confidence requires meaningful intent coverage; unsupported read-model seams return
  explicit low confidence. Regression fixtures cover every issue intent, including API search.

Slices:
1. Shared full corpus + release citations + slug walk. Move carrier/transport/policy into MCP,
   expose docs.ts, adapt CLI consumers and generators, freshness fixtures and tests, docs inventory.
   Gates: scoped check/test/lint/fmt, corpus parity, generator tests, carrier freshness, quality:gate.
2. Honest intent guidance and issue fixtures. Guidance index/concepts if required, test fixtures,
   search/guidance roundtrip and negative controls. Gates: complete MCP docs tests, structured
   scoped quality, quality:gate, check:mcp-export-corpus and carrier gates.
3. Evaluation fixes/evidence only as needed; exact pushed-head independent final evaluation.

Risks: transport relocation can leave stale generator/CI paths (search all consumers, parity gates);
full-corpus index can change ranking (existing guidance suite and issue fixtures); normalization can
collide (preserve pages canonical identity, explicit exact precedence); citations can exceed bounds
(add short immutable metadata only); cyclic imports (public docs data independent of release adapter).

JSR audit: explicit types and module docs on docs.ts and transport exports; no slow inferred
exports; generated compressed corpus stays runtime filesystem independent. Run doc:lint and
package dry-run/audit on MCP, targeted consumer tests on CLI. No new packages or dependencies.

Gate set: structured check/lint/fmt/test wrappers; quality:gate; doc:lint; JSR static audit/dry-run;
check:agent-docs-prose, check:assets-barrel, check:publish-assets, check:mcp-export-corpus;
review-thread gate and CI snapshot at final head. Negative controls revert behavior in isolation
and restore it, recording failing fixture names.

No scaffold templates, plugin scaffolding, database or runtime wiring change is planned; local
scaffold.runtime is forbidden by owner. Reassess CI e2e-cli need if generated output changes.
No open architectural decisions. Deferred: external network retrieval, API export corpus redesign,
new undocumented producer seams, release publication. No architectural debt planned.
