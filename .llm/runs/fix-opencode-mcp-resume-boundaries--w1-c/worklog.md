# Worklog: OpenCode MCP attachment and provider-valid resume

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-opencode-mcp-resume-boundaries--w1-c` |
| Branch | `fix/opencode-mcp-resume-boundaries` |
| Archetype | N/A — internal agentic infrastructure |
| Scope overlays | none |

## Design

### Public Surface

- `prepareOpenCodeEnvironment` — discovers/translates/overlays project MCP and the boundary plugin.
- `normalizeOpenCodeHistory` — pure, idempotent provider-boundary normalization contract.
- `runOpenCodePreflight` — proves MCP server/tool attachment and one harmless docs lookup.
- `runOpenCode` / `opencodeRunArguments` — add explicit session, MCP requirement, and receipt options.
- Local OpenCode plugin default export — runs normalization before every dispatch and records safe
  tool/discovery telemetry.

### Domain Vocabulary

- `ClaudeMcpDocument`, `ClaudeMcpServer` — untrusted generated project declaration shapes.
- `OpenCodeLocalMcpServer`, `OpenCodeConfigOverlay` — validated target configuration.
- `OpenCodeMeasurementRequirement` — expected server/tool and harmless lookup contract.
- `OpenCodePreflightReceipt` — counts/status/call evidence with no content or secrets.
- `OpenCodeStoredMessage`, `OpenCodeStoredPart` — minimal structural history seam.
- `HistoryTransformation`, `HistoryNormalizationReceipt` — event id, reason code, before/after counts.
- `DiscoverySource` — `mcp | public_web | local_docs | generated_source`.

### Ports

- Injectable config filesystem reads/stats — deterministic discovery/malformed fixtures.
- `OpenCodePreflightPort` — bounded server enumeration and direct harmless tool execution.
- Receipt sink/clock — privacy assertions without real filesystem timing in unit tests.

### Constants

- Expected generated server names: `netscript`, `aspire` (acceptance vocabulary, not provider policy).
- History reason codes: `empty_text`, `empty_reasoning`, `empty_assistant`,
  `signed_reasoning_separator_unsafe`.
- Discovery sources: `mcp`, `public_web`, `local_docs`, `generated_source`.
- Volatile model/version/endpoint/provider values remain in `.llm/tools/agentic/config/` and routing
  policy; none are introduced locally.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| S0 | Lock research/design/plan | separate Minimax PLAN-EVAL | run directory |
| S1 | MCP overlay, preflight, telemetry | focused matrix + scoped wrappers + agentic suite | OpenCode/hybrid tooling, tests, task/docs, run artifacts |
| S2 | Resume/history guard | full history matrix + same gates | OpenCode plugin/run/tests/docs, run artifacts |
| S3 | Live receipts and formal evaluation | live MCP/resume, exact-head gates, DeepSeek PASS | run receipts/evaluation/handoff |

### Deferred Scope

- OpenCode V2 API/plugin migration — wait for the pinned tool version to change.
- General host-neutral `.mcp.json` translation library — only OpenCode is defective/currently owned.
- Release/Billing Run — milestone orchestrator authority.

### Contributor Path

Add a supported Claude MCP field in `opencode-project-config.ts` with a matrix row; add a history
part rule in the pure normalizer with an idempotence/provider-switch fixture; add a telemetry source
only through the closed `DiscoverySource` classifier and prove the receipt contains no input/output.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-07 | S0 | Bootstrap/research | Exact clean base and live issues verified; prepared artifacts re-read from coordination commit. |
| 2026-08-07 | S0 | Design | Exact OpenCode 1.17.20 config/plugin/message/server contracts inspected; typed seams locked. |
| 2026-08-07 | S0 | PLAN-EVAL selected | Decision-heavy hook/collision/signature choices require separate Minimax verdict before source work. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| PLAN-EVAL required | Deferring config precedence or signature normalization would force source rework and could corrupt semantics. | research + plan D1–D7 |
| No package archetype | Owned surface is internal harness tooling, not published CLI/package code. | archetype README + owned paths |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Prepared paths/routes/base/lock differ from live run | significant | yes |

## Gate Results

All implementation, runtime, consumer, live, and evaluation gates are `NOT_RUN` until PLAN-EVAL
passes. `deno.lock` baseline SHA-256 is recorded in `research.md`.

## Handoff Notes

- PLAN-EVAL should inspect D3 (config precedence), D5 (signed reasoning/tool ordering), and D7
  (real tool enumeration plus direct docs lookup) first.
