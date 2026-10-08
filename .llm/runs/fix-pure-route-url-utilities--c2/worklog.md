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

Gate `route-final-jsr`: raw exit `0`. Command: `deno run -A .llm/tools/fitness/audit-jsr-package.ts --root packages/fresh --text`. Full raw output retained privately.

Gate `route-final-doc`: raw exit `1`. Command: `deno task doc:lint --root packages/fresh`. Full raw output retained privately.

Gate `route-final-publish`: raw exit `0`. Command: `deno run -A .llm/tools/release/run-publish-dry-run.ts --member packages/fresh`. Full raw output retained privately.

Gate `route-committed-corpus`: raw exit `0`. Command: `deno task check:mcp-export-corpus`. Full raw output retained privately.

S4 exact committed-source corpus check passes at d34ccaceec21198afa791ed5efbd7f5da15f2004; unchanged public inventory requires no generated edits. Final owning JSR audit and raw publication dry-run pass; final all-export doc raw exit one, complete structured stdout byte-identical to baseline, including every entrypoint diagnostic/exit and combined totals. Source qualification complete; independent evaluator must adjudicate route-doc-baseline-2040 and public PageHooks access correction. Phase 7 active; no merge/release.

S5 independent Zhipu GLM max IMPL-EVAL PASS at exact evaluated head dd452c4b1330044cfe12ebabef1a8bb345cb71d7 (source d34ccaceec21198afa791ed5efbd7f5da15f2004), separate vendor/session. Evaluator exited zero before closeout. It independently reran focused 18 tests, full Fresh 284 tests and actual production browser test, static check/lint/fmt, quality/architecture, JSR/raw dry publication and corpus/carrier checks. It reproduced every baseline doc diagnostic/exit and adjudicated route-doc-baseline-2040 DEBT_ACCEPTED; raw doc exit remains one. Public PageHooks correction accepted within approved existing capability; no required findings. Phases 5/6/7 complete; phase 8 release N/A (unmerged delivery), phase 9 source close complete. No source changes in this report/debt/context commit. Owner must qualify final CI, coordinated publication and published consumer before closing #2040/removing EIS router facade.

## S6 generated documentation CI amendment

CI quality at b1adc4d94ea0a950212b10818f5c1a318bab0c53 reports check:agent-docs-prose stale prose.json.gz/provenance.json after the approved route migration docs changed. Regenerate owning agent prose using canonical gen:agent-docs-prose from clean committed source; check canonical freshness, owning generator tests, embedded carrier and export corpus. No handwritten generated edits, route code or public contract changes, new tests or releases. Original production/browser/full-source independent PASS and accepted doc baseline remain unchanged. PLAN-EVAL amendment N/A: mechanical generated-document freshness under already approved documentation migration. S6 commit generated assets plus gates, then mandatory separate bounded amendment IMPL-EVAL (retain original evaluate.md). Quality gate failure is real until corrected; no false green. Same PR #2090, no merge/publication.

Gate `route-ci-prose-generate`: raw exit `0`. Command: `deno task gen:agent-docs-prose`. Full raw output retained privately.

Gate `route-ci-carrier`: raw exit `1`. Command: `deno task check:assets-barrel`. Full raw output retained privately.

Gate `route-ci-prose-tests`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/docs/build-agent-docs-bundle_test.ts`. Full raw output retained privately.

Gate `route-ci-corpus`: raw exit `0`. Command: `deno task check:mcp-export-corpus`. Full raw output retained privately.

Gate `route-ci-prose-fresh`: raw exit `0`. Command: `deno task check:agent-docs-prose`. Full raw output retained privately.

Gate `route-ci-embedded-prose-tests`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/mcp/tests/release-embedded-docs-corpus_test.ts`. Full raw output retained privately.

Gate `route-ci-quality`: raw exit `0`. Command: `deno task quality:gate`. Full raw output retained privately.

Gate `route-ci-cli-doc`: raw exit `0`. Command: `deno task doc:lint --root packages/cli`. Full raw output retained privately.

Gate `route-ci-cli-jsr`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/cli --text`. Full raw output retained privately.

S6 substantive generated-data review: canonical gen:agent-docs-prose at clean committed 74c0a17b4 changes only route page prose and its llms-full aggregate; all other extracted pages byte-unchanged, no added/removed files. Bundle hash 03fcbe65897f5f8613886efe276088daedc46932908f440d429d9bc13c591071. Canonical generator also updates existing CLI embedded agent-docs carrier/provenance (same exports/shape). No handwritten generated data, runtime source, lock or dependency change. Canonical prose freshness and generator four tests + embedded consumer four tests pass; full quality/architecture and export corpus freshness pass. Initial check:assets-barrel generates the required carrier then reports raw exit one on its uncommitted expected delta; commit that canonical output, then require committed carrier/freshness pass. Additional owning CLI doc/JSR/publication dry-run gates selected for changed carrier. No command/scaffold/packaging output or public API change; release-class runtime gates remain N/A. Original route browser/source PASS and documentation debt unchanged; independent bounded generated amendment review required.

Gate `route-ci-cli-publish`: raw exit `0`. Command: `deno task --cwd packages/cli publish:dry-run`. Full raw output retained privately.

Gate `route-ci-committed-carrier`: raw exit `0`. Command: `deno task check:assets-barrel`. Full raw output retained privately.

Gate `route-ci-committed-prose`: raw exit `0`. Command: `deno task check:agent-docs-prose`. Full raw output retained privately.

S6 independent generated-document amendment IMPL-EVAL PASS at d412159803cb71321047d2ef393934c51db213ef, generated source 1cb73eb36420220dc1ab62de43f0de7ca9581b86. Evaluator independently verifies all 182 extracted page keys, only route and llms-full delta, byte-equal committed carrier, bundle/provenance hash, canonical freshness, generator four/embedded four tests, committed carrier/export freshness and CLI doc/JSR gates; raw publication/quality receipts corroborated. Original route full runtime/source PASS and accepted documentation baseline retained unchanged. No findings. Evaluator exited zero before closeout. Phase 7 amendment complete, phase 9 source delivery complete; no runtime source change in this report/context commit. Final exact-head CI and publication/published consumer remain qualification gates, no merge/release/Fixes claim.

S7 docs review amendment Design checkpoint: PLAN-EVAL N/A, one remaining migration sentence now names the already approved public page.hooks.useRoute().getLinkProps capability instead of inaccessible internal usePageRoute. No runtime/public signature/dependency/test delta. Original source/browser and prior carrier independent PASS retained. One-sentence substantive review completed; canonical clean-source prose/CLI carrier S8 then mandatory independent bounded doc-review-evaluate.md S9.

Gate `doc-review-generate`: raw exit `0`. Command: `deno task gen:agent-docs-prose`. Full raw output retained privately.

Gate `doc-review-carrier-uncommitted`: raw exit `1`. Command: `deno task check:assets-barrel`. Full raw output retained privately.

Gate `doc-review-tests`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/docs/build-agent-docs-bundle_test.ts packages/mcp/tests/release-embedded-docs-corpus_test.ts`. Full raw output retained privately.

Gate `doc-review-prose`: raw exit `0`. Command: `deno task check:agent-docs-prose`. Full raw output retained privately.

Gate `doc-review-corpus`: raw exit `0`. Command: `deno task check:mcp-export-corpus`. Full raw output retained privately.

Gate `doc-review-quality`: raw exit `0`. Command: `deno task quality:gate`. Full raw output retained privately.

Gate `doc-review-cli-doc`: raw exit `0`. Command: `deno task doc:lint --root packages/cli`. Full raw output retained privately.

Gate `doc-review-cli-jsr`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/cli --text`. Full raw output retained privately.

Gate `doc-review-cli-publish`: raw exit `0`. Command: `deno task --cwd packages/cli publish:dry-run`. Full raw output retained privately.

S8 canonical source qualification: gen:agent-docs-prose from clean committed S7 and existing CLI carrier generation change exactly route page plus llms-full aggregate; all182 keys retained, every other page byte-identical. Canonical freshness,8existing generator/embedded tests, export freshness, quality/architecture and owning CLI doc/JSR/raw dry publication pass. Initial carrier rawexit1 reflects expected uncommitted canonical delta and is retained; require committed carrier next. No new tests or runtime/export/dependency/source behavior change. Mandatory independent bounded amendment IMPL next.

Gate `doc-review-carrier-committed`: raw exit `0`. Command: `deno task check:assets-barrel`. Full raw output retained privately.

S8 committed carrier check exitszero at ded106152; exactly182 keys and2 changed content entries (pages/web-layer/route/index.md, llms-full.txt). Private comparison initially used source-page aliases instead of canonical extracted filenames; corrected comparison confirms intended exact delta, no additional regeneration/source change. All bounded gates complete. S9 independent Google Gemini fresh exact-head doc-review-evaluate.md review next, source/branch frozen until processexit. Original source/browser/carrier reports preserved.

S9 independent Google Gemini bounded docs amendment IMPL-EVAL PASS at exact c28716e602f1a1fd97eb5e634711bcd9c97937dc, canonical source ded106152. Reviewer independently verifies182keys/exact2changedpages/all180othersbyteidentical, decodedcarrierbyteequalscommittedgzip andshaad548ee3eb1025fa825666c3e2ef1895f2b335fdcd719e869d7d90fdc208b013. Re-runs8existing generator/consumer tests, allcanonicalfreshness/carrier/export, quality/architecture and owning CLI doc/JSR/rawpub exitzero. No findings/newtests/runtime/dependency/export changes; original runtime/browser/fullsource and prior carrier reports retained, route-doc-baseline-2040 debt unchanged. Reviewerprocess exitedzero beforeclose. Sourcephasescomplete, sourceclose9complete,8releaseN/A; finalCI/publication/publishedconsumer/EIShreffacadeownerwork, Refs2040.

## Review repair — Bootstrap / Research / Plan & Design / Plan-Gate
Baseline 136e14ea4586c90d5f4a281ff57edac675e98b8e; read owner HARNESS and independent review. Scope: Fix F1 by shortening repeated migration prose and regenerating all carriers within existing MCP budget; fix F2 public preserve flags JSDoc; no runtime behavior change.. Existing contracts locked; PLAN-EVAL N/A for bounded mechanical reconciliation unless new decision-heavy issues emerge.

## Design — review repair
Public surface and domain vocabulary remain those of the reviewed feature. Existing ports/constants retained. No new abstraction. Preserve both branch and main behavior, tests and debt records. Main generated assets precede canonical regeneration commits. Contributor path: focused existing test and its owning source. Commit slices follow repair plan. Owner acceptance of published consumer remains deferred.

## Implement — F1/F2 documentation repair
Shortened duplicate migration prose, retained explicit top-level useSearch example, pure helper/default semantics, contextual Link/useRoute closure capabilities and paired search guidance. Existing MCP budget/path selection unchanged. Updated both public preserveSearchParams JSDoc mirrors and paired partial flag comments. No implementation, public signature, test or dependency changes. Supervisor source-alignment review compares existing getBoundLinkProps, Link and useRoute hook; contract unchanged. Canonical carrier regeneration follows committed documentation source.

Canonical gen:agent-docs-prose exit 0. Generated carrier reviewed; no hand edits.

Canonical gen:assets-barrel exit 0. Generated carrier reviewed; no hand edits.
