# Plan: AI MCP pool failure isolation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-ai-mcp-pool-isolation--0.0.7-wave3` |
| Branch | `fix/ai-mcp-pool-isolation` |
| Phase | `plan` — blocked before implementation |
| Target | `packages/ai` MCP integration surface |
| Archetype | `2 — Integration` (coordinator-frozen leaf profile) |
| Scope overlays | `none` |

## Archetype

The leaf wraps TanStack MCP behind NetScript-owned connection and transport ports, so the
coordinator selected Archetype 2. The package-wide doctrine table classifies `packages/ai` as
Archetype 4; this run follows the narrower, explicit leaf contract and records the difference.

## Current Doctrine Verdict

`packages/ai`: **Keep** — preserve the engine/port/composition split.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1/A2 | Per-server status and cancellation are published consumer contracts. |
| A7 | Cancellation should use `AbortSignal`, not a bespoke token. |
| A10 | Pool construction remains explicit composition over caller-owned transports. |
| A13 | One MCP server must be an explicit crash boundary, not a pool-wide failure. |
| A14 | Red-first regression coverage and publish gates must prove the contract. |

## Goal

Make optional MCP infrastructure failure-isolated and cancellation-aware while preserving healthy
peers and exposing immediate per-server status. The current frozen surface cannot deliver that goal
in full.

## Scope

- Frozen implementation files:
  - `packages/ai/src/mcp/adapters/tanstack-connector.ts`
  - `packages/ai/src/mcp/application/pool.ts`
  - `packages/ai/src/mcp/application/register-tools.ts`
- Harness run artifacts under this run directory.

## Non-Scope

- No Aspire, Docker, browser, CLI E2E, or scaffold runtime gates without a fresh lease.
- No changes outside the frozen files without a coordinator amendment.

## Hidden Scope

- The live acceptance criteria require a test, documentation, resource-read cancellation,
  cancellable close, and a public degraded/error snapshot. These cross the frozen boundary.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Stop before implementation and request a surface amendment. | The user explicitly forbids inferring authority outside the three files. |
| D2 | Do not use `Closes #1448` on the blocked draft PR. | This bootstrap does not fully resolve the live issue. |
| D3 | Preserve per-server identity and use Web Platform cancellation after amendment. | Archetype 2 and doctrine A7/A13. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact public degraded/error snapshot shape | must resolve now | Affects `./mcp` public surface and isolated declarations. |
| Whether `close`/`stop` gains caller options or cancellation remains internal | must resolve now | Current ports expose no signal on close/stop. |
| Exact amended test/docs/port surface | must resolve now | Coordinator authority required. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Partial implementation appears to satisfy #1448 | Stop now; use a non-closing issue reference and record remaining acceptance. |
| Late TanStack success leaks a session | Require a regression test and lifecycle/base-transport amendment before implementation. |
| New public types fail isolated declarations or are not exported | Include `packages/ai/mcp.ts`, doc lint, JSR audit, and publish dry run in amended scope. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-9 | risk | Avoid a generic flag-heavy cancellation helper. |
| AP-10 | risk | Isolate expected per-server failure without swallowing status/error evidence. |
| AP-19 | risk | Document network/cancellation behavior in the public MCP usage surface. |
| AP-25 | risk | Keep TanStack/network effects in the adapter. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-3/F-5/F-6/F-7/F-10/F-19 and Archetype-2 matrix | yes after amendment | structured wrappers, doc lint, JSR audit, publish dry run, arch check |
| Code quality | yes after amendment | `deno task quality:scan` and `deno task arch:check` |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| none | none yet | No implementation or new debt landed. |

## Validation Plan

The proving gates remain `check`, `test`, `publish-dry-run`, and `arch-check`, plus scoped lint/fmt,
`quality:scan`, doc lint, and the package JSR audit. They are intentionally `NOT_RUN` until the
coordinator amends the surface and implementation exists.

## Drift Watch

- Any attempt to satisfy the test, docs, resource-read, close, or public-status acceptance inside
  only the three frozen files would be a partial/hidden surface change and must remain blocked.

## 2026-08-15 — Amended plan (append-only)

The coordinator ruling at `e2faaab15def77c131806aa6cf565d77bd6fe92c` resolves the recorded
blocker without changing the prior decision record.

- Exact writable package surface: the original three files plus
  `packages/ai/tests/mcp_test.ts`, `packages/ai/src/ports/mcp-transport.ts`,
  `packages/ai/src/mcp/adapters/base-transport.ts`, `packages/ai/mcp.ts`, and
  `packages/ai/README.md`.
- Public contract: a synchronous I/O-free readonly snapshot keyed by `serverId`, using
  `McpConnectionState`, retaining `lastError`, and exposing ready clients alongside statuses.
- Lifecycle contract: an options bag carrying `signal` for resource-read and close/stop;
  per-server startup/stop settlement; late-success cleanup.
- Denied scope: any ninth package file, a new `deno.json` export, consumer-side EIS-Chat changes,
  or changes in another package.
- Slices: (1) committed RED regression, (2) pool settlement + snapshot, (3) resource/close
  cancellation, (4) registration propagation, and (5) docs + full gates.
- Gates: structured check/test/lint/fmt, quality scan, architecture check, JSR audit,
  `deno doc --lint packages/ai/mcp.ts`, and publish dry run.

`PLAN-EVAL: N/A`. The amendment fixes the exact surface, public semantics, lifecycle vocabulary,
cancellation convention, settlement behavior, public entrypoint, documentation, and gates. No
decision-heavy question remains; Tier-A review and opposite-family IMPL-EVAL remain external.

Any required edit beyond the amended eight package files is new drift and an immediate stop.

## 2026-08-15 — Amendment 2 plan re-lock (append-only)

The topic orchestrator's second ruling expands the writable surface to exactly ten package files by
adding delegation-only edits in `stdio-transport.ts` and `streamable-http-transport.ts`.

- `McpTransportPort.stop(options?)` is widened; existing zero-argument implementors remain valid.
- `McpTransportPort.readResource?` is optional to preserve the out-of-scope Fresh test double.
- `BaseMcpTransport` and both published concrete transports require and implement cancellable
  `readResource(options?)` and `stop(options?)` behavior.
- Tests must prove abort settlement through a published transport, not merely type availability.
- A structured cross-package `packages/fresh` check is mandatory before completion.
- `packages/fresh` is read-only evidence and remains outside writable scope.

`PLAN-EVAL: N/A` remains appropriate. Amendment 2 specifies the exact type shape, implementation
locations, behavioral proof, compatibility gate, and forbidden workaround. No open design decision
remains. Tier-A review and opposite-family IMPL-EVAL remain external.
