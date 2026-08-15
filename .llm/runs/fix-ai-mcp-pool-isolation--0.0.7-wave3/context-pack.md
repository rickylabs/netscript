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

## 2026-08-15 — Slice 3 cancellation RED update (append-only)

- Published-path cancellation tests are RED with structured raw exit `1` (0 passed, 2 failed).
- Current behavior: published transport has no `readResource`; `stop` ignores the caller signal and
  remains pending beyond the bounded observer.
- Next: port/base/TanStack cancellation plus delegation-only wrapper changes, then cross-package
  Fresh compatibility check.

### Pool teardown RED addendum

- Focused structured pool-stop test raw exit `1`: a hanging server kept `pool.stop()` pending after
  caller abort even though its healthy peer closed.

## 2026-08-15 — Slice 3 green update (append-only)

- Published HTTP/stdio transports now expose and forward cancellable resource-read and stop.
- Base and TanStack layers settle connect/list/call/resource/close on abort; default HTTP fetch sees
  the caller signal, and late connector/close completion is cleaned up without leaking.
- Pool stop settles each server independently.
- Full MCP tests: raw exit `0`, 18 passed. Targeted check/lint/fmt, quality scan, and architecture
  check all exit `0`.
- Mandatory read-only Fresh cross-package check exits `0` across 197 files; its test double remains
  unchanged because the port resource member is optional.
- Next slice: registration cancellation propagation.

## 2026-08-15 — Slice 4 registration RED update (append-only)

- Focused structured test raw exit `1`: `registerMcpTools` ignored caller cancellation and pending
  discovery remained unsettled.
- Next: additive registration/registration-stop options and signal forwarding.

## 2026-08-15 — Slice 4 green update (append-only)

- Registration discovery, registered calls, and registration teardown now forward caller options.
- Existing call sites remain source-compatible through optional/default arguments.
- Full MCP tests raw exit `0` with 20 passing; targeted check/lint/fmt, quality, and architecture
  gates all exit `0`.
- Next: optional/degraded documentation and the complete JSR/publish gate set.

## 2026-08-15 — Slice 5 final gate update (append-only)

- Optional/degraded MCP usage is documented with caller-owned deadlines, synchronous status and
  ready-client selection, targeted retry, and bounded shutdown.
- The TanStack connector now uses literal imports backed by the exact
  `npm:@tanstack/ai-mcp@0.2.1` package pin; publish analysis no longer flags this touched module.
- Final structured gates: AI check `0` (98 files), read-only Fresh check `0` (197 files), AI tests
  `0` (138 passed), AI lint `0`, and AI fmt `0`.
- Final public/fitness gates: `deno doc --lint packages/ai/mcp.ts` `0`, quality scan `0`, architecture
  check `0`, and workspace publish dry run `0` with isolated declarations.
- JSR audit confirms the existing `./mcp` export is reused, all new exports have explicit declared
  types, and touched publishable code contains no runtime asset/`import.meta` reads or unpinned
  internal package imports.
- `deno.lock` remains unchanged. No expensive runtime gate ran.
- `PLAN-EVAL: N/A` remains justified by the two topic-orchestrator rulings: implementation was
  mechanical after the exact ten-file surface and behavioral contracts were specified.
- Implementation-agent work is complete. Stop for topic-orchestrator Tier-A review/sign-off; the
  opposite-family IMPL-EVAL remains evaluator-owned and has not been launched here.

## 2026-08-15 — IMPL-EVAL cycle 1 (separate session, append-only)

- Evaluator: native Claude `claude-fable-5` · medium · Remote Control
  `https://claude.ai/code/session_01Kwmr8XjoznnQsHUnkmfcnV` (session
  `cb917802-ee26-4b89-86b9-0eee33c7de1b`, PID 520689). Canonical `formal_impl_evaluation` lane.
- Evaluated head `e3c74d7aaf3b7734b5a44a5be248c01f004c21e5` (local = origin = PR head).
- Verdict: **`FAIL_FIX`** — see `evaluate.md`. One blocking finding (F-1): registration signal is
  bound to every later registered tool call; README pattern fails after its own startup deadline.
  Contract, rulings 2/5/6, cross-package Fresh check, and all cheap gates re-verified green.
- Next: F-1 RED→GREEN slice inside the authorized surface, then IMPL-EVAL cycle 2. PR stays draft.

## 2026-08-15 — F-1 repair RED (append-only)

- New regression requires a registered tool call to succeed after its registration discovery
  signal aborts; focused structured wrapper raw exit `1` (0 passed, 1 failed with the captured
  `AbortError`).
- Discovery-time cancellation coverage remains intact and separate.
- Next: remove the registration options from the registered-call closure, align README wording,
  run the bounded gate set, and stop for a fresh independent Tier-A review.
