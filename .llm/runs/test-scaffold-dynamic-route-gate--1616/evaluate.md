# Evaluation: dynamic-route scaffold gate coverage (#1616 / PR #1773)

## Metadata

| Field          | Value                                        |
| -------------- | -------------------------------------------- |
| Run ID         | `test-scaffold-dynamic-route-gate--1616`     |
| Target         | `packages/cli` scaffold E2E harness          |
| Archetype      | `6 — CLI / Tooling` (+ frontend overlay)     |
| Scope overlays | `frontend`                                   |
| Evaluator      | Independent IMPL-EVAL, separate session, 2026-08-31, head `ef4d3a63f` (plan head `19873d1d7`) |

## Process Verification

| Check                                  | Result  | Evidence                                                                                     |
| -------------------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | `PASS`  | `plan-eval-cycle-2.md` `VERDICT: PASS_PLAN` (head `077d45cd9`, 06:13) precedes S1 `7ef2181e7` (06:19:51) |
| Design section exists in worklog       | `PASS`  | `worklog.md` `## Design`                                                                     |
| Commit slices match design plan        | `PASS`  | RED `7ef2181e7` → GREEN scaffold `677f8f04e` → GREEN runtime `a4df2eb38` → hardening `882130323` → artifacts `cc465e238`/`ef4d3a63f`; RED is its own commit |
| Each slice has a passing gate          | `PASS`  | Receipts `s1-red-*` (expected RED), `s2-*`, `s3-*`, `s4-*` (all exit 0)                       |
| No speculative seams (unused files)    | `PASS`  | Every changed file is registered/consumed; no new barrel; RED-only `binding-not-proven` class removed at GREEN |
| Constants used for finite vocabularies | `PASS`  | Gate id in `GATE` const (`cli-surface.ts:130`); failure classes are a typed union (`probe-app-dynamic-route.ts:12-15`) |

## Static Gates (re-run by this evaluator at `ef4d3a63f`)

| Gate             | Command or check | Result | Evidence |
| ---------------- | ---------------- | ------ | -------- |
| Scoped typecheck | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | `PASS` | 904 files, 8 batches, 0 diagnostics, exit 0 |
| E2E unit tests   | `run-deno-test.ts -- --allow-all packages/cli/e2e/tests` | `PASS` | exit 0, **202 passed / 0 failed / 0 ignored**, 5.314s |
| Package tests    | `run-deno-test.ts -- --allow-all packages/cli` | `PASS` | exit 0, **1457 passed / 0 failed / 0 ignored**, 62.571s |
| Asset integrity  | `deno task check:assets-barrel` | `PASS` | exit 0; regenerated barrel matches committed `embedded.generated.ts` |
| Fitness          | `deno task quality:gate` (lease-free: read-only scanner + doctrine, net only api.github.com) | `PASS` | exit 0; doctrine `FAIL=0`, pre-existing warnings only |
| Lint/fmt         | receipts `s4-scoped-lint.json` / `s4-scoped-fmt.json` (verified, not re-run: 0 findings, 16/16 files, standard rules incl. `recommended`+`jsr`) | `PASS` | run receipts |
| Doc lint / publish dry-run | N/A — no published export/declaration surface moved (no `mod.ts`/`scaffolding.ts`/`testing.ts`/export-map change in `19873d1d7..HEAD`) | `N/A` | diff path list |
| Root regression  | receipt `s4-root-test.json`: exit 0, 4,440 / 0 / 19 (not re-run repo-wide by this evaluator; scoped suites above re-run fresh) | `PASS` | receipt |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| 10 — `e2e:cli run scaffold.runtime --cleanup --format pretty` (leased) | live generation + Vite/Fresh + plain/partial HTTP + Chromium probe | `NOT_RUN` | No host lease held; evaluator protocol forbids runtime commands. Correctly `NOT_RUN` in worklog Gate Table; must be proven at merge-readiness. |

## Lock Adjudication (PLAN-EVAL cycle-2, seven locks)

| Lock | Status | Deciding evidence |
| ---- | ------ | ----------------- |
| A — Gate order | **UPHELD** | `capability-suites.ts:131-133`: `BEHAVIOR_APP_HOME` → `BEHAVIOR_APP_DYNAMIC_ROUTE` → `BEHAVIOR_APP_REFERENCE` in the actual `RUNTIME_GATES` array; registration order identical in `behavior-gates.ts` (inserted between the two `commandGate` calls); `suite-registry_test.ts:284-295` asserts `[homeIndex, dynamicRouteIndex, referenceIndex] === [homeIndex, homeIndex+1, homeIndex+2]`. Gate is critical: `gate-factory.ts` `commandGate` hardcodes `critical: true`, asserted by `runtime-gates_test.ts` (`assertEquals(gate.critical, true)`). Also inside the sqlite tier (`RUNTIME_SQLITE_GATES` = `RUNTIME_GATES` minus the Postgres-only set; new gate not in that set). |
| B — Non-satisfiable markers + negatives | **UPHELD** | `probe-app-dynamic-route.ts:41,50`: `data-order-id="${nonce}"` and `href="/examples/orders/${nonce}"` — neither substring can occur inside the other (uuid contains no `"`/`=`/`/`). Negatives in `probe-app-dynamic-route_test.ts:34-66`: href-only → `path-marker`, id-only → `href-marker`, HTTP 500 **with both markers present in the body** → `status` (proves status checked first). |
| C — Nonce + template proof | **UPHELD** | Nonce is per-run `order-${crypto.randomUUID()}` (`probe-app-dynamic-route.ts:62-64`) with an explicit `order-42` guard (`:91-93`); one nonce shared by both modes (test `:68-100`, `nonceCalls === 1`). Template proof `route-templates_test.ts:147-157`: `.withRoute(appRoutes.order)`, `const id: string = ctx.path.id;`, `const selfHref = ctx.route.href({ path: { id } });`, `data-order-id={id}`, `href={selfHref}`, `!route.includes('ctx.params')`, `!route.includes('ctx.url')`, `!route.includes('order-42')`. |
| D — Both request modes | **UPHELD** | `probe-app-dynamic-route.ts:100-111`: plain GET then `?fresh-partial=true` GET, both validated (status + both markers) on the same candidate; failure of either throws. Mechanism verified in the cached upstream dependency: `PARTIAL_SEARCH_PARAM = "fresh-partial"` (`jsr.io` remote cache, `@fresh/core` `^2.3.3` per `scaffold-app-catalog.ts:9`), and `_layout.tsx.template:18,25` wraps page content in `<Partial name='page'>` so the partial fragment carries the markers. Test asserts exact request URLs, `accept: text/html`, and **no** `fresh-partial` header (`:94-99`). |
| E — Seed locked to generator output | **UPHELD** | `write-app-files_test.ts:113-156`: temp route tree with `routes/examples/orders/[id].tsx` → `discoverNetScriptRoutes(resolveNetScriptRouteManifestOptions(appRoot, {}))` → `renderNetScriptRouteManifest` / `renderNetScriptRoutesModule` (real generator, exported at `packages/fresh/src/application/route/manifest.ts:341,445`) → both outputs imported and compared with `assertEquals(seedShape, generatedShape)`, pinned to `{pattern, routePattern, id: 'examples.orders.$id', kind: 'page', href: '/examples/orders/parity-nonce'}`. Seeds match D9 exactly (`app-route-seeds.ts` diff). |
| F — RED semantics | **UPHELD** | RED commit `7ef2181e7` is test-only + a real validator module whose fully-valid branch returns `{ok:false, failure:'binding-not-proven'}` — a semantic failure, not a missing module/import. Receipts `s1-red-focused.json` (exit 1, 72/7) and `s1-red-conventions.json` (exit 1, 0/1) show every failure is semantic: template not registered, seed lacks `orders.$id`, catalog order `[78,-1,79]`, `GATE` lacks the id, and the two valid-response cases rejected `binding-not-proven`; the href-only/id-only/500 negatives **passed at RED**. All 72 non-RED tests compiled and passed. |
| G — Ceiling and lock | **UPHELD** | `git diff --name-only 19873d1d7..HEAD` (non-run) = 20 files, all in the File Plan or its named test categories (`runtime-gates_test.ts` = the plan's "runtime behavior-gate tests"; `app-template-test-support.ts` = 1-line re-export needed by the template test). `deno.lock` diff is **empty (0 lines)** — byte-identical. No workflow, no `mod.ts`/export-map, no debt-file change. |

## Anti-Pattern Check

| AP | Status | Evidence |
| -- | ------ | -------- |
| AP-1 / AP-9 (convenience abstraction/barrel) | `CLEAR` | One focused probe module; no new barrel; no abstraction beyond the validator+probe pair. |
| AP-18 (snapshot/overlapping-substring assertions) | `CLEAR` | Assertions are attribute-scoped markers with negatives, plus semantic subtree equality in the parity test — no whole-file/HTML snapshots. |
| AP-21 (parallel runner/vocabulary) | `CLEAR` | Reuses nested E2E folders, `commandGate`, `GATE` vocabulary, existing endpoint resolver; no new suite. |
| AP-25 (effects at edges) | `CLEAR` | Filesystem/process effects stay in the writer and the command gate; unit tests inject `resolveLiveUrls`/`fetchUrl`/`createNonce`/`log`. |
| Others | `N/A` | Outside slice scope. |

## Arch-Debt Delta

| Metric | Count | Evidence |
| ------ | ----- | -------- |
| New entries | 0 | No `debt/**` file in `19873d1d7..HEAD` |
| Resolved entries | 0 | — |
| Deepened violations | 0 | `quality:gate` exit 0, doctrine `FAIL=0` |
| Unrecorded violations | 0 | none observed |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low | Plan Slice 1 listed "retained-route" among RED subjects; the retained-route assertion (`public-command-tree_test.ts:115-121`, inside the real scaffold-fixture test) was added at GREEN instead of RED. All committed REDs satisfy lock F; the plan's own Slice 2 also names retained-route coverage as GREEN work, so the deviation is an ordering nuance, not a scope change. | RED commit `7ef2181e7` touches only the conventions test in that file; retained-route entry arrives in `677f8f04e` | none — assertion exists and runs against a real scaffolded fixture |
| low | The probe validates markers as substrings of the response body, not via DOM parsing. A hypothetical page reflecting the raw request path into both `data-order-id` and an anchor href without the typed bound route could satisfy it. Mitigated at the shipped surface: template test forbids `ctx.url`/`ctx.params`/literal fallback and pins the href to `ctx.route.href({path:{id}})`; compile gate proves `ctx.path.id` inference. | `probe-app-dynamic-route.ts:41-57`; `route-templates_test.ts:147-157` | none — residual is contrived and covered by mechanism assertions |
| info | Test-only relative import `packages/fresh/src/application/route/manifest.ts` from a `packages/cli` test (`write-app-files_test.ts:6-11`) crosses a package boundary. Plan-directed (File Plan: "call the current Fresh `resolveNetScriptRouteManifestOptions` / `discoverNetScriptRoutes`"), test-only, and it is what makes lock E generator-derived rather than a second handwritten model. | single occurrence; no product-side cross-package import | none |
| info | S4 hardening included formatting-only normalization inside already-locked files (e.g. `write-app-files.ts` ternary collapse, quote style in `route-templates_test.ts`), disclosed in `drift.md` (S4 entry) with a run-local config applying the repo's standard rules to exactly the 16 changed files. | `cli-quality-deno.json`; drift 2026-08-31 S4 | none |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Semantic-subtree parity beats source-text parity | Import both generator output and seed, compare extracted subtrees — formatting-independent and generator-derived | Archetype 6 scaffold slices | high |
| Attribute-scoped marker pairs with negative classes | Marker strings that cannot contain each other + href-only/id-only/500 negatives | Any HTTP-semantic render gate | high |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | All seven cycle-2 locks are upheld against the actual tree, not the prose. The live gate (row 10) is correctly `NOT_RUN` — no lease was held and the evaluator protocol forbids runtime commands; it remains the proving gate at merge-readiness. All lease-free gates re-ran green with fresh numbers. No unrecorded doctrine violation, no debt delta, `deno.lock` byte-identical, scope ceiling honored. |
