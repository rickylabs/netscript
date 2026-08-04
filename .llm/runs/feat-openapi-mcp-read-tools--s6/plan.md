# Plan — OMB S6 three read tools

## Scope and archetype

Implement `list_api_services`, `list_service_operations`, and `get_operation_schema` in
`packages/mcp` as Archetype-2 application flows. No frontend/service/docs overlay and no AppHost or
scaffold run: acceptance is fixture-only.

## Locked decisions

1. Compose S4 and S5 directly: directory rows provide specs; projection functions provide indexing,
   identity resolution, descriptions, and schema views.
2. Forward S5's `sources` array verbatim from `list_api_services`.
3. Omit `operationCount` whenever a parsed spec was not fetched; never substitute zero.
4. Self-cap operation rows at 49 (below the central 50-row truncator), apply filter before cap, and
   set `truncated` iff the filtered row set lost at least one row.
5. Return uniform failures for unknown/unavailable services and unknown/ambiguous operations.
6. Wrap all three flows with S8's existing receipt lifecycle at `cli.ts`; do not write receipts in
   flow code.
7. Live registry delta is 14→17. The staged 17→20 expectation is stale and recorded in drift.

## Public surface

- Three tool names and Standard Schema contracts.
- Three flow factories with explicit input/output types exported from `mod.ts`.
- `McpCliOptions.serviceEndpointDirectory` injection seam for fixtures/embedders; default composition
  uses the existing S5 factory and project root.

## Commit slices

1. **Plan/bootstrap** — run artifacts, live-count divergence, locked contracts and gate map.
2. **Contracts and flows** — three contracts, one flow per tool, fixture tests proving all three
   issue boxes. Gate: targeted package test plus scoped check/lint/fmt.
3. **Registry/composition/exports** — 14→17 registry, CLI wiring and receipts, public exports and
   docs count references required by the existing drift test. Gate: package test and doc-lint.
4. **Merge-readiness evidence** — Archetype-2 full column, quality gate, JSR audit, publish dry-run,
   lock/lint-ignore verification, PR evidence and ready handoff.

## Gate set

- Targeted and full `packages/mcp` tests.
- Scoped check/lint/fmt wrappers rooted at `packages/mcp`, `--ext ts,tsx`.
- `deno task quality:gate` (quality scan + architecture fitness).
- `deno task doc:lint --root packages/mcp --pretty`.
- Package-local `deno task publish:dry-run`.
- Consumer compile through package check and registry/protocol fixtures.
- Diff gates: no new `deno-lint-ignore`, `as unknown as`, or `deno.lock` churn.

## Risks and mitigations

- **Silent truncation:** fixture with >49 filtered operations checks exact retained length and flag.
- **False zero:** schema and fixture distinguish absence from numeric zero.
- **Source transformation:** identity assertion and deep equality prove the exact S5 block is returned.
- **Receipt timing regression:** CLI composition reuses S8 wrapper; existing receipt lifecycle tests
  plus an S6 receipt fixture prove settlement after validated output.
- **Public-surface slow types:** explicit return types plus doc-lint and dry-run.

## Open-decision sweep

- Safe to defer: live-scaffold discovery path (owned by S7), activation copy, execution tool.
- Must resolve now: none.

## Debt and deferred scope

No new architecture debt expected. Invocation, activation, manifest emission, and contract
enrichment remain owned by their board slices.
