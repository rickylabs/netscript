# Worklog

## Design

1. Public surface: unchanged computed styles and generated query markup; CI rejects
   shipped component CSS exceeding raw or gzip limits.
2. Vocabulary: Utility scope is the existing three-alias root selector; component CSS
   is the non-theme registry CSS copied to applications; raw bytes are UTF-8 bytes,
   gzip bytes use the platform CompressionStream gzip encoding.
3. Ports: existing registry content, Deno filesystem/process, Web CompressionStream,
   actual page/resource generation APIs and Chromium browser fixture tools.
4. Constants: raw/gzip budget byte ceilings beside PUBLISH_BUDGET_BYTES; root selector
   remains explicit CSS syntax, with no new application state or attribute constants.
5. Commit slices: (1) this run's plan artifacts; (2) registry CSS, publish-size tests,
   CLI QueryResult regression, required generated carriers, browser proof and run
   evidence (Fresh UI/browser/scoped/carrier/full quality gates + independent review);
   (3) final evidence and current-main reconciliation if needed.
6. Deferred scope: per-style bundles and visual/token/markup redesign; the current
   browser contract can be preserved by nesting without an additional runtime seam.
7. Contributor path: `packages/fresh-ui/tests/publish-size.test.ts` documents the CSS
   budget; `query-result-template.ts` remains the shared query-view extension point.

PLAN-EVAL: N/A; bounded transformation and regression repair, explicit acceptance and
existing browser tools. Mandatory independent slice review/IMPL-EVAL before sign-off.

Owner route override (verbatim): `IMPL-EVAL: claude -p --model claude-opus-5-5 --effort high`, read-only.
Owner delivery specifics take precedence over generic dispatcher boilerplate: draft PR,
Refs #2524, no labels or session IDs, normal push only, STOP at READY; Cockpit merges.

## Intake

Assignment and issue comments read fully. No duplicate follow-up PR found. Deno 2.9.7
matches CI. Public paths repo-relative; private evaluator transcripts kept outside Git.
