# Worklog: `@netscript/mcp` S1

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `mcp-skills--orchestrator/s1` |
| Branch | `feat/netscript-mcp-skills-s1-skeleton` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Design

### Public Surface

- `mod.ts`: tool registry, server factory, truncation policy, server/tool/domain public types.
- `cli.ts`: stdio executable entry and callable `runMcpStdioServer`.

### Domain Vocabulary

- `ToolName`, `ToolKind`, `ToolDefinition`, `ToolFlow`, `ToolExecutionResult`.
- Per-tool input/output contracts for all 13 v1 tools.
- `DoctorStatus`, `DoctorCheck`, `DoctorResult`, `TelemetryProbePort`.
- JSON-RPC request/response and MCP initialize/list/call payloads.

### Ports and Adapters

- `TelemetryProbePort` is the sole S1 external dependency seam.
- `FetchTelemetryProbe` owns fetch and timeout; environment endpoint resolution remains infrastructure.
- Newline stdio transport owns Deno streams and compact JSON serialization.

### Constants

- `TOOL_NAMES`, `TOOL_KINDS`, `MCP_PROTOCOL_VERSION`, `DEFAULT_TELEMETRY_ENDPOINT`, `DEFAULT_TRUNCATION_POLICY`, `PLANNED_SLICE`.
- No spine or layer-2 abstract classes, extension axes, registries-as-extension-points, templates, CLI command names, exit codes, or output renderers are introduced. The owner-locked horizontal shape is an explicit Archetype-6 v2 deviation tracked as `MCP-A6-V2-SHAPE`, not an assertion of full v2 conformance.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Full contracts + enumerable registry | registry/schema tests and scoped check | `deno.json`, `README.md`, `mod.ts`, `src/domain/{schema,tool-contracts,tool-types,telemetry-probe-port}.ts`, `src/application/tool-registry.ts`, `src/application/flows/planned-flow.ts`, `tests/registry_test.ts`, run artifacts |
| 2 | stdio runner + doctor v0 | unit tests and spawned round-trip smoke | `cli.ts`, `src/application/flows/doctor-flow.ts`, `src/application/runner/{mcp-server,truncation}.ts`, `src/presentation/json-rpc.ts`, `src/infrastructure/{fetch-telemetry-probe,stdio-transport}.ts`, `tests/{doctor,stdio,truncation}_test.ts`, run artifacts |
| 3 | merge-readiness evidence | all requested validation gates | run artifacts only; diagnostic fixes stay within the responsible Slice 1-2 file |

### Deferred Scope

S2-S9 implementations, CLI/skill twins, docs indexing, telemetry analytics, command execution, scaffold output, and advanced endpoint discovery.

### Contributor Path

Add or refine a tool contract in `src/domain/tool-contracts.ts`, bind exactly one flow in `src/application/tool-registry.ts`, implement external effects behind a domain port in infrastructure, and prove behavior through registry plus protocol tests.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-12 | plan | research/design | Re-baselined at `7c800e74`; zero-dependency current-spec stdio decision locked. |
| 2026-07-12 | 1 | contracts/registry | Added all 13 Standard-Schema contracts and immutable registry; PLAN-EVAL cycle 2 passed before implementation. |
| 2026-07-12 | 2 | runner/doctor | Added newline stdio initialize/list/call, recursive truncation, fetch probe, doctor flow, and round-trip tests. |
| 2026-07-12 | 3 | gates | All requested gates passed; doc-lint diagnostics corrected within owned files. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| newline-delimited stdio | current MCP stdio specification | MCP transport spec + plan D1 |
| no SDK dependency | lean three-method subset | design §6 + Deno toolchain rules |

## Gate Results

### Static Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| scoped check | PASS | 18 files, 0 occurrences, exit 0 |
| scoped lint | PASS | 18 files, 0 occurrences, exit 0 |
| scoped fmt | PASS | 18 files, 0 findings, exit 0 |
| package tests | PASS | 7 passed, 0 failed, including schema-negative, invalid-output, and spawned stdio smoke |
| full-export doc lint | PASS | 2 entrypoints, 0 errors/private refs/missing docs |
| package publish dry-run | PASS | `@netscript/mcp@0.0.1-beta.8`, clean intended 16-file publish set, no slow types |

### Fitness and Runtime Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| requested `deno task arch:check` | PASS | exit 0; pre-existing catalog/doctrine warnings only |
| direct `packages/mcp` doctrine check | PASS | FAIL=0 WARN=0; informational architecture-doc threshold only |
| F-CLI-1..31 | PENDING_SCRIPT / manual PASS where applicable | presentation/application/adapter files below caps; no Cliffy, base classes, composition, templates, command tree, extension axes, console, process spawning, or forbidden folders; accepted shape deviation `MCP-A6-V2-SHAPE` |
| doctor runtime | PASS | explicit/env/default resolution implemented; unreachable endpoint returns structured warn + fix |
| stdio consumer | PASS | initialize → tools/list (13) → doctor round trip, exit 0 |

## Drift

- Initial PLAN-EVAL failed on the Archetype-6 v2 shape conflict; D8, README disclosure, and debt `MCP-A6-V2-SHAPE` resolved it before implementation. Cycle 2 passed.
- Root workspace already uses `packages/*`; no root `deno.json` edit was necessary.
- `deno.lock` gained only the new workspace-member dependency record (6 lines), required by the genuine Standard-Schema/test imports; no reload or cache deletion occurred.

## Reconcile Notes

- Slice 1/2: issue #725 remains partial umbrella work, so no closing keyword is used. User explicitly prohibited opening a PR; commit/push is the trail for supervisor review.

## Handoff Notes

- Inspect `tool-contracts.ts`, `tool-registry.ts`, and `mcp-server.ts` first. All later-slice tools deliberately return `not_implemented` with status `planned`.
- IMPL-EVAL cycle 1 found permissive runtime schemas. The bounded correction now recursively enforces the advertised JSON-Schema subset and validates successful outputs; cycle 2 independently returned PASS.
