# Plan: `@netscript/mcp` S1 skeleton

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `mcp-skills--orchestrator/s1` |
| Branch | `feat/netscript-mcp-skills-s1-skeleton` |
| Phase | `plan` |
| Target | `packages/mcp` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` (README is package-owned documentation) |

## Archetype and Doctrine Verdict

Archetype 6 is required because the package ships a stdio executable plus a callable library surface. The repository doctrine verdict requires new package work to use role folders, explicit public surfaces, and publishability gates rather than inherit legacy package drift.

## Goal and Scope

Create the contract-first `@netscript/mcp` skeleton: all v1 schemas, enumerable registry, minimal MCP stdio runner, bounded results, doctor reachability flow, public entries, README, and tests.

Non-scope: telemetry aggregation, docs corpus, CLI command execution, endpoint discovery beyond explicit/env/default, skills, CLI registration, scaffold changes, and S2-S9 work.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Minimal zero-dependency JSON-RPC/MCP subset | Current stdio framing is newline-delimited and the three-method subset is small; avoids SDK/catalog/lock churn. |
| D2 | Domain contracts use Standard Schema and JSON Schema metadata | Registry needs runtime validation and MCP `inputSchema`; one contract is authoritative. |
| D3 | `TelemetryProbePort` lives in domain; fetch/env adapters live in infrastructure | Preserves presentation/application purity and makes doctor deterministic in tests. |
| D4 | Registry is immutable enumerable data with a flow reference and kind | Supports later CLI/skill generation without duplicating tool vocabulary. |
| D5 | Non-doctor flows return structured `not_implemented` tool errors with `planned` slice status | Full surface is discoverable without pretending later slices exist. |
| D6 | Runner recursively truncates every successful tool result | Enforces max items and string length at the server boundary. |
| D7 | Root workspace needs no edit because `packages/*` already covers `packages/mcp` | Matches sibling wiring without redundant configuration. |
| D8 | Use the owner-locked horizontal folder law instead of the newer Archetype-6 v2 kernel/vertical shape | This slice is a small protocol engine with one flow and no CLI feature tree; README discloses the deviation and debt `MCP-A6-V2-SHAPE` tracks reconciliation after S7 establishes the CLI surface. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| SDK adoption | resolved now | Zero-dependency subset selected. |
| Exact later tool analytics | safe to defer | Contracts are compact; implementations belong to S2-S6. |
| CLI twin registration | safe to defer | S7 scope. |
| Archetype-6 v2 folder shape | resolved now | Owner brief wins; deviation is documented and debt-registered. |

## Commit Slices

1. Contracts and registry — proves full v1 schema/registry completeness; creates `packages/mcp/{deno.json,README.md,mod.ts}`, `packages/mcp/src/domain/{schema.ts,tool-contracts.ts,tool-types.ts,telemetry-probe-port.ts}`, `packages/mcp/src/application/{tool-registry.ts,flows/planned-flow.ts}`, `packages/mcp/tests/registry_test.ts`; updates `s1/{worklog.md,context-pack.md}`.
2. Runner and doctor — proves protocol lifecycle, reachability, truncation, and stdio round-trip; creates `packages/mcp/cli.ts`, `packages/mcp/src/application/flows/doctor-flow.ts`, `packages/mcp/src/application/runner/{mcp-server.ts,truncation.ts}`, `packages/mcp/src/presentation/json-rpc.ts`, `packages/mcp/src/infrastructure/{fetch-telemetry-probe.ts,stdio-transport.ts}`, `packages/mcp/tests/{doctor_test.ts,stdio_test.ts,truncation_test.ts}`; updates `s1/{worklog.md,context-pack.md,drift.md}` only if facts diverge.
3. Gate evidence and handoff — proves all requested gates; updates only `s1/{worklog.md,context-pack.md,drift.md}`. If a gate fails, corrections are restricted to the named Slices 1-2 files responsible for that diagnostic and are logged before rerunning; scope expansion requires rescope.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Schemas diverge from MCP JSON Schema | Generate JSON Schema metadata from the same contract descriptor and validate registry tests. |
| Stdio protocol contamination | Write only compact JSON-RPC to stdout; diagnostics remain errors/results, never logs. |
| Hanging reachability check | AbortController timeout owned by HTTP adapter. |
| Output explosion | Recursive runner truncation on every success result. |
| Owner folder law differs from Archetype-6 v2 kernel/vertical shape | Add README `Archetype 6 v2 deviations`, register `MCP-A6-V2-SHAPE`, manually assess F-CLI rules, and close/revisit debt when S7 introduces the real CLI surface. |

## Anti-Patterns and Gates

- Avoid AP-1/AP-21 monoliths, AP-11/AP-25 side effects outside infrastructure/edge, AP-19 undocumented permissions, and AP-22 speculative barrels.
- Required evidence: scoped check/lint/fmt wrappers; scoped tests; `arch:check`; full-export doc lint; package publish dry-run; manual F-CLI-1..31 structural review where scripts are pending; consumer import/stdio smoke.
- Architecture debt `MCP-A6-V2-SHAPE` is accepted for the explicit owner-locked folder shape. No other debt is expected.

## Drift Watch

- MCP protocol revision/framing, unexpected workspace wiring needs, SDK necessity, new dependency/lock churn, and any contract that cannot remain compact.
