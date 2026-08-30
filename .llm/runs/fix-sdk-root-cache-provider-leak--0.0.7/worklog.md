# Worklog: SDK root cache-provider isolation

## Run Metadata

| Field          | Value                                     |
| -------------- | ----------------------------------------- |
| Run ID         | `fix-sdk-root-cache-provider-leak--0.0.7` |
| Branch         | `fix/sdk-root-cache-provider-leak`        |
| Archetype      | `2 — Integration`                         |
| Scope overlays | none                                      |

## Design

### Public surface

- `@netscript/sdk` — remains the high-level entry with `defineServices`, but no cache engine or
  provider exports and no import-time registration.
- `@netscript/sdk/presets` — new focused browser-safe entry for `defineServices` and its
  package-owned dependent types.
- `@netscript/sdk/cache` — remains the server-only cache engine/provider entry, now load-time pure.
- `@netscript/sdk/query` — remains the provider registry/query entry used to observe registration.
- `@netscript/fresh/server` `defineFreshApp()` — server composition root that explicitly installs
  the default `cacheQuery` provider.

### Domain vocabulary

- `CacheProvider` — existing package-owned port used by query factories.
- `cacheQuery` — existing default server adapter instance.
- `defineServices` — existing composition preset; no new definition shape.
- “browser/shared import safety” — an intact-runtime fresh-child provider assertion plus a committed
  `deno info --json` graph assertion; it is not represented as a production browser/Vite run.

No new domain type is introduced.

### Ports, adapters, and composition root

- Port: existing `CacheProvider`; unchanged.
- Adapter: existing `cacheQuery` / `KvCacheStore`; unchanged behavior.
- Composition root: `defineFreshApp()` calls `setCacheProvider(cacheQuery)` before cache
  invalidation/routes are configured.
- Custom server composition roots call the same existing seam explicitly.

### Constants

No finite domain value is added. The test does not introduce named rollout, runtime, or provider
variant constants.

### Commit slices

| #  | Slice                                                                                                 | Gate                                                        | Files                                          |
| -- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| S1 | Lock research/design/scope/gates and hand off                                                         | Separate PLAN-EVAL                                          | Run directory only                             |
| S2 | Commit the failing intact-runtime root-import test and dormant final graph assertion alone            | Structured test: exit 1, 0 pass / 1 fail on observed `true` | New SDK regression test + run evidence only    |
| S3 | Make SDK surfaces pure and Fresh bootstrap explicit; update migration/reference/generated derivatives | Focused green tests + static/JSR/publish/generated gates    | Authorized product/docs/generated ceiling only |
| S4 | Reconcile final gate evidence without product changes                                                 | Full gate table + lock proof                                | Run artifacts only                             |

### Deferred scope

- CLI redundant bare cache import cleanup — not required for generated Fresh correctness and would
  require prohibited scaffold E2E.
- Existing SDK doc-lint/cardinality/slow-type findings — baseline-only, no regression.
- Real Vite/browser chunk execution — prohibited on this lane/host; coordinator/evaluator evidence.
- Cache algorithm, KV backend, provider contract, package version, and release baseline changes.
- PLAN-EVAL cycle 1 F9's neighbouring Fresh-root reachability edge — coordinator follow-up only; no
  additional Fresh source path is authorized.

### Contributor path

A server author imports `cacheQuery` and `setCacheProvider` from the documented SDK cache/query
entries and registers at their server composition root. A Fresh author calls `defineFreshApp()` and
gets the same explicit default. A browser/shared author imports `defineServices` from
`@netscript/sdk/presets`; a root import remains safe for compatibility.

## Progress log

| Time (UTC) | Slice | Step              | Notes                                                                                                                                                                             |
| ---------- | ----- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30 | S1    | Bootstrap         | Verified branch/base/no-upstream and read required harness, doctrine, Deno/JSR, tools, PR, and RTK instructions. RTK is unavailable on this host, so focused raw reads were used. |
| 2026-08-30 | S1    | Research          | Used `deno doc` before focused source reads; verified issue/source chain and direct consumers.                                                                                    |
| 2026-08-30 | S1    | Baseline gates    | Full SDK doc-lint exit 1 (three unique private-ref files); direct preset file doc-lint exit 1 (10 private refs); JSR audit exit 0 with two existing warnings.                     |
| 2026-08-30 | S1    | Design checkpoint | Locked all three issue moves, compatibility migration, product/proof ceiling, commit slices, and generated cascade.                                                               |
| 2026-08-30 | S1    | Handoff           | PLAN-EVAL selected as mandatory hard stop; S2/S3 not started.                                                                                                                     |
| 2026-08-30 | S1    | PLAN-EVAL cycle 1 | `FAIL_PLAN` at `1bf9c567`; evaluator accepted structure/doctrine/design and returned six measurement repairs (F1-F7). No implementation started.                                  |
| 2026-08-30 | S1    | Lume capability   | `deno task check:agent-docs-prose` exit 0; Lume built 638 files, rendered output was OK, and corpus freshness was `true` with no stale paths.                                     |
| 2026-08-30 | S1    | Plan revision     | Re-locked intact-runtime red, committed graph proof, finite preset type closure, order-independent Fresh proof, four-page prose ownership, and the complete derivative cascade.   |

## Decisions

| Decision                   | Reason                                                                                               | Source                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Archetype 2 / Keep         | Explicit current doctrine assignment and verdict                                                     | Doctrine 06/10                             |
| All three expected moves   | No individual move dominates the combined acceptance-preserving design                               | `research.md` design matrix                |
| Curated presets entry      | Direct entry is measured doc-lint red with 10 private refs                                           | Baseline `deno doc --lint` artifact output |
| Curated type closure       | Explicit type-only `ports/mod.ts` enumeration minus `QueryClientPort`; no wildcard/runtime re-export | PLAN-EVAL cycle 1 F5 measurement           |
| README/site migration note | Import-only registration removal changes behavior for custom servers                                 | Source/issue compatibility analysis        |
| No CLI source edits        | `defineFreshApp` covers generated apps; CLI edit expands into prohibited E2E                         | Consumer census + leaf boundary            |

## Drift

PLAN-EVAL cycle 1 found two evidence-design mismatches: deleting `globalThis.Deno` crashed before
the intended assertion, and the generated-doc cascade omitted the Lume-derived prose/provenance
pair. The revised S1 plan corrects both without changing the accepted product design. Tool
availability note: the requested `rtk` executable is absent (`command not found`); this affects
output filtering only, not evidence selection.

## Gate Results

### S1 research gates

| Gate                            | Command/check                                                 | Result                        | Notes                                                                         |
| ------------------------------- | ------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| Base/branch                     | Raw Git SHA/status/upstream probes                            | PASS                          | HEAD equals supplied `origin/main` baseline; clean at bootstrap; no upstream. |
| Public API inspection           | `deno doc --filter ...` on root/query/cache                   | PASS                          | Confirms real exported entry and cache/provider surface.                      |
| Full SDK doc lint               | `deno task doc:lint --root packages/sdk --pretty`             | MEASURED NEGATIVE (exit 1)    | Three unique private-type-ref source files; zero missing JSDoc.               |
| Proposed direct preset doc lint | `deno doc --lint packages/sdk/src/presets/define-services.ts` | MEASURED NEGATIVE (exit 1)    | 10 private-type-ref diagnostics; plan changed to curated entry.               |
| JSR audit                       | `audit-jsr-package.ts --root packages/sdk --text`             | PASS WITH 2 WARNINGS (exit 0) | Existing F-DOCT-5 cardinality and slow-types warnings; dry-run reported OK.   |
| Agent-docs host capability      | `deno task check:agent-docs-prose`                            | PASS (exit 0)                 | Lume built 638 files; rendered output OK; `fresh: true`, no stale paths.      |
| PLAN-EVAL cycle 1               | Separate opposite-family evaluator                            | FAIL_PLAN                     | Measurement findings F1-F7; no implementation authorized.                     |
| PLAN-EVAL cycle 2               | Separate coordinator-owned evaluator                          | NOT RUN                       | Required next step; hard stop remains.                                        |
| S2 RED                          | Focused structured test                                       | NOT RUN                       | Prohibited before PLAN-EVAL PASS.                                             |

### Gates not applicable/run in S1

- Product check/test/lint/fmt, generated freshness, publish dry-run, and surface diff: not run
  because S1 changes only harness plan artifacts; they are locked for S2/S3.
- E2E CLI, Aspire, Docker, real browser/Vite, and release/canary gates: prohibited or N/A exactly as
  recorded in `plan.md`.

## Handoff notes

PLAN-EVAL cycle 2 should verify the six required repairs against the tree: intact-runtime red,
single-test graph assertion, finite ports-type closure, order-independent Fresh registration proof,
expanded ceiling, and docs/export/generated gate order. S2 must remain absent from this revision.
