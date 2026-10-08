# IMPL-EVAL — fix-pure-route-url-utilities--c2

## Metadata

| Field             | Value |
| ----------------- | ----- |
| Run ID            | `fix-pure-route-url-utilities--c2` |
| Target            | Issue #2040 / draft PR #2090 — pure route URL utilities (`@netscript/fresh`) |
| Archetype         | 2 (integration) with the existing Archetype 4 route-builder concern |
| Scope overlays    | SCOPE-frontend |
| Evaluator         | Independent Zhipu GLM session (`opencode-go/glm-5.3-flash`, max), 2026-10-08, cycle 1 |
| Evaluated HEAD    | `dd452c4b1330044cfe12ebabef1a8bb345cb71d7` (branch `fix/pure-route-url-utilities`, pushed to origin) |
| Evaluated source  | `d34ccaceec21198afa791ed5efbd7f5da15f2004` — verified: `git diff d34ccacee..HEAD` touches only `.llm/runs/**` run artifacts, zero source delta |
| Baseline          | `4ef93c2532e4aeabdbd26874cd36cd7d37e593fd` (origin/main at run start) |
| Branch delta vs baseline | 21 files / +811 −30: navigation context.ts +20−14 (c5284ec6c), link.tsx +17−7 (c5284ec6c), adjacent test +105, browser fixture (9 owning files, d34ccacee), docs route.md/README/deno.json, run artifacts, debt row |
| Route             | Generator OpenAI lane C2 ≠ evaluator Zhipu GLM (different session and vendor family). Owner override `opencode-go/glm-5.3-flash` max; observed same route, healthy, no fallback. |
| PLAN-EVAL         | Independent `PASS` at `82e7f5ca61f6a7a600db20436f6a125dddf02096` (docs-only head), recorded in `plan-eval.md`; evaluator exited before implementation. Both .stdout and .stderr receipts corroborate the verdict text. |

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` verdict `PASS` at docs-only head `82e7f5ca6` (all eight Plan-Gate items PASS; evaluator receipt at sibling `plan-eval.stdout`/`stderr` shows the same verdict). First source commit `c5284ec6c` (04:19) follows the PLAN-EVAL receipt (04:14) — ordering holds. |
| Design section exists in worklog       | PASS   | `worklog.md` `## Design` (D1–D4), ports/constants/contributor path, PLAN-EVAL selection recorded before implementation slices. |
| Commit slices match design plan        | PASS   | S1 docs+plan/PLAN-EVAL (`edf27df81`–`369a8c72c`) → S2 source kernel (`c5284ec6c`: context.ts, link.tsx, adjacent test, route.md, README, ≤8 owning files incl. run dir) → S3 fixture+browser+docs correction (`d34ccacee`: 9 owning fixture/test files, deno.json task, docs tweak) → S4 no-op (committed-source corpus check passed, no regeneration) → S5 run-artifact close-out (`dd452c4b1`) + this evaluation. Matches the plan's S1–S5. |
| Each slice has a passing gate          | PASS   | 18 per-gate `.stdout` receipts in the sibling private evidence dir match the worklog's commands/exit codes; evaluator reran the core subset independently (detail below). |
| No speculative seams (unused files)    | PASS   | All S2/S3 code/doc files and the browser fixture are used by the named gates/docs; contract-runtime.ts intentionally untouched (single shared repair point in `getBoundLinkProps`); no dead code introduced. |
| Constants used for finite vocabularies | PASS   | Fixture vocabularies (`'A' | 'B'`, event chunk types) are test-protocol finite sets already owned by the native upstream contract; production vocabularies untouched. |

## Static Gates

| Gate             | Command or check | Result | Evidence |
| ---------------- | ---------------- | ------ | -------- |
| Narrow typecheck | `run-deno-check.ts` (navigation roots + tests + `navigation-consumer_type.ts` fixture, `--frozen`) | PASS | Evaluator reran: `RAW-EXIT=0`, 0 occurrences, 11 files. |
| Slice typecheck  | frozen run of the S3 batch (`route-s3-check` receipt) | PASS | Receipt `route-s3-check.stdout`: exit 0. |
| Format           | `run-deno-fmt.ts` (check mode) over the touched files | PASS | Evaluator reran: `RAW-EXIT=0`, 0 findings. |
| Lint             | `run-deno-lint.ts` over the touched files | PASS | Evaluator reran: `RAW-EXIT=0`, 0 occurrences. |
| Doc lint         | `deno task doc:lint --root packages/fresh` (raw, all-export) | PASS (baseline equality, raw exit 1 on both) | Evaluator independently reproduced both sides: current checkout raw exit 1 with 4100-byte structured stdout byte-identical to the generator's final receipt (`cmp` empty); baseline repro from a detached baseline-sha worktree after path normalization also raw exit 1 and byte-identical to current (per-entrypoint counts, per-file rows, `combinedTotal 45` = 28 private-type-ref + 17 missing-JSDoc, and all 17 `entrypointExitCodes` equal; the four failing entrypoints — `builders` (1, pre-existing `builders/mod.ts` row), `query` (8, pre-existing `query-types.ts`/`hooks.ts` rows), `route` (25, pre-existing `contract-types.ts` row) and `streams` (11, pre-existing streams rows) — map exactly to the baseline diagnostics). JSON-level comparison independently confirmed: per-entrypoint maps identical, `entrypointExitCodes` identical, both exits 1. See debt adjudication below. |
| Publish dry-run  | `run-publish-dry-run.ts --member packages/fresh` | PASS | Evaluator reran: `RAW-EXIT=0` with `Success Dry run complete`; generator receipts (`route-s2-publish`, `route-final-publish`) show the same trailing success line. |
| Link/path check  | carrier corpus check + docs links inside its scan | PASS | `check:mcp-export-corpus` exit 0; `carrier-corpus` failure list contains no route.md entry. |

## Fitness Gates

| Gate  | Function                          | Result       | Evidence |
| ----- | --------------------------------- | ------------ | -------- |
| F-1   | File-size lint                    | PASS         | quality:gate rerun exit 0; touched files ≤ 441 lines. |
| F-2   | Helper-reinvention scan           | PASS         | quality:gate rerun exit 0; the repair reuses existing `createResolvedLinkProps`/`buildHref` — no new URL builder or hook-detection shim duplicated. |
| F-3   | Layering check                    | PASS         | arch:check exit 0 (via quality:gate); `link.tsx` → `context.ts` dependency direction is the pre-existing owner direction. |
| F-4   | Inheritance audit                 | PASS         | quality:gate exit 0; no class hierarchies touched. |
| F-5   | Public surface audit              | PASS         | No new export, type, or port: `useNavigationContext` is internal to `context.ts` (not re-exported from `navigation/mod.ts`/`define-page/mod.ts`); `readNavigationContext` fully removed; `Link`, `getLinkProps`, `getBoundLinkProps` exports unchanged; `navigation/mod.ts` and package exports untouched in the diff. |
| F-6   | JSR publishability gate           | PASS         | Evaluator reran the owning audit (`--root packages/fresh --text`): exit 0, output byte-identical to the generator's final receipt — surface `./route=7` unchanged, `dry-run: OK slowTypeWarnings=1`, the two WARNs (F-DOCT-5 cardinality of `src/runtime/ai`, F-JSR-7 slowTypes probe) are pre-existing and unchanged. |
| F-7   | Doc-score gate                    | DEBT_ACCEPTED| Pre-existing residue unchanged (28 + 17) on identical per-entrypoint exits; adjudicated below as `route-doc-baseline-2040`. |
| F-8   | Workspace `lib` override check    | N/A          | No tsconfig/lib change in the delta. |
| F-9   | Permission declaration check      | PASS         | `deno.json` change is the `test:browser` task list extension only; serves `--allow-all` via the task, consistent with sibling browser tests. |
| F-10  | Test-shape audit                  | PASS         | Typed `Deno.test` with named descriptions, `try/finally` restoration of the hook observer, and structural asserts; no skipped/ignored tests; real Playwright browser session. |
| F-11  | Forbidden-folder lint             | PASS         | New fixture/test files live exclusively under `packages/fresh/tests/`; no forbidden path touched. |
| F-12  | Naming-convention lint            | PASS         | `route-purity_browser.ts` matches the existing `*_browser.ts` convention; `route-purity-browser` fixture dir matches sibling naming. |
| F-13  | Saga and runtime invariants       | N/A          | No saga/DB/runtime-streams change in this slice. |
| F-14  | Console-log lint                  | PASS         | Probe grep of touched files finds no `console.log` in published source. |
| F-15  | Re-export-of-upstream lint        | PASS         | Fixture imports native `@tanstack/ai-preact` directly and calls it; no wrapper/re-export added. |
| F-16  | Folder-cardinality lint           | PASS         | `route-purity-browser/` is a new leaf fixture directory with 4 children; no doctrine folder cap approached. |
| F-17  | Abstract-derived co-location lint | N/A          | No abstract classes touched. |
| F-18  | Sub-barrel lint                   | N/A          | No barrel changed (`navigation/mod.ts` untouched by the delta; only `deno.json` task list added). |
| F-19  | Scoped source gate runners        | PASS         | All gate evidence comes from `.llm/tools/run-deno-{check,test,lint,fmt}.ts`, `deno task` wrappers, the audit script, and the publish runner — no raw-root grep-based verification substituted. |

## Debt Adjudication

| Item                                          | Result       | Assessment |
| --------------------------------------------- | ------------ | ---------- |
| `route-doc-baseline-2040` (all-export doc lint residue, Fresh) | DEBT_ACCEPTED | Debt handling is valid. (1) Registry shape conforms: owner, target (2026-10-15), reason, linked plan + issue, created date, status, gate, and evidence are all present. (2) Substance verified independently: I re-ran the doc lint at current HEAD (raw exit 1, byte-identical structured stdout to the generator's final receipt) and reproduced the baseline at a detached baseline worktree (raw exit 1, byte-identical structured report including every file row and entrypoint exit) — failure is pre-existing on main, identical in shape, not introduced or deepened by this slice. The four failing entrypoints (`builders` 1, `query` 8, `route` 25 → the untouched `contract-types.ts`, `streams` 11) map exactly to pre-existing file diagnostics unchanged from baseline. (3) No false green: the failing raw state is explicitly retained, not suppressed; the passing owning JSR audit and publish dry-run are recorded as the honest release-relevant gates. (4) Gate ("reaches zero with existing public types preserved") is falsifiable and bounded; publication/qualified-consumer remain owner gates per D4. |

No other debt delta (one entry added, zero resolved, zero deepened, zero unrecorded).

## Runtime / Consumer Gates

| Gate                        | Result | Evidence |
| --------------------------- | ------ | -------- |
| Adjacent regression (hook observation + SSR) | PASS | (1) Receipts: focused pair 18/0 exit 0; unit mutation 7 total / 1 fail exit 1 with the exact assert `URL utilities and captured hook callbacks must consume no hooks`; restored 7/0 exit 0. (2) Evaluator independently reran the focused pair via the structured runner: exit 0, 18 pass. (3) Test source verified: it swaps the Preact `options.__h` hook observer through `try/finally`, asserts real hook activity across the explicit `useCurrentSearch`/`usePageRoute` block, asserts zero hook delta across six pure single/paired calls, asserts paired parity (`pairedProps.href === pageHref`, `pairedProps['f-partial'] === partialHref`), pure preserve-flag = schema defaults + explicit search, explicit-search = current values, captured-hook link props = explicit-search href, then `useMemo` before `useState`/`useCallback` (hook-order independence), and path encoding `a/b ü` → `a%2Fb%20%C3%BC` plus SSR Link `page=5&amp;limit=2` contextual preservation. Mutation/restore receipts are self-consistent (mutation exit 1 / restore exit 0 over the identical command). |
| Production browser (real Fresh + native useChat) | PASS | (1) Receipts: `route-production-browser` 1/0 exit 0 (13.9 s), mutation 1 fail exit 1 (41.6 s) whose parsed failure shows `errors: ["x is not a function"]` from hydration plus the locator timeout, restored pass exit 0 (11.9 s); warm-build check receipts present. (2) Evaluator independently reran the raw structured-runner command against HEAD: exit 0, 1 pass (12.1 s). (3) Test source verified against the acceptance list: locked Vite production build + Fresh static/SSR server (returns 200 with `transcript-A`), wait for `#chat[data-hydrated="true"]`, native hook observer count ≥ 10 at first hydration, 3 rerender rounds preserve hook count, `data-state` and incrementing `data-count`, "Resume chat" drives a real native `sendMessage` POST whose server request is recorded with `Last-Event-ID` (stats `resumed: [true, true]`) and the `live-*-resumed` transcript appears, `#to-b` click then hydrated('B') with A-transcript absence asserted, three back/forward cycles re-hydrating A/B **in the same document** (`performance.timeOrigin` equality), resume again for B, unmount button leaves `remainingChats: 0`, two viewports (390/1280) with no horizontal overflow, `chatError` empty and zero console/page errors, output asserted with strict `assertEquals`. |
| Full Fresh suite               | PASS  | Evaluator independently reran via the structured runner: exit 0, `passed 284, failed 0, ignored 0` — matches the generator receipt exactly. |

## Source and Claim Verification (issue #2040 acceptance)

| Acceptance item (#2040) | Result | Evidence |
| ----------------------- | ------ | -------- |
| `href` does not call a hidden hook | SATISFIED | Source: `getBoundLinkProps` passes `null` to `createResolvedLinkProps` (link.tsx:300-313); `readNavigationContext` is fully deleted (source-wide grep: zero hits). The shared repair point is the bound builder itself, so single `href`/`getLinkProps` and paired `href`/`partialHref`/`getLinkProps` all inherit purity through the unchanged contract-runtime funnel (contract-runtime.ts:254,276,324,335,342). `Link` invokes the directly named internal `useNavigationContext()` only in its component render (link.tsx:319) and calls the same validated builder with the context. |
| No hidden conditional-hook or try/catch | SATISFIED | ERROR-MESSAGE-sniffing try/catch removed from `context.ts`; the only hook calls left are direct `useContext` inside the named optional/required hooks and the pre-existing explicit readers. No conditional hook invocation anywhere in the navigation surface. |
| Paired href/partialHref/getLinkProps semantics | SATISFIED | Pure calls give identical href/partialHref via the shared builder (`pairedProps.href === pageHref`, `pairedProps['f-partial'] === partialHref` asserted in the adjacent test). |
| Hook-order safety in useMemo/callback/list/conditional | SATISFIED | Adjacent test observes real Preact hooks (evaluator rerun exit 0) and asserts zero hook consumption across the pure utilities; the browser fixture constructs URLs inside `useMemo` and a variable-length list plus a conditional `partialHref` before later `useState`/`useCallback` and native `useChat` hooks, and the browser rerender loop keeps the recorded hook count stable for 3 rounds. |
| Pure URL construction outside components (SSR) | SATISFIED | SSR assertion of `pureHref` with `preserveSearchParams: true` using schema defaults (`page=2&limit=3`) and explicit-override partial page=3&limit=3; captured-hook link props preserve current search; `<target.Link>` SSR indeed renders `page=5&limit=2`. |
| Current-search semantics migrated to explicit hooks | SATISFIED | Test asserts `useCurrentSearch(target)` returns parsed current state (page=4&limit=2 → page=5 via `...currentSearch`), `page.hooks.useRoute().getLinkProps` capture preserves it, and pure helpers get schema defaults regardless of flags (matches D2 exactly). |
| Docs and consumer regression use the public access path | SATISFIED | Docs use `page.hooks.useSearch()` and `page.hooks.useRoute().getLinkProps` (route.md and README diffs); adjacent consumer test at navigation.test.tsx:358-359 uses those exact surfaces. Independent public-export scan concurs with the D2 access-path correction: `useCurrentSearch`/`usePageRoute` are not standalone public exports of the owning subpath (`navigation/mod.ts` exports them only via the internal hooks surface; the public capability is `builtPage.hooks.useSearch()`/`useRoute()` at mod.ts:87,89 delegating through `usePageRoute`), and no new export/type/port was added. The correction stays inside the approved explicit-existing-hook decision — behavior locked in D2 is unchanged. Adjudicated: correct. |
| No mock hook/chat-client/transport | SATISFIED | Fixture imports `useChat` and `fetchServerSentEvents` directly from `@tanstack/ai-preact` and calls them natively; the dev server returns real tagged `text/event-stream` responses — no mock hook, chat client, or transport substitute anywhere in the fixture. |
| Server stream + resume from Last-Event-ID | SATISFIED | The POST handler emits a real incomplete SSE response (events end before RUN_FINISHED on first attempt, resumed replay continues from `Last-Event-ID` with ids 4+); `requests` records `resumed` per channel and the test asserts `resumed: [true, true]` — the upstream native transport performs the actual resume. |
| Every new test has red/restore proof | SATISFIED | Unit: mutation receipt exit 1 failing exactly the new purity assert, restored 7/0 exit 0. Browser: mutation receipt exit 1 with the parsed failure showing the native `x is not a function` hydration error and a locator timeout, restored pass exit 0. The mutation restores the old guarded `readNavigationContext` (per the brief), which structurally reintroduces the hook into the pure-builder path — the designed causal fault; receipts are consistent with the worklog gate table verbatim. Mutations were not re-run by this evaluator (source is read-only); receipt verification covers the requirement. |
| Publication/consumer deferred per D4 | SATISFIED | Issue #2040 remains OPEN; the draft PR body contains no closing keyword (`bodyHasFixes: false` verified via read-only `gh pr view`). The publish dry-run passing is not a publication; the debt row records "publication and qualified published consumer remain owner release gates". The EIS router facade (href → `nav.makeHref`, EIS PR #434, read-only evidence in research.md) becomes removable after qualified publication. |

## Anti-Pattern Check

Only rows whose pattern the slice could plausibly affect are enumerated; all others are out of
slice scope (`N/A`). Per the doctrine code list
(`docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md`):

| AP    | Status | Evidence |
| ----- | ------ | -------- |
| AP-1  | CLEAR  | Monolithic file: touched files ≤ 441 lines; F-1 coverage via quality:gate rerun exit 0. |
| AP-2  | CLEAR  | Helper that renames a platform primitive: the repair reuses the existing builder; no rename of a platform call. |
| AP-3  | N/A    | No interface changed. |
| AP-4  | N/A    | No cross-package inheritance. |
| AP-5  | N/A    | No base-lattice/class change. |
| AP-6  | N/A    | No base class touched. |
| AP-7  | N/A    | No factory changed. |
| AP-8  | N/A    | No DI container change. |
| AP-9  | N/A    | Premature abstraction: no new wrapper/seam layer; the one repair point removes a shim. |
| AP-10 | CLEAR  | Defensive `try/catch` inside handlers: the run **removes** a defensive try/catch (the hidden-hook detector) — this is the repair itself. No new defensive try/catch added; the fixture's `try/finally` cleanup around an observer swap is test-hygiene, not suppressed handler behavior. |
| AP-11 | N/A    | No hidden global introduced; hook observer uses the existing Preact `options` surface inside tests only, restored in `finally`. |
| AP-12 | N/A    | No `Date.now()`/`setTimeout` in handlers (only fixture reconnect delay inside the native transport config). |
| AP-13 | CLEAR  | No `console.log` in published source (probe grep clean). |
| AP-14 | N/A    | No upstream re-export added. |
| AP-15 | N/A    | No `IFoo`-style naming introduced. |
| AP-16 | N/A    | No `utils/helpers/common/lib` folder added. |
| AP-17 | N/A    | No `interfaces/` folder. |
| AP-18 | N/A    | No snapshots of generated strings. |
| AP-19 | CLEAR  | Fixture runs under explicit `--frozen` + task-scoped flags consistent with sibling browser launches; no silent permission assumption beyond the established test-scoped pattern. |
| AP-20 | N/A    | No `compilerOptions.lib` change. |
| AP-21 | N/A    | No command folder change. |
| AP-22 | N/A    | No barrel added/changed. |
| AP-23 | N/A    | No inline command body. |
| AP-24 | N/A    | No switch-over-union added. |
| AP-25 | CLEAR  | No side effect in non-edge files: `context.ts`/`link.tsx` export pure functions; the module-level `options.__h` install is inside test/fixture files only (test edge). |

No doctrine anti-pattern is introduced or deepened by this slice. The hidden conditional hook under
repair corresponds to the AP-10/AP-11 family and is retired outright.

## Findings

| Severity | Finding | Required action |
| -------- | ------- | --------------- |
| low | The pure-helper migration is behavior-visible for callers who relied on implicit `preserveSearchParams` context inside a non-matching route render; docs and README document the migration and the public access path. Intentional per D2; no action. | none |
| info | Three pre-existing quality WARNs in untouched files (`F-5/F-6` in services/cli sample files, `F-DOCT-5` 13-children cap in `src/runtime/ai`, `F-JSR-7` slow-types probe) byte-match the pre-change audit — unchanged by this slice, no new finding. | none |
| info | Doc lint's failing `./src/application/route/mod.ts` rows (8 private-type-ref + 17 missing-JSDoc) all resolve to the untouched pre-existing `contract-types.ts`; no diagnostic changed. Tracked and accepted via the adjudicated debt row. | none |
| info | Owner follow-ups (unchanged from D4): qualified publication of the repaired `@netscript/fresh` package and a qualified published-consumer verification (EIS PR #434 read-only evidence: its href → `nav.makeHref` workaround becomes removable after publication). #2040 must not receive a closing keyword until those acceptance items exist. | owner |

No high/medium findings. No unrecorded doctrine violation introduced. Every slice was committed,
pushed, and commented per the receipts (s2-comment/s3-comment), with per-slice Tier-A review
recorded in the worklog before the following slice sign-off. Draft PR #2090 labels
(`type:fix`, `area:fresh`, `priority:p1`, `status:impl-eval`) and draft state match the run phase.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| A builder invoked both inside and outside components must be structurally context-parameterized; the render boundary should be the only context-reading component, and a hidden try/catch hook detector should be replaced outright (not aliased) to guarantee hook-order stability. | `getBoundLinkProps(…, null)` + component-only `useNavigationContext()` + Preact `options.__h` hook-observation regression | Archetype 4 route-builder concern inside integration packages | high |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 1     | `route-doc-baseline-2040` (adjudicated above: valid, DEBT_ACCEPTED). |
| Resolved entries      | 0     | none. |
| Deepened violations   | 0     | Doc diagnostics byte-identical to baseline on both sides. |
| Unrecorded violations | 0     | AP sweep above. |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | **PASS** |
| Rationale | The approved plan (D1–D4, S1–S5) is implemented completely at source SHA `d34ccacee` (= HEAD `dd452c4b1` for all source paths), with bounded owning-file discipline and the D2 access-path correction staying inside the approved explicit-existing-hook decision. All required static gates pass with independently rerun exit-0 evidence (scoped frozen check incl. type-consumer fixture, lint/fmt, quality:gate=quality:scan+arch:check, owning JSR audit byte-identical to the generator receipt, publish dry-run, carrier barrel, corpus freshness with checksum `2e7db5f4…` matching the receipt); release-class gates are N/A with justification. Runtime/consumer acceptance is proven: evaluator-reran focused unit suite 18/0, production browser suite 1/0, full Fresh suite 284/0, plus the preserved red/restore mutation receipts for both suite classes (unit 1→0, browser `x is not a function` fail→restore pass). The only in-scope debt is a pre-existing doc-lint baseline that is byte-unchanged across the slice and is adjudicated valid as `route-doc-baseline-2040` (DEBT_ACCEPTED, not hidden, direct raw exit 1 evidence retained on both sides). No new export/type/port, no cast/ignore/suppression introduced, no mock hook/chat-client/transport, no fixture residue left, no history/public mutation by the generator as far as reviewable. Remaining work is owner-scoped by design (qualified publication, published-consumer verification), and the PR correctly carries no closing keyword while issue #2040 remains verified-open on those acceptance items. |
