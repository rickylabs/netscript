# Worklog: fix #808 MCP live-validation blockers

## Run Metadata

| Field          | Value                                |
| -------------- | ------------------------------------ |
| Run ID         | `fix-808-mcp-live-defects--mcp-live` |
| Branch         | `fix/808-mcp-live-defects`           |
| Archetype      | `6 — CLI / Tooling`                  |
| Scope overlays | `none`                               |

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

| # | Slice                                                                | Gate                                               | Files                                                                                |
| - | -------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 0 | Prove harness research/design and owner waiver                       | Plan checklist/manual review                       | run artifacts only                                                                   |
| 1 | Parse the live Aspire OTLP envelope and prove real MCP telemetry     | telemetry + MCP focused tests, live fixture        | telemetry adapter/normalizer/tests; MCP fixture/boundary test; run artifacts         |
| 2 | Make doctor aggregation schema-safe for the real CLI flow            | doctor/CLI composition tests through output schema | doctor flow/contracts/tests; CLI MCP adapter tests; run artifacts                    |
| 3 | Ship a working embedded docs default and explicit missing-root error | docs/stdio/CLI composition tests + JSR gates       | MCP docs infrastructure/flows/cli/README/tests; CLI composition tests; run artifacts |
| 4 | Lock correct-path regressions and record the 13-tool live matrix     | focused suites + live matrix + final cleanup E2E   | regression tests and run/PR evidence                                                 |

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

| Time       | Slice | Step                     | Notes                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------- | ----- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-17 | 0     | Research/design          | Issue/API, live report, doctrine, package surface, adapters, schemas, and composition re-baselined.                                                                                                                                                                                                                                                                                                      |
| 2026-07-17 | 1     | Live scaffold            | Canonical no-cleanup run passed 58/58; detached restart died with its invocation, so capture continues on the validator-proven foreground transport.                                                                                                                                                                                                                                                     |
| 2026-07-17 | 1     | Live capture             | Fresh trigger returned `{"jobId":"health-check","triggered":true}`; Dashboard capture has `data,totalCount,returnedCount`, 2 resource groups, 8 scopes, 17 spans. Plain Deno TLS fails `UnknownIssuer`; custom client with the generated localhost PEM succeeds.                                                                                                                                         |
| 2026-07-17 | 1     | Telemetry implementation | Shared adapter now unwraps `data`, flattens `resourceSpans/scopeSpans/spans`, carries resource identity, and decodes OTLP kinds; MCP trusts discovered ASP.NET PEMs for loopback HTTPS only. Exact 13.4.6 captures are checked in as fixtures.                                                                                                                                                           |
| 2026-07-17 | 1     | Telemetry verification   | Telemetry package check + 52 tests and MCP package check + 41 tests pass. Direct query against the live Dashboard returns 21 spans, 11 resources, services `workers/workers-api`, and internal/producer/consumer/server kinds.                                                                                                                                                                           |
| 2026-07-17 | 2     | Doctor contract          | Preserved the 20-check cap: top-level checks are family aggregates, family detail keeps 19 checks plus an explicit worst-severity overflow summary, and counts/status cover every original check. The real CLI-composed doctor with 25 plugin checks and direct schema validation both pass. MCP check + 42 tests pass.                                                                                  |
| 2026-07-17 | 3     | Docs composition         | CLI composition now indexes the package-shipped README as slug `mcp`; explicit flag/environment roots select the filesystem adapter. Missing or Markdown-empty overrides return `docs_corpus_not_found` with the resolved path and `--docs-root` remediation. MCP check + 45 tests, raw `deno doc --lint packages/mcp/cli.ts`, publish dry-run, and `arch:check` pass.                                   |
| 2026-07-17 | 4     | Correct-path regression  | CLI composition test now asserts the exact 13-name order, populated `list_commands`, allowed `plugin list`, denied-before-spawn `deploy`, and the 25-check doctor path.                                                                                                                                                                                                                                  |
| 2026-07-17 | 4     | Live re-validation       | Local maintainer CLI over newline stdio returned 13/13 tool PASS. Telemetry observed 11 resources / 42 spans; two runs; successful `get_run`; fresh job found; performance had 15 samples; docs list/search/get used slug `mcp`; commands returned 100; allowed plugin list exited 0 and deploy hit `deny_deploy`. Doctor returned a schema-valid four-family diagnostic with four top-level aggregates. |

### Live tool matrix — 2026-07-17

| Tool                          | Evidence                                                       | Verdict |
| ----------------------------- | -------------------------------------------------------------- | ------- |
| `get_app_status`              | `pass`; 11 resources; 42 spans                                 | PASS    |
| `list_runs`                   | 2 runs; fresh `health-check` present                           | PASS    |
| `get_run`                     | live run returned 13 spans                                     | PASS    |
| `get_recent_errors`           | valid empty result for the healthy run                         | PASS    |
| `get_last_job_result`         | `found:true`, completed health-check trace                     | PASS    |
| `analyze_service_performance` | 15 samples, 5 operations for `workers`                         | PASS    |
| `analyze_db_bottlenecks`      | valid bounded zero-sample result for this workload             | PASS    |
| `doctor`                      | schema-valid; 4 aggregates / 4 families; telemetry family pass | PASS    |
| `search_docs`                 | 1 match, slug `mcp`                                            | PASS    |
| `list_docs`                   | 1 package-shipped document, slug `mcp`                         | PASS    |
| `get_doc`                     | successful `mcp` retrieval, bounded content                    | PASS    |
| `list_commands`               | 100 live CLI descriptors                                       | PASS    |
| `execute_command`             | `plugin list` exit 0; `deploy` denied by `deny_deploy`         | PASS    |

## Decisions

| Decision                                   | Reason                                                          | Source                                  |
| ------------------------------------------ | --------------------------------------------------------------- | --------------------------------------- |
| Shared telemetry parser owner              | Avoid duplicate/inconsistent external-system adapters.          | Doctrine A6/A7; code dependency.        |
| Aggregate doctor, do not raise cap         | Preserve token discipline and one-shot tool contract.           | Issue #808; schema/runner ordering.     |
| Embedded README default                    | Publish-safe guaranteed corpus; explicit overrides remain.      | JSR audit and `deno.json` publish list. |
| Trust local Dashboard CA, never bypass TLS | Live Deno transport otherwise degrades to empty before parsing. | Live capture and security boundary.     |

## Drift

| Drift                                         | Severity    | Logged in drift.md |
| --------------------------------------------- | ----------- | ------------------ |
| Owner waived evaluator dispatch               | significant | yes                |
| Existing `./cli` private-type refs discovered | minor       | yes                |

## Gate Results

### Static Gates

| Gate                        | Command or check                                  | Result                         | Notes                                                                 |
| --------------------------- | ------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------- |
| Pre-change doc lint wrapper | `deno task doc:lint --root packages/mcp --pretty` | PASS with contradictory detail | Wrapper exit 0/combined 0, but per-entry details show 5 private refs. |
| Pre-change raw doc lint     | `deno doc --lint packages/mcp/cli.ts`             | FAIL                           | Five existing `private-type-ref` findings recorded for correction.    |
| Pre-change package dry-run  | `packages/mcp: deno task publish:dry-run`         | PASS                           | No slow types; intended files only.                                   |

### Fitness Gates

| Gate        | Result  | Evidence                             | Notes                                        |
| ----------- | ------- | ------------------------------------ | -------------------------------------------- |
| F-CLI-1..31 | NOT_RUN | planned `arch:check` + manual review | Accepted horizontal skeleton debt unchanged. |

### Runtime Gates

| Gate                | Result  | Evidence                    | Notes                           |
| ------------------- | ------- | --------------------------- | ------------------------------- |
| Live capture        | NOT_RUN | planned no-cleanup scaffold | Must precede S1 implementation. |
| 13-tool live matrix | NOT_RUN | planned stdio driver        | Acceptance is 13/13.            |

### Consumer Gates

| Consumer         | Result  | Evidence                   | Notes                       |
| ---------------- | ------- | -------------------------- | --------------------------- |
| Scaffold runtime | NOT_RUN | planned final cleanup gate | Canonical one-pass command. |

## Handoff Notes

- Formal evaluators are owner-waived and must not be dispatched.
- Inspect the live-capture provenance and telemetry nesting first, then doctor bounds and docs
  unavailable-state behavior.
