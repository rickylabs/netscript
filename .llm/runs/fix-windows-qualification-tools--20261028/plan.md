# Locked plan

Profile: existing repository tooling repair, documentation scope overlay; no package/plugin archetype or public API change.

1. Add native filesystem discovery regression and a many-example compiler regression exceeding the old Windows argv limit; reproduce RED with real Windows Deno.
2. Return canonical slash-separated reference page identifiers while retaining native filesystem lookup.
3. Write one explicit temporary entry module importing every already materialized example by file URL; pass that entry module to `deno check`. Preserve isolated modules, diagnostic attribution, nonempty selection checks, strict compiler options, copied lock and cleanup.
4. Verify owning tests with all sanitizers, negative controls, type/lint/fmt wrappers on precisely four files, related docs tests, and bounded full export/accuracy/JSDoc gates. Preserve all failures and classify genuine downstream errors separately.

PLAN-EVAL: N/A. This is a concrete mechanical tool correction with fixed owners, unchanged public contracts and explicit negative acceptance criteria; no architecture or release/runtime decisions. Tier-A source review and independent IMPL-EVAL remain required.

Risks: an entry module omitting a target could produce false green (tail error/count parity regression); changing path identity could weaken coverage (neither/both classification and filesystem regressions); temporary or tracked lock leakage (cleanup and lock snapshots). No diagnostics, exclusions or baseline docs will be changed to green a gate.

Supervisor-authorized rescope after native related-test RED: add only existing `.llm/tools/docs/jsdoc-example-policy.ts`; canonicalize three document-identity boundaries to forward slashes. Preserve native filesystem lookup, corpus selection/dedup and every immutable #1766 corpus assertion. No corpus/policy test edits. Existing native corpus RED to GREEN and its old-signature TS2322 control supply the regression proof. PLAN-EVAL remains N/A for the same mechanical boundary correction; source review and independent IMPL-EVAL remain required.
