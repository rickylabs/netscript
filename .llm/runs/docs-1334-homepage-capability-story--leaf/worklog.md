# Worklog: homepage capability story

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-1334-homepage-capability-story--leaf` |
| Branch | `docs/1334-homepage-capability-story` |
| Archetype | N/A — docs-only |
| Scope overlays | `SCOPE-docs.md` |

## Design

### Public Surface

- `docs/site/index.vto` — rendered documentation homepage.
- Canonical task routes — one-click continuation surface; no new route is introduced.

### Domain Vocabulary

- **Capability outcome** — a concrete “what you get” statement backed by a current seam.
- **Canonical task page** — the first page that teaches the named outcome.
- **Destination lane** — the existing five-item role/intent selector, unchanged.
- **Substantiation** — current export, executable snippet, existing diagram, or authoritative task page.

### Ports

- Vento component contracts — existing `cardsGrid`, diagram, and tab rendering.
- Lume output — semantic and link evidence in `_site/index.html`.
- Playwright browser — viewport, theme, semantics, rendering, and overflow evidence.

### Constants

- `CAPABILITY_DESTINATIONS` — the F1 canonical URL inventory recorded in research/evidence.
- `VIEWPORTS` — 390, 1024, 1600 CSS px.
- `THEMES` — light and dark.
- `DESTINATION_COUNT` — 5, unchanged.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 2.1 | Prove harness baseline, identity, and locked scope | baseline/issue/branch inspection | run artifacts |
| 2.2 | Prove concise outcome-led capability routes | source format, build, no nested card anchor | `index.vto`, run artifacts |
| 2.3 | Prove current exports and claim substantiation | `deno doc`; scratch `deno check --unstable-kv` | `index.vto` if needed, run artifacts |
| 2.4 | Prove rendered semantics without checker relaxation | `check:rendered-output`; source diff | run artifacts |
| 2.5 | Prove full acceptance, browser matrix, links, accuracy, caveats, locks | full prescribed sweep | run artifacts |

### Deferred Scope

- #1277 design/layout polish — backlog owner; this leaf only validates existing responsive system.
- Detailed API and capability inventory — canonical reference/catalog pages own it.
- Package/plugin doctrine remediation — no framework source changes.

### Contributor Path

Add or revise a homepage outcome in `docs/site/index.vto`, point it to its canonical task page,
verify named exports with `deno doc`, build, inspect rendered anchors/semantics, then run the browser
matrix without altering the five-item destination lane.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-10 | 2.1 | Bootstrap | Baseline `714a4ef9b`, live issue, overlay, doctrine boundary, lane identity, and locked plan recorded. |
| 2026-08-10 | 2.2 | Capability presentation | Added eight grouped outcome cards plus adjacent canonical UI, runtime, Aspire, Scalar, and streams task links. |
| 2026-08-10 | 2.2 | Reconcile | Issue #1334 remains open; PR #1442 has no implementation feedback; no plan adjustment or drift. |
| 2026-08-10 | 2.3 | Substantiation | Replaced generic feature nouns with current exported symbols or live CLI commands and traced each outcome to worked code/diagrams. |
| 2026-08-10 | 2.3 | Reconcile | Issue/PR lifecycle unchanged; no new comments, scope change, or drift. |
| 2026-08-10 | 2.4 | Rendered semantics | Fresh Lume build and unchanged checker prove three semantic h2s, exactly five destination links, and zero nested card anchors. |
| 2026-08-10 | 2.4 | Reconcile | PR remains draft at `status:impl`; issue remains open; no new feedback or drift. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| PLAN-EVAL: N/A | Owner supplied a complete, mechanically constrained plan with no material open decision. | issue brief + run-loop §4 |
| Keep five destinations | The checker and destination lane serve a separate role from capability cards. | F3 / D12 |
| No nested card-body links | Linked cards are outer anchors. | `cardsGrid.vto` / D13 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| None | — | yes |

## Gate Results

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Baseline | `git fetch origin && git log --oneline -3 origin/main` | PASS | head `714a4ef9b` |
| L1 inspection | `git show 714a4ef9b --stat` and focused hunks | PASS | acceptance-critical content understood and excluded from edit scope |
| Source format | `cd docs/site && deno task check:source-format` | PASS | `Docs source format: OK` |
| Site build | `cd docs/site && deno task build` | PASS | 617 files; rendered output OK across 220 HTML files |
| Card HTML | DOMParser `.ns-cards-grid__card a` probe | PASS | `nested card anchors: 0` |
| Rendered homepage | `cd docs/site && rtk proxy deno task check:rendered-output` | PASS | 220 HTML files; 4 documented-syntax allowances |
| Semantic DOM | DOMParser heading/destination/card probe | PASS | h2s = required two + capability section; destinations = 5; nested anchors = 0 |
| Checker integrity | `git diff --exit-code 714a4ef9b -- _plugins/check-rendered-output.ts` from `docs/site` | PASS | exit 0; checker unmodified |

### Capability claim substantiation

| Homepage claim | Current seam proof | Canonical demonstration |
| --- | --- | --- |
| Server-first pages | `deno doc --filter definePage packages/fresh/src/application/builders/mod.ts` → exported `definePage()` | `web-layer/builders.md:54-102` worked page chain; `fresh-page-model.svg` on the server page |
| Fresh UI and progressive interaction | `deno doc --filter freshUiRegistryManifest packages/fresh-ui/registry.ts` → exported 66-item manifest; full builder docs list `withForm` | `web-layer/fresh-ui.md:167-190`; form/query/query-bridge/partials task pages linked adjacent to grid |
| Generated and cached data | live `netscript-dev db generate --help` → “Generate Prisma client and Zod schemas”; `deno doc --filter createQueryFactories …`; `deno doc --filter createQueryCollection …` | `database.md:27-30,147,174`; `query.md:142-160`; `query-bridge.md:15-18` |
| Auth seam | `deno doc --filter createAuthBackendRegistry packages/plugin-auth-core/mod.ts` → exported backend registry over `AuthBackendPort` | `identity-access/auth.md:27-39,91-99`; `auth-flow.svg` |
| Plugin contributions | `deno doc --filter definePlugin packages/plugin/mod.ts` → exported manifest builder | `explanation/plugin-system.md:25,91-112` diagram and worked manifest |
| Durable runtimes | `deno doc --filter defineSaga …` and `deno doc --filter defineJob …` → exported typed builders | `sagas.md:29,102-134`; `workers.md:26,139-163`; `streams.md:16`; separate worker/streams task links |
| Observability, Aspire, Scalar | `deno doc --filter withSpan packages/telemetry/mod.ts`; `deno doc --filter createScalarDocs packages/service/mod.ts` | `telemetry.md:29,197,255`; `expose-openapi-scalar.md:93-116`; `/quickstart/aspire/` |
| Agent/MCP discovery | live `netscript-dev agent mcp --help` → stdio MCP server with project/docs/telemetry inputs | `ai/agent-tooling.md:72-132`; explicitly not external-MCP consumer page |

### Snippet proof (D10)

| Snippet | Source page:line | Exact proving command | Result |
| --- | --- | --- | --- |
| Changed TS/TSX samples | N/A — slice 2.2/2.3 changed card strings and raw HTML links only; L1 tab samples are byte-unchanged | `git diff 714a4ef9b -- docs/site/index.vto` and inspect `comp.tabbedCode` hunk | PASS: no changed TS/TSX sample exists, so no scratch module is applicable |

## Handoff Notes

- IMPL-EVAL is mandatory and must be performed by a separate supervisor-selected session.
