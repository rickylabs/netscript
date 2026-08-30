# Worklog: logger sub-path reference surface

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-logger-subpath-surface--1784` |
| Branch | `docs/logger-subpath-surface` |
| Archetype | `N/A` for implementation; underlying logger is Doctrine Archetype 2 |
| Scope overlays | `docs` |

## Design

### Public Surface

- Existing `@netscript/logger` reference page only; no new public entrypoint or page.
- `@netscript/logger/middleware`: the exact 13-symbol `deno doc` inventory.
- `@netscript/logger/orpc`: the exact 13-symbol `deno doc` inventory.

### Domain Vocabulary

- Middleware contracts — request, response, context, environment, options, next, and handler types.
- Middleware operations — logger/request-ID injection and full/light middleware factories.
- oRPC interceptor contracts — root/client option and function shapes plus their union.
- oRPC plugin contracts — handler options, log levels, plugin options/class/factory.
- oRPC context contracts — injected logger/request-ID value and its factory.

### Ports

- N/A: this docs lane consumes source and `deno doc`; it introduces no abstraction.

### Constants

- Exact middleware symbol set: 13 names enumerated in `research.md` evidence.
- Exact oRPC symbol set: 13 names enumerated in `research.md` evidence.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Correct and prove the consolidated logger reference surface. | Docs/static gate set and exact symbol comparison. | `docs/site/reference/logger/index.md`, run-dir artifacts |
| 2 | Embed the S1-rendered docs corpus with S1 provenance. | Agent-docs, barrel, publish-asset, MCP corpus, and targeted type checks. | The four authorized derived assets |

### Deferred Scope

- Separate pages and `AUTHORITATIVE_MAPPING` complete-mode adoption — later #1777 slices.

### Contributor Path

When either sub-path changes, run `deno doc --json` for that entrypoint, update its table on the
existing page, then rebuild the site-derived corpus and both generated consumers.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-30 | S1 | research | Re-derived branch, issues, missing pages, missing probes, export map, source behavior, and both 13-symbol sets. |
| 2026-08-30 | S1 | plan | Recorded `PLAN-EVAL: N/A`; no material decision remains. |
| 2026-08-30 | S1 | implement | Replaced the false promise and added the two exact symbol tables. |
| 2026-08-30 | S1 | gate | Eight page/docs gates passed; README baseline red reproduced cleanly. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Consolidate 26 rows in two tables. | Each entrypoint has 13 live exports; `Logger` is shared. | `deno doc --json`, source |
| Avoid the phrase “all symbols” in page prose. | Exact table equality is stronger and avoids an unnecessary completeness slogan. | brief, plan |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Shared `origin/main` ref advanced after locked-baseline research; branch base did not change. | minor | yes |

## Gate Results

### Static Gates

| Gate | Exit | Result | Notes |
| --- | ---: | --- | --- |
| `deno task --cwd docs/site check:source-format` | 0 | PASS | Source format OK. |
| `deno task --cwd docs/site build` | 0 | PASS | 639 files generated; rendered output OK. |
| `deno task --cwd docs/site check:links` | 0 | PASS | 35,344 internal links across 227 pages resolve. |
| `deno task --cwd docs/site check:caveats` | 0 | PASS | 18 caveat markers resolve. |
| `deno task docs:links` | 0 | PASS | No broken links, anchors, or enforced orphans. |
| `deno task docs:accuracy` | 0 | PASS | Accuracy/discoverability check passed. |
| `deno task docs:snippets` | 0 | PASS | 581 snippets scanned; no malformed snippets. |
| `deno task docs:exports-drift` | 0 | PASS | Exports and symbols drift check passed. |
| `deno task docs:readme:check` | 1 | BASELINE RED | Only `packages/bench/README.md` lacks `## Install`. |
| Clean detached `origin/main`: `deno task docs:readme:check` | 1 | BASELINE RED | Reproduced the identical `packages/bench/README.md` failure. |
| `diagrams:check` | N/A | N/A | No diagram input or rendered diagram path changed. |

### Consumer Gates

The agent-docs prose, generated barrel, publish assets, MCP corpus, and targeted type checks run
after S1 so provenance can name the S1 commit. Their real final-head results belong in the PR
validation table; S2 is restricted to the four derived files and therefore cannot update this log.

## Handoff Notes

- IMPL-EVAL must independently enumerate both entrypoints and verify 13/13 table-row set equality.
- Check the reserved `logBody` statement and the distinct full/light middleware descriptions first.
