# Worklog: S9 Phase A

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-aspire-13-5-s9-skills-mcp-alignment--impl` |
| Branch | `fix/aspire-13-5-s9-skills-mcp-alignment` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | `docs` (shipped skill prose only) |

## Design

### Public Surface

- `GATE.AGENT_ASPIRE_MCP_SMOKE` — stable E2E gate identifier.
- `createAspireMcpSmokeGate()` — suite gate definition.
- Injectable MCP transport/session contract — unit-test seam for recorded JSON-RPC fixtures.

### Domain Vocabulary

- `AspireMcpSmokeReceipt` — exact persisted proof schema.
- `AspireMcpTranscriptEntry` — redacted request/response event.
- `AspireMcpTransport` — bounded initialize/list/call/close session behavior.
- `AspireMcpSmokeDependencies` — gate-edge filesystem, command, clock, and transport injection.

### Ports

- Injectable JSON-RPC transport — required to test timeouts, partial receipts, and recorded
  transcripts without starting a live server.
- Gate dependencies — keep filesystem/process IO at the runtime/gate edge.

### Constants

- `AGENT_ASPIRE_MCP_SMOKE = 'agent.aspire-mcp-smoke'`.
- Expected 15-tool set, 13.4.6 14-tool baseline, dashboard-only 3-tool set.
- Lifecycle deadlines: 30s initialize, 10s list, 30s call, 120s whole gate, 10s graceful close,
  5s SIGTERM grace.
- Upstream workflow skills: `aspire-init`, `aspire-orchestration`, `aspire-monitoring`,
  `aspire-deployment`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Lock RED tests and implement the injectable MCP smoke gate, partial receipt, transcript, and both-tier registration | focused E2E wrapper tests + `quality:scan` + `arch:check` | `packages/cli/e2e/**`, run artifacts |
| 2 | Align canonical Aspire skill and agent-init generator contract, then regenerate all derived mirrors/assets/corpora/dogfood | focused init tests + generator checks + acceptance grep | `skills/**`, `packages/cli/src/**`, generated outputs, run artifacts |
| 3 | Close Phase-A static/fitness/consumer gate set and write docs-audit request | full listed Phase-A gates | run receipts/artifacts and any gate-only fixes |

### Deferred Scope

- Phase-B live receipt and dashboard-only observation — requires the supervisor's serialized lease.
- Public docs — S11.

### Contributor Path

Add or amend MCP assertions in the smoke evaluator module, extend the recorded transcript fixture,
then verify ordering in the suite registry test. Update agent prose only in `skills/aspire/SKILL.md`
or the canonical generator source and run the documented generators.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-30 | bootstrap | complete | Clean required baseline; contract and skill chain read; no runtime started. |
| 2026-08-30 | 1 | RED | Focused test failed on the intentionally missing MCP smoke module (`TS2307`). |
| 2026-08-30 | 1 | static receipt | One no-AppHost MCP session captured 13.5.3 identity, doctor, and a truthful 14-tool surface; zero-state checks remained clean. |
| 2026-08-30 | 1 | implementation | Added injectable JSON-RPC transport/evaluator, exact semantic receipt and redacted transcript, durable lifecycle wrapper, explicit runtime skip, both-tier suite ordering, and agent-init prerequisite. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Inherit external Plan-Gate | Supervisor already ran two separate PLAN-EVAL cycles and dispatched this exact contract | supervisor plan + owner prompt |
| JSR publish audit is N/A for the new gate | `packages/cli/e2e` is unpublished and the gate is not exported by `@netscript/cli` | `packages/cli/e2e/deno.json` / `mod.ts` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| `rtk` unavailable on host | minor | yes |
| 13.5.3 static MCP lacks locked `get_integration_docs` | significant | yes |
| First scoped-check wrapper flag was redundant/invalid | minor | yes |

## Gate Results

| Gate | Result | Notes |
| --- | --- | --- |
| Focused MCP + suite registry tests | PASS | 25 passed, 0 failed |
| Scoped Deno check | PASS | 11 files, 0 diagnostics; wrapper supplied `--unstable-kv` |
| Explicit runtime-absent path | SKIPPED as designed | durable lifecycle receipt contains the concrete missing `aspire-start.json` reason |
| `quality:scan` | PASS | zero findings |
| `arch:check` | PASS | exit 0; pre-existing repository warnings only |

## Handoff Notes

- Supervisor/evaluator should inspect lifecycle cleanup, partial receipt persistence, redaction, and
  explicit skip registration before generated prose.
