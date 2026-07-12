# Worklog: `@netscript/mcp` S5

## Design

### Public Surface

- Existing `mod.ts` and `cli.ts` remain the only entrypoints; no CLI command is added.
- Existing `doctor` gains bounded family attribution while preserving flattened checks/counts/status/endpoint.
- Composition accepts injected family ports; S7 can supply the real plugin doctor adapter without MCP importing CLI.

### Domain Vocabulary

- `DoctorCheckFamily`: stable family name plus asynchronous `check(context)` returning `DoctorCheck[]`.
- `DoctorFamilyResult`: family name, worst status, severity counts, bounded checks.
- `DoctorContext`: project root and whether telemetry endpoint configuration was explicit.
- `ProjectDoctorPort`: NetScript plugin/project diagnostic reports supplied by the outer CLI composition.
- Fixed family names: `telemetry`, `aspire`, `project`, `plugins`.

### Ports and Adapters

- Telemetry family consumes existing `TelemetryProbePort` and shared endpoint environment.
- Aspire infrastructure wraps the upstream `inspectAspire()` function directly.
- Project infrastructure owns filesystem reads; tests use temporary fixture roots.
- Plugin family consumes `ProjectDoctorPort`; the default stub reports S7 injection pending.
- Composition root is `cli.ts`; application imports no infrastructure.

### Constants

- Severity rank: pass 0, warn 1, fail 2.
- Family names: telemetry, aspire, project, plugins.
- Default project root: `Deno.cwd()` at the composition edge.
- Plugin configuration marker: `netscript.config.ts` containing a `plugins` property; generated registry authority: `.netscript/generated/plugins.ts`, derived from current CLI host-loader fixtures and registry adapter paths.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | family contracts, aggregation, telemetry semantics | focused doctor tests + scoped check | doctor family domain/application files, `doctor-flow.ts`, `tool-contracts.ts`, runner seam, tests, artifacts |
| 2 | Aspire/project/plugin families + composition/docs | fixture family tests + all MCP tests | named ports/adapters, fixtures/tests, `deno.json`, `cli.ts`, README, artifacts |
| 3 | final gate evidence | requested full gate set | artifacts; bounded diagnostic fixes only |

### Deferred Scope

S7 real CLI plugin-doctor adapter, analytics, docs tools, command execution, new CLI commands, generic Aspire environment checks, and live-app requirements.

### Contributor Path

Add a family by implementing the narrow `DoctorCheckFamily` port, keeping side effects in infrastructure, binding it at `cli.ts`, and adding fixture/fake tests. Family failures become bounded checks rather than escaping the aggregate flow.

## Progress Log

| Date | Phase | Evidence |
| --- | --- | --- |
| 2026-07-12 | bootstrap/research | Supervisor-corrected baseline `dd89ced9` verified; required skills/doctrine/harness read; Aspire and CLI doctor APIs inspected with `deno doc` and focused source. |
| 2026-07-12 | plan gate | Separate opposite-family PLAN-EVAL cycle 1 passed all eight checklist items. |
| 2026-07-12 | slice 1 | Added family contracts, aggregation, shared telemetry family, explicit-endpoint severity, and failure isolation. |
| 2026-07-12 | slice 2 | Added real Aspire wrapper, fixture-driven project wiring, S7 plugin-doctor injection seam/stub, CLI composition, README permissions, and workspace dependency. |
| 2026-07-12 | slice 3 | Required static, architecture, docs, publish, and consumer gates passed. |

## Gate Results

| Gate | Result | Evidence |
| --- | --- | --- |
| scoped check | PASS | 44 TypeScript files, 0 occurrences, exit 0 |
| scoped lint | PASS | 41 source/test files (fixture sources excluded), 0 occurrences, exit 0; direct lint also checked all 44 |
| scoped fmt | PASS | 41 source/test files (fixture sources excluded), 0 findings, exit 0 |
| MCP tests | PASS | 26 passed, 0 failed; fixture/fake families and stdio permissions covered |
| root `arch:check` | PASS | exit 0; unrelated pre-existing dependency/doctrine warnings only |
| direct MCP doctrine | PASS | `FAIL=0 WARN=0`; informational architecture-doc threshold only |
| full-export doc lint | PASS | 2 entrypoints, 0 errors/private refs/missing docs |
| MCP package publish dry-run | PASS | 33 intended files, no slow types, exit 0 |
| workspace publish dry-run | PASS | exit 0; unrelated existing dynamic-import warnings only |
| consumer smoke | PASS | public import + server construction; output `tools=13`, exit 0 |

F-1..F-12 and F-15..F-19: PASS via wrappers, direct doctrine, docs, publish, tests, and inspection where automated coverage exists. F-13 N/A (no durable runtime). F-14 PASS (no console output). F-CLI command/tree/template rules remain N/A under accepted `MCP-A6-V2-SHAPE`; applicable layering, side-effect, composition, permission, surface, and test-shape rules PASS. No new debt introduced.
