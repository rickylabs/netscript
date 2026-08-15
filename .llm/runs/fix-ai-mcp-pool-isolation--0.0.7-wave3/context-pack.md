# Context Pack: AI MCP pool failure isolation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-ai-mcp-pool-isolation--0.0.7-wave3` |
| Branch | `fix/ai-mcp-pool-isolation` |
| Current phase | `plan` — blocked before PLAN-EVAL/implementation |
| Archetype | `2 — Integration` (coordinator-frozen leaf profile) |
| Scope overlays | `none` |

## Current State

The defect is reproduced red-first at immutable base `284dda90a`. Pool startup is sequential and
neither the pool nor the default TanStack connector settles when aborted during a never-ending
connect. No source has been changed. The live acceptance criteria require test, docs, port, and
lifecycle files outside the frozen writable surface, so the run stopped for a coordinator
amendment.

## Completed

- Read all requested skills and harness/doctrine authorities.
- Read live issue #1448.
- Verified branch, worktree, immutable base, and absent remote leaf branch.
- Reproduced pool failure isolation and cancellation defects.
- Scanned the current `./mcp` JSR/public surface and upstream TanStack API.
- Recorded `PLAN-EVAL: BLOCKED / not launched`.

## In Progress

- Nothing. The run is intentionally stopped at the frozen-scope boundary.

## Next Steps

1. Topic orchestrator/coordinator decides whether to amend the authorized surface.
2. Resolve the public degraded/status snapshot and cancellable-close contract.
3. If granted, update plan/design and obtain coordinator direction on PLAN-EVAL before implementation.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Stop rather than land a partial fix | user frozen contract | Test/docs/resource-read/close acceptance cannot fit. |
| No `Closes #1448` | netscript-pr + live acceptance | Bootstrap PR does not resolve the issue. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-ai-mcp-pool-isolation--0.0.7-wave3/*` | new | Bootstrap, research, plan, drift, and handoff artifacts. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | RED reproduced; implementation gates NOT_RUN | `research.md`, `worklog.md` |
| Fitness | NOT_RUN | stopped before source changes |
| Runtime | prohibited/no lease | no Aspire/Docker/E2E ran |
| Consumer | NOT_RUN | public contract unresolved |

## Open Questions

- Exact amended file list and public status/close design.

## Drift and Debt

- Drift: significant frozen-surface mismatch recorded in `drift.md`.
- Debt: none created; no implementation landed.

## Commits

- See the draft PR's commit list + per-slice PR comments.

## 2026-08-15 — Amendment update (append-only)

- Coordinator ruling `e2faaab15def77c131806aa6cf565d77bd6fe92c` authorizes exactly eight
  package files and resolves the synchronous snapshot and options-bag cancellation contracts.
- `PLAN-EVAL: N/A`: the amended work is fully specified and mechanical; evaluator separation is
  retained for later Tier-A review and opposite-family IMPL-EVAL.
- Current phase: RED regression slice, before implementation.
- Next: commit the focused healthy + never-settling RED test, then implement each locked slice.
- A ninth package file or new public decision is an immediate drift/stop boundary.

## 2026-08-15 — Slice 2 update (append-only)

- Pool startup/list/reconnect tool collection now settles concurrently per server.
- A caller deadline preserves fulfilled healthy peers, records the stalled peer's error, and closes
  a late successful connection.
- `pool.snapshot` is synchronous and I/O-free, returning readonly `statuses` and `readyClients`
  records keyed by server id; public types are exported through existing `packages/ai/mcp.ts`.
- Focused and full MCP tests, targeted check (`--unstable-kv`), lint, and fmt are green with raw
  exit code `0`.
- Next slice: port/base/TanStack resource-read and close cancellation plus late cleanup.

## 2026-08-15 — Slice 3 blocked update (append-only)

- New exact blocker: published concrete stdio and Streamable-HTTP transports compose the base and
  must explicitly delegate the ruled resource-read and close-options APIs.
- Required amendment: authorize only
  `packages/ai/src/mcp/adapters/stdio-transport.ts` and
  `packages/ai/src/mcp/adapters/streamable-http-transport.ts` in addition to the current eight.
- No slice-3 source edit or gate run occurred. The branch remains at the completed slice-2
  implementation plus this artifact-only stop record.

## 2026-08-15 — Amendment 2 update (append-only)

- The topic orchestrator authorized delegation-only edits to both published concrete transports,
  bringing the exact writable package surface to ten files.
- `readResource` is optional only on `McpTransportPort`, required on the base and published
  transports, and must be proven cancellable through a published path.
- `stop(options?)` is widened on the port and must forward its signal in both published wrappers.
- `packages/fresh` remains read-only/out of scope; its structured cross-package check is mandatory.
- `PLAN-EVAL: N/A` remains locked. Next: committed RED cancellation tests.
