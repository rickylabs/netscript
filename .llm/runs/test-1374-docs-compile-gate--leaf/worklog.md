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

## Handoff Notes

- PLAN-EVAL cycle 2 should verify the copied-lock/catalog recipe, 21/14 bidirectional floor,
  preserved containment/Fresh rules, the barrel-fix disposition, both materialized island modules,
  and the unconditional Pages workflow assertion. Dialect discrimination remains unchanged after
  its cycle-1 compiled controls passed.
- No implementation file, docs marker, task, or workflow has been changed in Phase 1.
