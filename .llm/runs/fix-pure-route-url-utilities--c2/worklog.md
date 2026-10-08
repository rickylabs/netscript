# Worklog

## Design

Public surface and domain: D1 Pure URL helpers: getBoundLinkProps is an ordinary function passing null context to the existing validated URL builder. This repairs route.href, paired href/partialHref/getLinkProps together without duplicating route construction. No hook invocation or try/catch in utilities. Link calls a directly named useNavigationContext hook during component render; required hooks remain explicit. D2 Explicit search: existing useCurrentSearch(target) supplies current parsed values to pure href/getLinkProps; existing usePageRoute().getLinkProps captures its hook context once and supports preserveSearchParams. Pure helpers use schema defaults regardless of the context flag; retain input types and document migration. D3 Regression: adjacent pure-hook instrumentation and SSR paired/schema/encoding tests plus real production Fresh fixture: memoized send/read href before state/callback and native TanStack useChat, conditional/variable links, rerender/unmount, state identity, current search, A-to-B repeated back/forward navigation and live resume, no browser errors. Every new test has a causal source mutation and restored pass. D4 Gates: Fresh full unit suite, frozen scoped check/type fixtures/lint/fmt, quality/architecture, JSR/public dry-run, baseline per-entrypoint doc comparison if required, native production SSR/browser and generated carrier/corpus freshness. No release/scaffold/CLI changes, release gates N/A. Owner publication and qualified published consumer remain necessary; Refs #2040 until all acceptance including publication exists. EIS router href-to-nav.makeHref facade becomes removable after qualification. Workload feature capped by absent privileged-row authority; decision-heavy implicit-search semantics require selected independent PLAN-EVAL before implementation.

Ports: preserve existing owning package contracts. Constants: existing finite vocabulary; additional values only when needed by the issue. Contributor path: extend existing implementation and adjacent regressions.

Commit slices: bootstrap plan, source/test/mutation evidence, independent evaluation evidence. No speculative files.

PLAN-EVAL: Selected: implicit-search migration, paired helpers and production hook/navigation acceptance require independent PLAN-EVAL before source changes; workload capped at feature.

## Nine phases

1. Bootstrap: clean clone, fetch, fresh branch from current main.
2. Research: issue, MCP, selected skills/doctrine and existing implementation examined.
3. Plan & Design: locked design recorded above.
4. Plan-Gate: Selected: implicit-search migration, paired helpers and production hook/navigation acceptance require independent PLAN-EVAL before source changes; workload capped at feature.
5. Implement: pending.
6. Gate: pending; raw exit codes to be recorded.
7. Evaluate: pending; independent different-vendor session mandatory.
8. Release: N/A, owner explicitly requires unmerged PRs.
9. Close: pending source delivery and handoff; publication remains owner work.

Design refinement: public surface unchanged (route href/getLinkProps/paired helpers, existing hooks and Link). Vocabulary: typed route/path/search plus existing nullable navigation context. Ports: no new port, existing Preact/Fresh/route adapters. Constants: fixture channels A/B and native chat event IDs scoped to test protocol; production finite vocabularies unchanged. Ordered S1-S5 and budgets in plan. Contributor path: URL construction in link.tsx, context hooks in context.ts, reference delegation in contract-runtime.ts; add cases to adjacent test or production fixture. Opening docs-only PR has ci:skip-e2e/ci:skip-scaffold intentionally; remove both for source/browser wave.

Independent PLAN-EVAL PASS at exact docs-only 82e7f5ca61f6a7a600db20436f6a125dddf02096; all eight Plan-Gate boxes checked. Evaluator exited before implementation. Phase 4 complete, S2 next. Baseline doc lint collected privately, raw exit 1 (first launch used task root and refused; corrected owning checkout launch exit 1 retains real baseline diagnostics). No source implementation yet.

Gate `route-focused`: raw exit `0`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/src/application/builders/define-page/tests/navigation.test.tsx packages/fresh/src/application/route/contract.test.ts`. Full raw output retained privately.

Gate `route-hidden-hook-mutation-unit`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/src/application/builders/define-page/tests/navigation.test.tsx`. Full raw output retained privately.

Gate `route-hidden-hook-restored-unit`: raw exit `0`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/src/application/builders/define-page/tests/navigation.test.tsx`. Full raw output retained privately.

Gate `route-scoped-check`: raw exit `0`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/src/application/builders/define-page/navigation --file packages/fresh/src/application/builders/define-page/tests/navigation.test.tsx --ext ts,tsx --deno-arg --frozen`. Full raw output retained privately.

Gate `route-fmt-write`: raw exit `0`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file packages/fresh/src/application/builders/define-page/navigation/context.ts --file packages/fresh/src/application/builders/define-page/navigation/link.tsx --file packages/fresh/src/application/builders/define-page/tests/navigation.test.tsx --ext ts,tsx --write`. Full raw output retained privately.

Gate `route-fmt`: raw exit `0`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file packages/fresh/src/application/builders/define-page/navigation/context.ts --file packages/fresh/src/application/builders/define-page/navigation/link.tsx --file packages/fresh/src/application/builders/define-page/tests/navigation.test.tsx --ext ts,tsx`. Full raw output retained privately.

Gate `route-lint`: raw exit `0`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --file packages/fresh/src/application/builders/define-page/navigation/context.ts --file packages/fresh/src/application/builders/define-page/navigation/link.tsx --file packages/fresh/src/application/builders/define-page/tests/navigation.test.tsx --ext ts,tsx`. Full raw output retained privately.

Gate `route-final-check`: raw exit `0`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/src/application/builders/define-page/navigation --file packages/fresh/src/application/builders/define-page/tests/navigation.test.tsx --ext ts,tsx --deno-arg --frozen`. Full raw output retained privately.

Gate `route-s2-quality`: raw exit `0`. Command: `deno task quality:gate`. Full raw output retained privately.

Gate `route-s2-doc`: raw exit `1`. Command: `deno task doc:lint --root packages/fresh`. Full raw output retained privately.

Gate `route-s2-jsr`: raw exit `1`. Command: `deno run -A .llm/tools/fitness/audit-jsr-package.ts packages/fresh`. Full raw output retained privately.

Gate `route-s2-publish`: raw exit `0`. Command: `deno run -A .llm/tools/release/run-publish-dry-run.ts --member packages/fresh`. Full raw output retained privately.

Gate `route-s2-jsr-corrected`: raw exit `0`. Command: `deno run -A .llm/tools/fitness/audit-jsr-package.ts --root packages/fresh --text`. Full raw output retained privately.

S2 substantive slice review: shared getBoundLinkProps has no context read, all reference delegates remain unchanged and pure; Link now calls directly named useNavigationContext at its render boundary, removes former cast and try/catch hook detection. Existing explicit hooks retain captured context. Adjacent regression observes actual Preact hooks, checks single and paired helper purity, explicit/current context semantics, path encoding, memo followed by state/callback and SSR Link. Source mutation adding useNavigationContext back to the utility fails only the intended new regression, restored seven navigation tests pass; focused contract/navigation 18 pass. Frozen final check, lint/fmt, quality/architecture and owning JSR audit pass. First JSR invocation lacked --root and evaluated the root instead; retained non-verdict failure, corrected owning audit exits zero. First scoped check overlapped mutation (not a clean-source verdict); corrected route-final-check after restoration/fmt exits zero. Actual Fresh publish dry-run exit zero. All-export doc raw exit one, complete per-entrypoint structured reports byte-identical to main baseline; proposed route-doc-baseline-2040 for independent adjudication. Migration docs explain explicit search and pure preserve flags, including paired partial flag. No new public exported type or port, no dependency/lock change. S2 reconciled: Refs #2040, no closure without publication; public lifecycle is impl, CI skip labels removed. S3 production browser/native chat acceptance next.

D2 access clarification from public-export scan: useCurrentSearch/usePageRoute are existing internal hook names, not standalone exports of the owning builders subpath. The supported public capability is builtPage.hooks.useSearch()/useRoute(); those delegate to the same explicit hooks and captured link callback. Docs and consumer regression must use that public access path. No new export/public type/port is required, and behavior locked in D2 is unchanged. This is a source-discovered access-path correction within the approved explicit-existing-hook decision, not a new public-contract expansion. Independent final evaluation must assess the correction.

Gate `route-browser-check`: raw exit `1`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/tests/fixtures/route-purity-browser --file packages/fresh/src/application/builders/define-page/tests/navigation.test.tsx --ext ts,tsx --deno-arg --frozen`. Full raw output retained privately.

Gate `route-browser-check-corrected`: raw exit `1`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/tests/fixtures/route-purity-browser --file packages/fresh/src/application/builders/define-page/tests/navigation.test.tsx --ext ts,tsx --deno-arg --frozen`. Full raw output retained privately.

Gate `route-browser-check-final`: raw exit `0`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/tests/fixtures/route-purity-browser --file packages/fresh/tests/route-purity_browser.ts --file packages/fresh/src/application/builders/define-page/tests/navigation.test.tsx --ext ts,tsx --deno-arg --frozen`. Full raw output retained privately.

Gate `route-production-browser`: raw exit `0`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/tests/route-purity_browser.ts`. Full raw output retained privately.

Gate `route-fresh-tests`: raw exit `0`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --unstable-kv packages/fresh/src packages/fresh/tests`. Full raw output retained privately.

Gate `route-hidden-hook-mutation-browser`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/tests/route-purity_browser.ts`. Full raw output retained privately.

Gate `route-hidden-hook-restored-browser`: raw exit `0`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/tests/route-purity_browser.ts`. Full raw output retained privately.

Gate `route-s3-fmt-write`: raw exit `0`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh/tests/fixtures/route-purity-browser --file packages/fresh/tests/route-purity_browser.ts --file packages/fresh/src/application/builders/define-page/tests/navigation.test.tsx --ext ts,tsx --write`. Full raw output retained privately.

Gate `route-s3-fmt`: raw exit `0`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh/tests/fixtures/route-purity-browser --file packages/fresh/tests/route-purity_browser.ts --file packages/fresh/src/application/builders/define-page/tests/navigation.test.tsx --ext ts,tsx`. Full raw output retained privately.

Gate `route-s3-lint`: raw exit `0`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh/tests/fixtures/route-purity-browser --file packages/fresh/tests/route-purity_browser.ts --file packages/fresh/src/application/builders/define-page/tests/navigation.test.tsx --ext ts,tsx`. Full raw output retained privately.

Gate `route-s3-check`: raw exit `0`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/src/application/builders/define-page/navigation --root packages/fresh/tests/fixtures/route-purity-browser --file packages/fresh/tests/route-purity_browser.ts --file packages/fresh/src/application/builders/define-page/tests/navigation.test.tsx --file packages/fresh/tests/type-fixtures/navigation-consumer_type.ts --ext ts,tsx --deno-arg --frozen`. Full raw output retained privately.

Gate `route-s3-quality`: raw exit `0`. Command: `deno task quality:gate`. Full raw output retained privately.

Gate `route-carrier`: raw exit `0`. Command: `deno task check:assets-barrel`. Full raw output retained privately.

Gate `route-corpus-fresh`: raw exit `0`. Command: `deno task check:mcp-export-corpus`. Full raw output retained privately.

S3 substantive slice review complete: actual locked Vite production build and Fresh static/SSR server render the native TanStack useChat island; memo send/read route URLs precede state/callback, variable paired links and conditional partial URL calls precede later hooks. Browser hook observer records stable native hook counts through repeated rerenders; state marker/callbacks remain correct. Actual native SSE response ends after a tagged content event and the native transport resumes with Last-Event-ID, producing complete live messages for A and B. Real Fresh partial navigation A-to-B and three back/forward cycles remove prior transcripts in the same document, then native chat delivery and unmount work without browser errors; both responsive widths have no overflow. Browser source mutation restores old guarded hidden context hook, triggers native x-is-not-a-function during hydration and parses exactly one test failure, then restores the actual source and passes. Adjacent mutation independently fails/restores. Source gates: full Fresh 284 pass, scoped frozen check incl consumer fixture, lint/fmt and quality/architecture all pass. Native fixture import/type mismatches were corrected to owning explicit return types and actual upstream TextPart.content, never silenced/cast. Public search access correction (PageHooks) recorded in plan/research/drift; docs and adjacent consumer use supported page.hooks.useSearch/useRoute, no new export. Fixture output removed in finally; no scanner suppression or generated bundle left. Nine owning S3 files, within approved budget. Carrier and corpus freshness pass (unchanged inventory checksum 2e7db5f4db8ff58f8c9fe5ab58bb96e91982ab5f76e00e419fd1e3ebb8f44265); S4 no regeneration needed, exact committed-source check next. Phase 5/6 complete with explicit proposed documentation baseline debt; phase 7 independent IMPL-EVAL next. Phase 8 N/A; publication remains owner work. S3 reconciliation: Refs #2040, CI source labels enabled, no issue closure or release claim.
