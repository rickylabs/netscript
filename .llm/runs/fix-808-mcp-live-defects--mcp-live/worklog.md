# Worklog: fix #808 MCP live-validation blockers

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-808-mcp-live-defects--mcp-live` |
| Branch | `fix/808-mcp-live-defects` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Design

### Public Surface

- `@netscript/mcp/cli` `createMcpCliServer()` and `runMcpStdioServer()` retain their signatures;
  `McpCliOptions.docsRoot` remains the explicit filesystem override.
- Existing `TOOL_OUTPUT_SCHEMAS.doctor` remains capped at 20 top-level checks.
- Existing `@netscript/telemetry/query` port remains unchanged; only the Aspire adapter accepts the
  real envelope.
- The `./cli` entrypoint re-exports the existing types used by its exported signatures so its JSR
  surface is self-contained.

### Domain Vocabulary

- `DocsCorpusUnavailableError` — explicit unavailable filesystem corpus state with resolved path.
- `DoctorFamilyResult` — exact family status/counts plus bounded actionable detail.
- `TelemetryOtlpJson` / `TelemetrySpan` / `TelemetryResource` — existing query contract populated
  from the live OTLP envelope.

### Ports

- `TelemetryQueryPort` — unchanged read-model seam consumed by MCP flows.
- `DocsCorpusPort` — unchanged list/search/get seam; infrastructure may throw the named unavailable
  error and flows map it to structured tool failure.
- `ProjectDoctorPort` — unchanged CLI plugin-diagnostics seam.

### Constants

- `MAX_DOCTOR_CHECKS = 20` — published top-level/schema limit.
- `MAX_DOCTOR_FAMILY_CHECKS = 20` — bounded family detail with explicit overflow aggregation.
- `EMBEDDED_MCP_DOC_SLUG = "mcp"` — package-shipped default document.
- `TOOL_NAMES` — unchanged 13-name stable tool vocabulary.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0 | Prove harness research/design and owner waiver | Plan checklist/manual review | run artifacts only |
| 1 | Parse the live Aspire OTLP envelope and prove real MCP telemetry | telemetry + MCP focused tests, live fixture | telemetry adapter/normalizer/tests; MCP fixture/boundary test; run artifacts |
| 2 | Make doctor aggregation schema-safe for the real CLI flow | doctor/CLI composition tests through output schema | doctor flow/contracts/tests; CLI MCP adapter tests; run artifacts |
| 3 | Ship a working embedded docs default and explicit missing-root error | docs/stdio/CLI composition tests + JSR gates | MCP docs infrastructure/flows/cli/README/tests; CLI composition tests; run artifacts |
| 4 | Lock correct-path regressions and record the 13-tool live matrix | focused suites + live matrix + final cleanup E2E | regression tests and run/PR evidence |

### Deferred Scope

- Full website corpus embedding — the package README is the guaranteed useful minimum; a larger
  generated index can be added independently.
- Aspire payload versions not observed in 13.4.6 — existing direct shapes remain supported.
- Archetype-6 v2 migration — governed by accepted debt and unrelated to the live blockers.

### Contributor Path

Dashboard shape changes belong in `packages/telemetry/src/adapters/aspire-query/` and must add a
real-shape fixture regression consumed through `packages/mcp`. New docs defaults belong in MCP
infrastructure and are selected only in `cli.ts`; flows remain corpus-port-only. New doctor families
return checks, while `doctor-flow.ts` alone owns cross-family aggregation and bounds.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-17 | 0 | Research/design | Issue/API, live report, doctrine, package surface, adapters, schemas, and composition re-baselined. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Shared telemetry parser owner | Avoid duplicate/inconsistent external-system adapters. | Doctrine A6/A7; code dependency. |
| Aggregate doctor, do not raise cap | Preserve token discipline and one-shot tool contract. | Issue #808; schema/runner ordering. |
| Embedded README default | Publish-safe guaranteed corpus; explicit overrides remain. | JSR audit and `deno.json` publish list. |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Owner waived evaluator dispatch | significant | yes |
| Existing `./cli` private-type refs discovered | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Pre-change doc lint wrapper | `deno task doc:lint --root packages/mcp --pretty` | PASS with contradictory detail | Wrapper exit 0/combined 0, but per-entry details show 5 private refs. |
| Pre-change raw doc lint | `deno doc --lint packages/mcp/cli.ts` | FAIL | Five existing `private-type-ref` findings recorded for correction. |
| Pre-change package dry-run | `packages/mcp: deno task publish:dry-run` | PASS | No slow types; intended files only. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-CLI-1..31 | NOT_RUN | planned `arch:check` + manual review | Accepted horizontal skeleton debt unchanged. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Live capture | NOT_RUN | planned no-cleanup scaffold | Must precede S1 implementation. |
| 13-tool live matrix | NOT_RUN | planned stdio driver | Acceptance is 13/13. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Scaffold runtime | NOT_RUN | planned final cleanup gate | Canonical one-pass command. |

## Handoff Notes

- Formal evaluators are owner-waived and must not be dispatched.
- Inspect the live-capture provenance and telemetry nesting first, then doctor bounds and docs
  unavailable-state behavior.

