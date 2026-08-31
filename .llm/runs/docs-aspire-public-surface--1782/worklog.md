# Worklog: Aspire `/public` reference accuracy

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-aspire-public-surface--1782` |
| Branch | `docs/aspire-public-surface` |
| Archetype | N/A — docs-only correction describing Archetype 2 |
| Scope overlays | `SCOPE-docs.md` |

## Design

### Public Surface

- No exported code changes. The documented entrypoint is `@netscript/aspire/public`.
- The page must identify `AspireError`, `DuplicateContributionError`, `AspireRuntime`, and
  `ReferenceSpec` as exclusive to that published entrypoint.

### Domain Vocabulary

- `AspireError` — common Aspire package error base.
- `DuplicateContributionError` — repeated plugin-contribution registration failure.
- `ReferenceSpec` — directed resource relationship with optional startup wait.
- `AspireRuntime` — lifecycle port for an Aspire AppHost runtime adapter.

### Ports

- `AspireRuntime` is described, not changed; consumers implement or depend on it to control runtime
  lifecycle.

### Constants

- N/A; no implementation constants are introduced.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Make the published `/public` claim and exclusive-symbol inventory accurate. | Docs source/build/link/accuracy/snippet/export gates | `docs/site/reference/aspire/index.md`; run directory |
| 2 | Reproduce the site-derived offline corpus in CLI/MCP consumers. | Agent-docs, asset-barrel, publish-assets, MCP corpus, targeted check | Exactly four derived assets named in the brief |

### Deferred Scope

- Dedicated domain/ports sub-path design and complete-mode adoption remain with #1777.

### Contributor Path

Future reference updates start from `packages/aspire/deno.json`, inspect each published entrypoint,
then update the page and regenerate the site-derived asset chain.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-30 | S1 | Research | Re-derived the export map, exclusive reachability, symbol definitions, issue/umbrella history, and generator chain. |
| 2026-08-30 | S1 | Plan gate | `PLAN-EVAL: N/A`; bounded mechanical docs correction with no open design decision. |
| 2026-08-30 | S1 | Implement | Corrected the aggregate description and added the four-row table. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Use one exclusive-symbol table | Proportionate to the defect and consistent with the page's table style. | Issue #1782 and current page |
| Do not propose sub-path changes | Export design is explicitly outside this docs slice. | Slice brief / #1777 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| None from the source brief | minor | yes |

## Gate Results

Final exact-head gate evidence is intentionally recorded in the PR Validation table rather than
amended into S1: changing S1 after generation would change the commit that `provenance.json` must
name. This run artifact records the gate contract; the PR records real post-S2 exit codes.

## Handoff Notes

- Verify the four symbols against their three defining files and exclusive `/public` exports first.
- Verify S2 touches exactly four generated assets and its provenance names the S1 short SHA.
- IMPL-EVAL remains supervisor-dispatched and must use a separate session.
