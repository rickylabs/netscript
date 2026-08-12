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

## Handoff Notes

- Slice 3 applies the 14 structural markers, fixes the barrel binding, compiles the real Tier-1
  floor through the checked support modules, writes the expansion ratchet, and demotes only the
  named positive `docs:accuracy` assertions.
- Keep `createServiceQueryUtils` page containment, the site-wide Fresh-root guard, and
  `check-exports-drift` unchanged.
