# Worklog: AI MCP pool failure isolation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-ai-mcp-pool-isolation--0.0.7-wave3` |
| Branch | `fix/ai-mcp-pool-isolation` |
| Archetype | `2 — Integration` |
| Scope overlays | `none` |

## Design

### Public Surface

- Existing `createMcpTransportPool` / `McpTransportPool` — pool composition and lifecycle.
- Existing `registerMcpTools` — registry bridge; needs caller cancellation.
- Required but unresolved: immediate per-server ready/status/error snapshot and resource-read/close
  cancellation.

### Domain Vocabulary

- Per-server lifecycle snapshot — required public vocabulary; exact type is blocked on scope amendment.
- Ready client/transport — a server whose connection can serve cached tools without network IO.
- Degraded server — addressable server identity plus retained failure evidence.

### Ports

- Existing `McpTransportPort` / `McpClientConnection` — missing resource-read and cancellable-close
  operations required by the live issue.

### Constants

- Existing MCP connection-state vocabulary is insufficient to retain a degraded error without a
  pool-owned snapshot or a port change; no new constants were introduced.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0 | Bootstrap research and record the scope blocker | red-first reproduction | run artifacts only |
| 1 | Failure-isolated concurrent pool startup and per-server status | focused RED test + check | blocked pending amended pool/test/public surface |
| 2 | Pending-operation cancellation and late-success cleanup | focused connector/port tests + check | blocked pending amended connector/base/ports/test surface |
| 3 | Registration cancellation and documentation | focused registry test + doc lint | blocked pending amended register/test/docs surface |

### Deferred Scope

- All implementation is deferred until the coordinator amends the frozen file surface.

### Contributor Path

After amendment, begin at `packages/ai/mcp.ts`, follow the public port to `src/mcp/application/pool.ts`,
and then the external boundary at `src/mcp/adapters/tanstack-connector.ts`.

### Amended Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0.1 | Re-lock plan after coordinator ruling | artifact consistency | run artifacts only |
| 1 | Commit healthy + never-settling RED regression | structured focused test, expected RED | test + run artifacts |
| 2 | Per-server pool settlement and public snapshot | focused test, check, lint, fmt | pool, port, entrypoint, tests + artifacts |
| 3 | Resource-read/close cancellation and late cleanup | focused test, check, lint, fmt | port, base, TanStack, tests + artifacts |
| 4 | Registration cancellation propagation | focused test, check, lint, fmt | registration, tests + artifacts |
| 5 | Optional/degraded docs and full proving gates | all contract/JSR gates | README + artifacts |

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-15 10:32 CEST | 0 | bootstrap | Verified branch/head/base and read live issue #1448. |
| 2026-08-15 10:37 CEST | 0 | research | Reproduced sequential failure, non-settling pool abort, and non-settling TanStack connect abort red-first. |
| 2026-08-15 10:40 CEST | 0 | scope gate | Found required test/docs/port/base-transport changes outside the frozen three-file surface; stopped before source edits. |
| 2026-08-15 | 0.1 | scope ruling | Read committed `scope-ruling.md`; exact eight-file package surface and public contract are now authorized. |
| 2026-08-15 | 0.1 | plan re-lock | Recorded `PLAN-EVAL: N/A`; all prior RED evidence remains immutable and implementation can proceed mechanically. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| `PLAN-EVAL: BLOCKED / not launched` | The contract cannot express the live acceptance fix. The brief requires a stop and coordinator-granted amendment rather than opening an evaluator. | user contract; research findings |
| Do not implement a partial three-file fix | It would leave explicit acceptance criteria unsatisfied and falsely imply issue closure. | live issue #1448 |
| `PLAN-EVAL: N/A` after amendment | The ruling fixes the public shape, cancellation convention, exact surface, lifecycle behavior, and gates; no decision-heavy question remains. | committed `scope-ruling.md` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Live acceptance requires files outside frozen surface | significant | yes |
| Package-wide doctrine says Archetype 4 while leaf contract says Archetype 2 | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| red-first pool stall | `deno eval --unstable-kv ...` | RED reproduced · raw exit 0 | pending after abort; healthy connects 0 |
| red-first pool rejection | `deno eval --unstable-kv ...` | RED reproduced · raw exit 0 | rejected; healthy connects 0 |
| red-first TanStack connect abort | `timeout 3s deno eval --unstable-kv ...` | RED reproduced · raw exit 124 | abort fired; connector never settled |
| check/test/lint/fmt | structured wrappers | NOT_RUN | No implementation; stopped at scope boundary. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| quality:scan / arch:check | NOT_RUN | scope stop | No source changed. |
| JSR audit / publish dry run | NOT_RUN | research surface scan only | Full fix/public surface not authorized. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Aspire/Docker/browser/E2E | NOT_RUN | no lease | Explicitly prohibited. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| EIS-Chat migration contract | NOT_RUN | scope stop | Requires completed public snapshot/cancellation contract. |

## Handoff Notes

- Exact blocker: coordinator amendment to the writable file surface and the public status/close
  contract decision.
- This agent has not self-certified, launched PLAN-EVAL/IMPL-EVAL, or run expensive gates.

## Amendment Handoff Update

- The former scope blocker is resolved by commit `e2faaab15def77c131806aa6cf565d77bd6fe92c`.
- Next action is the committed RED regression slice; no implementation source has yet changed.
- No Aspire, Docker, browser, scaffold runtime, or CLI E2E command has run.
