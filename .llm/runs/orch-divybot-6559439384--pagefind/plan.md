# Plan & Design — READY FOR REVIEW

Feature tier; supplied leaf process; docs scope overlay; package/plugin archetypes and JSR: N/A.

## Locked decisions

Use released Pagefind **1.6.0**, containing native #1124, by exact import-map override of Lume's npm:pagefind@1.3.0. Keep Lume 2.5.4 and the existing plugin/API/UI integration. Sort HTML pages by URL immediately before the existing Pagefind processor so native IDs do not inherit filesystem ordering (#1395). Never rewrite native output or weaken comparisons.

Retain failed baseline. First qualify the corrected build at an immutable implementation head using the strict checker, then remove the bounded CI argument and document strict-only acceptance. Re-prove the final exact head. Maintain browser UX/accessibility through the complete Utility browser matrix, and freeze/check only the site dependency lock.

## Commit slices

1. Bootstrap research/design and retained strict failure (this run only); independent PLAN review.
2. One cohesive subsystem implementation: `docs/site/deno.json`, site lock, narrow `_config.ts` stable input ordering, reproducibility contributor instructions, and this run's evidence/context. Gate: frozen native build, full strict two-build check, docs tooling/source wrappers and fixtures, full Utility browser suite; independent read-only IMPL/slice review before sign-off.
3. After exact-head strict proof: remove bounded mode invocation in `.github/workflows/pages.yml`; remove obsolete tool mode if appropriate; include strict checker regression coverage only for meaningful fail-closed behavior. Gate: final exact-head strict comparison and relevant CI classifier/workflow tests, separate-family review.

## Gates

Native Deno 2.9.7. Workflow's structured docs-tooling/browser check/lint/fmt wrappers and docs/source fixture tests; links/caveats and generated freshness. Full Utility Playwright suite through durable `fresh-ui-browser` receipt. Strict all-output two-build proof without allowances. Applicable workflow/classifier tests if workflow changes. CLI scaffold runtime gate per repository readiness instruction: execute once in readiness pass and accurately record runtime failures or policy skips. Root quality/architecture scan applies only if packages/plugins touched (not planned).

## Risks and mitigations

- New upstream version alters search ranking/UI contract: full real-index browser tests and fallback/empty/error/stale/lazy/hash/filter coverage.
- Native randomized ordering persists: strict all-byte comparator is the hard gate; keep CI allowance until exact implementation-head proof.
- Version is newly released: explicit pin + integrity lock, local native qualification and frozen install; do not relax global dependency policy.
- Unrelated main changes: normal merges only, re-evaluate exact final head after reconciliation; never force-push.

## Open decisions and debt

No unresolved design choices. Release qualification is a gate, not an assumed result. If it fails, revisit diagnosis with the same evaluator. No accepted architecture debt.

## Deferred

No S8 UI/layout/token edits; no #2450 consolidation, #2574/#2573 duplication, registry work, binary transforms or upstream source fork. Upstream #1395 native fix remains upstream; stable API ingestion order is sufficient for this site.
