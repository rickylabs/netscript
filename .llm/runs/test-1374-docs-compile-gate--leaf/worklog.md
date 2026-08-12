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
- `SnippetCensus` — scanned fences, TS/TSX candidates, checked, exempt, outside-floor, malformed,
  and `typescript` alias counts.
- `SyntheticModule` — source block plus page-isolated generated path and diagnostic offset.
- `WorkspaceEntrypointMap` — exact public specifier-to-declared-file mapping.
- `SnippetCheckResult` — subprocess exit, diagnostics, census, and generated-to-source map.

### Ports

- No custom architecture port. Deno's filesystem/temp APIs and `Deno.Command` are the actual
  platform boundaries. Tests exercise the real CLI in temp fixture roots rather than mocking the
  compiler.

### Constants

- `CHECKED_LANGUAGES` — `ts`, `tsx`.
- `TIER_1_PAGES` — the nine issue-mandated paths, including zero-block `index.vto`.
- `NO_CHECK_MARKER` — exact `no-check:<nonblank reason>` grammar from plan D3.
- `TIER_1_EXEMPTION_BUDGET` — 17 at the initial floor.
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

- 253 TS/TSX blocks outside the Tier-1 floor — section-sized expansion ratchet in plan D8.
- Seven `typescript` fences — explicit normalization in the reference expansion wave.
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
| 2026-08-12 | Phase 1 | Plan & Design | Decisions locked; planned census is 35 Tier-1 = 18 checked + 17 exempt. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Exact declared-export import map | Prevent private subpath/symbol false greens while retaining `@netscript/*`. | `plan.md` D2; doctrine A1/A14 |
| Page-isolated OS-temp modules | Preserve local imports without cross-page contamination or tracked noise. | `plan.md` D1 |
| Pages owns the package/plugin trigger | Site-owning workflow runs on drafts; core CI currently does not. | `plan.md` D4; workflow research |
| 17 reasoned exemptions | Direct inspection separates deliberate partials from 18 compilable blocks. | `research.md`; `plan.md` marker table |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| None during Phase 1 | N/A | N/A; drift file initialized with no entries |

## Gate Results

### Phase 1 artifact checks

| Gate | Result | Notes |
| --- | --- | --- |
| Branch/base/raw status | PASS | Branch and both HEAD/base at `01aa12b67`; only run-dir files are new. |
| Fence census | PASS | 578 total; 288 `ts`/`tsx`; Tier-1 35. Read-only research command. |
| Implementation gates | NOT_RUN | Correctly deferred until separate PLAN-EVAL `PASS`. |

## Handoff Notes

- PLAN-EVAL should inspect D1–D6 first, especially exact export-map resolution, the 17 exemption
  reasons, and the dialect-B green control.
- No implementation file, docs marker, task, or workflow has been changed in Phase 1.
