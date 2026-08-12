# Worklog: docs snippet compile gate for #1374

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-1374-docs-compile-gate--leaf` |
| Branch | `test/1374-docs-snippet-compile-gate` |
| Archetype | N/A — internal docs tooling |
| Scope overlays | `SCOPE-docs` |

## Design

Recorded before implementation. Implementation is prohibited until separate-session PLAN-EVAL
returns `PASS`.

### Public Surface

- Root task `docs:snippets` — scan, compile, and print the Tier-1/corpus census.
- Root task `docs:snippets:test` — focused parser/compiler/fixture tests.
- Root task/CLI fixture mode `docs:snippets:negative -- <case>` — run exactly one real red control
  and preserve its non-zero exit.
- Internal checker exports used by its tests: fence extraction, exact workspace export-map
  derivation, synthetic workspace assembly, and check-result/census reporting.

### Domain Vocabulary

- `FencedBlock` — source path, opening/closing lines, language, info string, and exact body.
- `Exemption` — a checked-language block with a non-empty inline reason.
- `CoveragePolicy` — Tier-1 page set and exemption budget.
- `SnippetCensus` — scanned fences, TS-like candidates (`ts`/`tsx`/`typescript`), checked, exempt,
  outside-floor, and malformed counts.
- `SyntheticModule` — source block plus page-isolated generated path and diagnostic offset.
- `WorkspaceEntrypointMap` — exact public specifier-to-declared-file mapping.
- `SnippetCheckResult` — subprocess exit, diagnostics, census, and generated-to-source map.

### Ports

- No custom architecture port. Deno's filesystem/temp APIs and `Deno.Command` are the actual
  platform boundaries. Tests exercise the real CLI in temp fixture roots rather than mocking the
  compiler.

### Constants

- `CHECKED_LANGUAGES` — `ts`, `tsx`, and `typescript`, with `typescript` normalized to `.ts`.
- `TIER_1_PAGES` — the nine issue-mandated paths, including zero-block `index.vto`.
- `NO_CHECK_MARKER` — exact `no-check:<nonblank reason>` grammar from plan D3.
- `TIER_1_MINIMUM_CHECKED` / `TIER_1_MINIMUM_CANDIDATES` — 21 / 35 at the initial floor.
- `TIER_1_EXEMPTION_BUDGET` — maximum 14 at the initial floor.
- `NEGATIVE_FIXTURES` — `non-exported-symbol`, `empty-exemption-reason`,
  `dialect-a-object-input`.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Extractor, policy, census, marker grammar, missing-reason red control | Scoped wrappers; focused test task; direct empty-reason red exit | Checker/test/policy/fixture, `deno.json`, run artifacts |
| 2 | Exact export resolver, synthetic compiler/support, export/dialect controls | Scoped wrappers; focused tests; two direct compiler red exits | Checker/test/support fixtures, run artifacts |
| 3 | Tier-1 markers/green gate, expansion doc, accuracy demotion | Snippet task; docs accuracy; docs links; scoped wrappers | Tier-1 docs, accuracy checker/test, coverage doc, run artifacts |
| 4 | Pages package/plugin trigger and final gate set | All requested gates including repo tests and three raw red exits | Pages workflow/test, run artifacts |

### Deferred Scope

- 260 TS-like blocks outside the Tier-1 floor — section-sized expansion ratchet in plan D8.
- Seven `typescript` fences are aliases now; canonical spelling cleanup remains in the reference
  expansion wave.
- README/install/export-corpus work — owned by #1377/#1343/#1108/#1531.

### Contributor Path

Read `.llm/tools/docs/snippet-coverage.md`, add a page to the checked policy, run
`deno task docs:snippets`, make complete blocks compile through public imports, add a reason marker
only to a deliberate fragment, lower the recorded outside-floor/exemption census, then run the
focused negative controls before the repo suite.

## Progress Log

| Date | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-12 | Phase 1 | Bootstrap | `supervisor.md` written first; branch and baseline match dispatch. |
| 2026-08-12 | Phase 1 | Research | Live issue read; workspace, 578-fence corpus, checkers, and workflows inspected. |
| 2026-08-12 | Phase 1 | Original Plan & Design | Cycle-1 submission locked 35 Tier-1 = 18 checked + 17 exempt; superseded after evaluator probes. |
| 2026-08-12 | PLAN-EVAL cycle 1 | `FAIL_PLAN` | Opposite-family evaluator built and ran D2, confirmed four blocking defects and four non-blocking gaps; no implementation started. |
| 2026-08-12 | Phase 1 revision | Plan & Design | D2 now uses a copied temporary lock without `--frozen` plus root-catalog fallback; containment/Fresh guards remain; `typescript` is covered; the barrel bug and two island examples move to checked. Revised floor is 35 = 21 checked + 14 exempt. |
| 2026-08-12 | PLAN-EVAL cycle 2 | `PASS` | Fresh opposite-family session verified every cycle-1 fix by execution. Two mandatory additive D2 mechanics were recorded before implementation: carry the root catalog section and canonicalize equivalent import ranges. |
| 2026-08-12 | Slice 1 | Extractor contract | Added stable source/fence provenance, backtick/tilde parsing, `ts`/`tsx`/`typescript` recognition, exact reason markers, bidirectional coverage floors, the real-corpus census test, and the empty-reason CLI fixture. |
| 2026-08-12 | Slice 2 | Compiler contract | Added exact public-export resolution, canonicalized root/member imports, root-catalog fallback and copied catalog, disposable copied-lock compilation, page-isolated modules, typed query support, and real export/dialect controls. |
| 2026-08-12 | Slice 3 | Tier-1 and demotion | Applied 14 structural reasons, fixed the barrel binding, compiled 21 fences, wrote the five-wave ratchet, retained vocabulary/Fresh/export guards, and removed only the named positive needles. |
| 2026-08-12 | Slice 4 | Pages and final gates | Added both package/plugin trigger arms, the root snippet step before Lume, an unconditional structural workflow test, three raw red exits, and a green 3,193-test repository verdict. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Exact declared-export import map | Prevent private subpath/symbol false greens while retaining `@netscript/*`. | `plan.md` D2; doctrine A1/A14 |
| Disposable copied lock plus root-catalog fallback | Preserve dependency pins without an impossible frozen synthetic workspace, and resolve catalog-only transitive bare imports. | PLAN-EVAL B1; `plan.md` D2 |
| Page-isolated OS-temp modules | Preserve local imports without cross-page contamination or tracked noise. | `plan.md` D1 |
| Pages owns the package/plugin trigger | Site-owning workflow runs on drafts; core CI currently does not. | `plan.md` D4; workflow research |
| 14 reasoned exemptions | Evaluator classification leaves only structural fragments exempt; the real barrel bug is fixed and both harness-fit island examples receive typed support. | PLAN-EVAL B4/N1; `research.md`; `plan.md` marker table |
| Vocabulary/Fresh guards survive | Compilation cannot enforce dialect page placement, and site-wide compile coverage is not complete. | PLAN-EVAL B2/N2; `plan.md` D5 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Cycle-1 plan assumptions failed concrete evaluator probes | Significant | Yes — D2 frozen lock, catalog fallback, containment, alias bypass, and exemption disposition are recorded. |

## Gate Results

### Phase 1 artifact checks

| Gate | Result | Notes |
| --- | --- | --- |
| Branch/base/raw status | PASS | Branch and both HEAD/base at `01aa12b67`; only run-dir files are new. |
| Fence census | PASS | 578 total; 288 `ts`/`tsx` plus 7 `typescript`; Tier-1 35. Read-only research command. |
| PLAN-EVAL cycle 1 | `FAIL_PLAN` | Four blocking and four non-blocking findings; all addressed in the revised plan artifacts. |
| PLAN-EVAL cycle 2 | PASS | No blocking findings; implementation authorized after the mandatory pre-slice-2 amendments. |
| Implementation gates | NOT_RUN | Correctly deferred until separate PLAN-EVAL `PASS`. |

### Slice 1 — extractor, marker, and census

| Gate | Result | Evidence |
| --- | --- | --- |
| Scoped type-check | PASS | Wrapper selected 17 docs-tool TS files; 0 diagnostics; exit 0. |
| Scoped lint | PASS | Wrapper selected 17 docs-tool TS files; 0 findings; exit 0. |
| Scoped format | PASS | Exact docs-tool wrapper selected 17 files; 0 findings after Deno-formatting the selected TS surface; exit 0. |
| Focused tests | PASS | `deno task docs:snippets:test`: 4 passed, 0 failed. |
| Raw empty-reason control | EXPECTED_RED | `deno task docs:snippets:negative empty-exemption-reason`: exit 1; `page.md:1: malformed ts fence: expected no-check:<nonblank reason>`. |
| Lock hygiene | PASS | No `deno.lock` change. |

Slice review: parser provenance is stable for #1378; recognized aliases share one strict marker
grammar; missing candidates, checked-count loss, and exemption growth are independent failures. No
ambient or cast-based legalization exists. The exact format gate also normalized pre-existing Deno
format drift in `check-exports-drift.ts` and its test without semantic edits.

Reconcile: PR #1537 remains draft with `status:impl`, `Closes #1374`, milestone `0.0.6`, and the
required type/area/priority labels. New comments contained only the already-recorded #1378 extractor
consumer boundary; no scope or issue-state readjustment was required.

### Slice 2 — synthetic compiler and public entrypoints

| Gate | Result | Evidence |
| --- | --- | --- |
| Scoped type-check | PASS | Wrapper selected 21 docs-tool TS files; 0 diagnostics; exit 0. |
| Scoped lint | PASS | Wrapper selected 21 docs-tool TS files; 0 findings; exit 0. |
| Scoped format | PASS | Wrapper selected 21 docs-tool TS files; 0 findings; exit 0. |
| Focused tests | PASS | `deno task docs:snippets:test`: 8 passed, 0 failed. |
| Copied-lock green control | PASS | Dialect-A positional fixture exits 0 with 37 discovered members and 38 copied catalog entries; temporary lock is rewritten while tracked root lock bytes remain unchanged. |
| Raw non-exported-symbol control | EXPECTED_RED | `deno task docs:snippets:negative non-exported-symbol`: exit 1; source fence `page.md:1`; TS2305 names `DefinitelyNotExportedByNetScript`. |
| Raw dialect-A wrong-shape control | EXPECTED_RED | `deno task docs:snippets:negative dialect-a-object-input`: exit 1; source fence `page.md:1`; TS2353 says `input` does not exist in `{ id: string }`. |
| Dialect positive controls | PASS | Direct dialect-A positional and dialect-B `{ input }` fixture invocations both exit 0 through the same typed public-factory support. |
| Lock hygiene | PASS | `deno.lock` is clean after all compiler/test/control runs. |

Slice review: the generated configuration exposes only exact workspace-declared `@netscript/*`
exports, materializes catalog-only transitive imports, copies the 38-entry root catalog, and compares
canonicalized package requirements. Page-local imports resolve within isolated temporary roots;
diagnostics map generated paths back to source fence lines. Typed support contains no `any` or casts,
and the wrong dialect remains a real excess-property error.

Reconcile: PR #1537 remains draft at `status:impl`; the only cross-lane instruction still applies:
#1378 consumes the stable extractor provenance surface and does not fork the parser. No new reviewer
comment changed the locked slice plan.

### Slice 3 — Tier-1 floor, expansion plan, and accuracy demotion

| Gate | Result | Evidence |
| --- | --- | --- |
| Tier-1 snippet gate | PASS | `deno task docs:snippets`: exit 0; `scanned=578 ts=211 tsx=77 typescript=7 ts_like=295 tier1=35 checked=21 exempt=14 outside_floor=260 malformed=0`; all 14 reasons printed. |
| Focused snippet tests | PASS | `deno task docs:snippets:test`: 8 passed, 0 failed, including independent candidate/checked/exemption floors and the `typescript` alias regression. |
| Accuracy unit tests | PASS | Focused accuracy test: 4 passed, 0 failed; covers stale saga claims, golden-path containment, Fresh-root imports, and mutation-map columns. |
| Docs accuracy | PASS | `deno task docs:accuracy`: exit 0; 4 saga pages, 192 published pages, exact query exception page, mutation columns, 3 Fresh-root imports; export drift subprocess remains green. |
| Docs links | PASS | `deno task docs:links`: exit 0; 102 docs, 0 broken links, 0 broken anchors. |
| Scoped type-check | PASS | Wrapper selected 21 docs-tool TS files; 0 diagnostics; exit 0. |
| Scoped lint | PASS | Wrapper selected 21 docs-tool TS files; 0 findings; exit 0. |
| Scoped format | PASS | Wrapper selected 21 docs-tool TS files; 0 findings; exit 0. |
| Lock hygiene | PASS | `deno.lock` remains clean. |

The first real-corpus compile was usefully red: TS2307 named the missing documented relative support
modules at `web-layer/examples.md:40` and `web-layer/interactive.md:92`. Both are now generated from
typed public contracts/client/query factories with no casts or `any`; the checked count stayed 21.
The add-service barrel correction compiles unmarked. The expansion document records all five waves
and the deliberate wave-4 positive-reference-presence window.

Accuracy demotion preserved the four orphan-send forms, object-form `defineSaga`, the stale service
kind, all golden-path forbidden aliases/CSS-client claims, exact one-page
`createServiceQueryUtils` containment, the five mutation-map columns, site-wide Fresh-root imports,
and the unchanged export-drift subprocess. Only the named positive API/presence needles were removed.

### Slice 4 — Pages trigger and final gate set

| Gate | Result | Evidence |
| --- | --- | --- |
| Pages workflow contract | PASS | `pages-workflow_test.ts` structurally parses both event path lists and build steps; both arms include docs/package/plugin/tool/config paths, and root `docs:snippets` precedes the `docs/site` Lume build. |
| Focused snippet/workflow tests | PASS | `deno task docs:snippets:test`: 9 passed, 0 failed. |
| Scoped type-check | PASS | Wrapper selected 22 docs-tool TS files; 0 diagnostics; exit 0. |
| Scoped lint | PASS | Wrapper selected 22 docs-tool TS files; 0 findings; exit 0. |
| Scoped format | PASS | Wrapper selected 22 docs-tool TS files; 0 findings; exit 0. |
| Docs links | PASS | Exit 0; 102 docs, 0 broken links, 0 broken anchors. |
| Docs accuracy | PASS | Exit 0; textual policies and export drift green. |
| Tier-1 snippet gate | PASS | Exit 0; exact census `578/211/77/7/295/35/21/14/260/0`; all 14 exemption reasons printed. |
| Raw empty-reason control | EXPECTED_RED | Exit 1; `page.md:1: malformed ts fence: expected no-check:<nonblank reason>`. |
| Raw non-exported-symbol control | EXPECTED_RED | Exit 1; source fence `page.md:1`; TS2305 names `DefinitelyNotExportedByNetScript`. |
| Raw dialect-A wrong-shape control | EXPECTED_RED | Exit 1; source fence `page.md:1`; TS2353 names the unsupported `input` property. |
| Repository suite | PASS | `deno task test`: 3,193 passed (617 steps), 0 failed, 17 ignored; exit 0 in 3m13s. |
| Lock hygiene | PASS | The full gate set left tracked `deno.lock` clean. |

Final review: `.github/workflows/pages.yml` owns the compile step and both package/plugin trigger
arms; `.github/workflows/ci.yml` is deliberately unchanged and retains its existing accuracy job.
The structural assertion is part of both `docs:snippets:test` and root test discovery. Generated
modules remain temporary and compilation-only. No service, network validation, or E2E CLI suite was
run; those are outside this slice and the brief explicitly excludes `e2e:cli`.

Reconcile: PR #1537 remains draft at `status:impl` with `Closes #1374`, milestone `0.0.6`, and the
required type/area/priority labels. No reviewer comment altered scope. Phase 2 is complete locally;
the next authority is a fresh opposite-family IMPL-EVAL session.

## Handoff Notes

- Phase 2 is complete after the Slice-4 commit/push/comment boundary.
- IMPL-EVAL must run in a fresh opposite-family session and should independently rerun the green
  gate, all three raw red controls, the workflow mutation assertion, and lock-hygiene check.
- Keep the PR draft; the implementation agent does not mark ready or merge.
