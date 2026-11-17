# Saga SSE implementation lane

## Bootstrap and research

Issue2637 read in full. Fresh origin/main b0eb079575968e843b781579673c9fe2ae250e07 fetched before this branch/checkout and product diagnosis. Branch fix/saga-event-feed targets main directly. Owner-selected CodexSol/xhigh implementation session handles its own research/design; only mandatory separate evaluators may be delegated. Feature tier for ordered durable feed/replay/gap design; Archetype3 behavior, folding KV integration2 and plugin5. Doctrine/harness/pr/tools/deno-toolchain/jsr-audit apply. No product source change before independent Plan-Gate.

MCP guidance/search consulted, then native deno doc and focused current-main source. Existing subscribe assigns per-connection ids, calls watchPrefix with100ms polling and deletes events after yield; publish writes random per-event keys. Native oRPC ProcedureHandlerOptions includes lastEventId, so header resume can use the upstream seam. Existing portable KV atomic/fixed-key watch(initial:true)/ready capabilities inspected before designing a replacement.

Next: genuine HTTP fanout/slow-reader/resume and idle-scan red oracles on unchanged product source; finalize retention/cursor/backend/failure decisions and per-slice file groups, then feature PLAN-EVAL. Do not edit transports or use Redis Streams. Worker implementation in PR2645 has independent PASS and no further source changes; its supported external Postgres-only rerun remains pending.


## Red HTTP oracles on unchanged product source

Structured event-feed-http_test.ts:0pass/4fail/0ignored. Fast-client control sees all six events, concurrent paused reader times out; resident sees all three, native Last-Event-ID reconnect misses consumed events; idle native KV list spy sees4calls/350ms;300HTTP200publications leave300keys. Real Hono/oRPC/nativeDenoKV and production event writer, no mocked log/watch/runner path. All readers/controllers/KV closed. Fixed only a test timer type before behavioral execution; not counted as product red. Main source still unchanged. Measured doc-lint baseline core7/plugin30 with exact per-entrypoint counts private, no new diagnostics permitted.


## Design checkpoint

Locked plan.md covers257-key count-bounded atomic journal, stable epoch:sequence cursors, ready/event subscription lifecycle and coalesced watch wakeups, native error frames, global sagaName filtering, host KV ownership and signal cleanup, backend unknown outcomes and legacy upgrade boundary. Canonical SSE types remain one definition in existing domain vocabulary with contract identity preserved. No timer-based policy/clock added. Per-slice files/counts/gates and full F1-F19 overlays specified; JSR rubric applied, exact baseline7/30 measured. No rework-forcing open decisions. Runtime proof is actual HTTP/native store behavior; expensive full scaffold N/A because no generated/process/DB/CLI/publish-map changes. Native supported-store tests remain required. Product source unchanged except the genuine red tests; Plan-Gate required before implementation.

Red test wrappers check/lint/fmt0; production diff still empty. Native Deno KV HTTP proof is executable, not a source-only finding. Proposed public journal/options/ready-event/error contract and native wire gap behavior locked in plan before any implementation.


## S1 contract

Independent GLM5.3/provider-default PLAN-EVAL PASS, all8boxes, comment6934760031; artifact retained unchanged. Canonical SSE vocabulary moves into the existing domain message file with identity re-export at contracts/v1. Structured feed error preserves existing saga error family and separates invalid-cursor/history-lost/unavailable. Public quick-start pins bounded retention, epoch creation/inheritance, replay/live semantics and host KV ownership before implementation. No transport or publish-map change.

S1 gates: contract suite3/3,18-file lint/fmt and scoped check0, exact doc-lint combined7/all entrypoint distribution unchanged, quality:gate0, release:preflight fourPASS and docs:accuracyPASS. A missing local type import during relocation was caught and corrected before any behavioral run; no invalid run claimed green. Original4HTTPreds remain pending journal wiring.
