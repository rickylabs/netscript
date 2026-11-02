# Plan & Design — READY FOR REVIEW

Scoped docs-tooling and MCP domain change, docs overlay; existing MCP layered architecture retained. No exported package API or CLI protocol changes. JSR review: no new public exports, runtime dependencies, or slow types; generated prose remains canonical.

Locked decisions:

1. Generate a compact preset manifest; keep full catalog build-only and available for documentation census.
2. Split preview examples using native Deno browser bundles. Default workspace imports only its composed components. Defer preset codec parsing to import/share restoration.
3. Measure initial builder/workspace JS and preset JSON raw/gzip. Share policy with existing component CSS budget; test budget overruns and real browser request closure.
4. Route using corpus-derived component identities/aliases with explicit contextual disambiguation for ordinary words. Keep framework concepts ahead of ambiguous matches.
5. Document unsupported independent pickers and S6b extension plan on the builder, contributor README, and issue handoff.

PLAN-EVAL: N/A. Bounded follow-up with issue-defined behavior, static assets, no protocol redesign or destructive/runtime changes. Independent IMPL-EVAL remains mandatory before implementation sign-off.

Slices: (1) this plan; (2) payload/routing/docs implementation with focused tests, browser proof, site/docs/carrier checks and independent review; (3) final evidence and delivery reconciliation if needed. All implementation commits update worklog/context.

Risks: split chunks must retain deployment base path and all component previews; browser census proves them. Lazy codec must preserve exact CLI validation and malformed input handling. Generic questions must remain correctly ranked; bidirectional routing regressions cover them. No open decisions require owner input.

Deferred: new anatomies beyond Utility (S6b), independent icon/font/menu/accent/radius/density pickers unsupported by current builder/resolver. No accepted architectural debt.
