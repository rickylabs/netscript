# Plan & Design — READY FOR REVIEW

Feature tier; supplied leaf process; docs scope overlay; package/plugin archetypes and JSR: N/A.

## Locked decisions

Use released Pagefind **1.6.0**, containing native #1124, by exact import-map override of Lume's npm:pagefind@1.3.0. Keep Lume 2.5.4 and the existing plugin/API/UI integration. Make the ordinary Lume task frozen as well. Compose a narrow `docs/site/_plugins/pagefind.ts` plugin that sorts the underlying `allPages` array in place by URL using UTF-16 code-unit comparison, then registers the existing Pagefind plugin. Lume gives each processor a fresh filtered copy, so sorting the first argument would be ineffective. The later base-path processor inherits this ordering; emitted bytes of HTML, twins and AI indexes must match the captured baseline. Native IDs cannot inherit filesystem ordering (#1395). Never rewrite native output or weaken comparisons.

Retain failed baseline. First qualify the corrected build at an immutable implementation head using the strict checker, then remove the bounded CI argument and document strict-only acceptance. Re-prove the final exact head. Maintain browser UX/accessibility through the complete Utility browser matrix, and freeze/check only the site dependency lock.

## Commit slices

1. Bootstrap research/design and retained strict failure (this run only); independent PLAN review.
2. One cohesive subsystem implementation: `docs/site/deno.json`, site lock, narrow `_config.ts` plugin substitution, `_plugins/pagefind.ts`, `_plugins/pagefind-fixture.ts` (real Lume/native shuffled-ingestion test), `_plugins/pagefind_test.ts` (root-compatible test bridge), contributor instructions, and this run's evidence/context. Gate: `deno run --frozen --unstable-temporal -A https://deno.land/x/lume@v2.5.4/cli.ts` from docs/site; wrapper-backed `deno task --cwd docs/site test:pagefind` and root bridge test compare every native output byte for ordered vs shuffled input through the actual Lume processors; assert lock has no pagefind@1.3.0. Full strict two-build check, docs tooling/source wrappers and fixtures, full Utility browser suite; independent read-only IMPL/slice review before sign-off.
3. After exact-head strict proof: remove bounded mode invocation in `.github/workflows/pages.yml` and update `.github/scripts/ci-classify-changes.test.ts` to require strict invocation; delete the obsolete bounded mode from `tools/docs-site/check-reproducible.ts`, update `tools/docs-site/README.md`, and add the native ingestion task to Pages CI. Do not add artificial comparator unit tests: the strict complete two-build gate is the regression, and the existing classifier contract will assert that CI invokes strict mode and contains no allowance. Gate: final exact-head strict comparison and relevant CI classifier/workflow tests, separate-family review.

## Gates

Native Deno 2.9.7. Workflow's structured docs-tooling/browser check/lint/fmt wrappers and docs/source fixture tests; links/caveats and generated freshness. Full Utility Playwright suite through durable `fresh-ui-browser` receipt. Strict all-output two-build proof without allowances. Applicable workflow/classifier tests if workflow changes. CLI scaffold runtime gate per repository readiness instruction: execute once in readiness pass and accurately record runtime failures or policy skips. Run root configured `quality:gate` because its maintained scan includes docs/site; no framework package edits are planned.

## Risks and mitigations

- New upstream version alters search ranking/UI contract: full real-index browser tests and fallback/empty/error/stale/lazy/hash/filter coverage.
- In-place ordering affects downstream processors: compare every non-Pagefind output against captured main baseline, including HTML, twins and llms indexes.
- Native randomized ordering persists: strict all-byte comparator is the hard gate; keep CI allowance until exact implementation-head proof.
- Version is newly released: explicit pin + integrity lock, local native qualification and frozen install; do not relax global dependency policy.
- Unrelated main changes: normal merges only, re-evaluate exact final head after reconciliation; never force-push.

## Open decisions and debt

No unresolved design choices. Delete the bounded CLI mode entirely; no separate comparator fixture tests. The real native ingestion integration test and strict build gate provide regression coverage. Root configured `quality:gate` scan is also required because its maintained scope includes docs/site. Release qualification is a gate, not an assumed result. If it fails, revisit diagnosis with the same evaluator. No accepted architecture debt.

## Deferred

No S8 UI/layout/token edits; no #2450 consolidation, #2574/#2573 duplication, registry work, binary transforms or upstream source fork. Upstream #1395 native fix remains upstream; stable API ingestion order is sufficient for this site.
