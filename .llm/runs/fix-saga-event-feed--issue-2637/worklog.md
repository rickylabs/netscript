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


## S2 portable journal

KvSagaEventFeed commits one fixed slot and head atomically using the existing WatchableKv port. First absent-head append creates the epoch; successful CAS preserves it across instances. Each subscription continuously drains a fixed-head watch into one wake token, rereads acknowledged head, tracks an independent cursor, fetches at most256known slots, validates the whole batch and reports explicit gaps. Host KV ownership, cancellation, finite conflicts, unknown commit outcome and structured failure semantics match the locked contract. Adapter319lines; tests175/271lines.

Native memory/DenoKV/Redis/Garnet focused suite41pass/0fail/0ignored: concurrent writers, independent fast/slow readers, stable replay on fresh instances,257-key capacity, exact oldest boundary, foreign/reset/malformed/future/corrupt/overflow cases, detached16KiB payloads, startup and overwrite races, duplicate/coalesced notifications, unexpected watch termination, cancellation during readiness/read/commit and unsupported capabilities. Redis native INFO commandstats additionally measured SCAN delta0 across startup+500msidle+readerclose. Two exact owned backend containers retained for subsequent HTTP/live evaluation; private identity/mount receipts recorded, foreign resources untouched.

Static check/lint/fmt0; exact core doc-lint combined7/all entrypoint baseline unchanged; native JSR dry-runSuccess with no slow-type diagnostic; quality:gate0, preflight fourPASS and accuracyPASS. Test fixture-only compile/mocking issues (optional getMany and native generator return argument) and double-restored stub were corrected before final evidence; initial partial17/1 and40/1 are not green claims.

Explicit @std/async mapping reuses the already locked version. Maintained frozen guards required metadata-only mirrors in root, Expo reference, desktop reference and fresh-ui private locks: each adds exactly the core std dependency declaration, no resolution/version/integrity change. Native maintained refresh commands used. No scaffold/generated launch/publish-map/glob behavior changes; runtime applicability remains as approved.


## S3 native HTTP wiring

Default API writer now appends to the core feed after runtime acceptance. Subscribe consumes the native lastEventId, emits a ready heartbeat without id, applies the existing sagaName filter after journal cursor advancement and maps structured errors to native400/409/503 SSE error frames. Existing wire schemas/route and injected writer remain compatible. Request cancellation propagates into append and abortable injected-writer/runtime waits without undoing accepted work. No new context registry or process launch.

All4original HTTP reds are now green. Extended native HTTP memory/DenoKV plus actual Redis/Garnet fanout/replay, native error-frame/filter/id checks, publish cancellation and subscription post-ready failure suite40/40green,0ignored. One initial filter fixture supplied a non-ISO timestamp and correctly triggered native contract validation; corrected to ISO before final evidence, no product schema/assertion weakened. Post-ready watch termination explicitly wakes the idle consumer with unavailable. Core focused total becomes42cases after that test supplement. Scoped8-file check/lint/fmt0, quality:gate0, preflight fourPASS/accuracyPASS; plugin doc-lint30 and exact per-entrypoint distribution unchanged.


## S4 public semantics

Core/plugin README and the existing saga guide document256-event/global retention,257-key new journal bound, opaque stable ids, ready/live-only versus header replay, native error frames after HTTP200, oldest predecessor boundary, filtering, cancellation/host KV ownership, provider size/durability, unknown outcomes and acceptance-before-observation retry semantics. Default writer described accurately as API message notification only; no lifecycle/transport wiring claim added. Legacy rollout requires quiescing old API instances and clearing old cursors, with no automatic scan/migration. Public docs contain product semantics only. Manual docs committed before canonical generated consumer refresh.


## S4 consumer refresh and cross-client coverage

Canonical gen:agent-docs-prose (site build included), gen:mcp-export-corpus with expected dirty prose carrier, gen:assets-barrel and gen:publish-assets all exit0. Only MCP prose/export corpus/publish-assets carriers change; no generated CLI/scaffold output changes. Corpus/publish freshness PASS. Native independent Redis/Garnet clients sharing one namespace now prove32concurrent multi-client commits produce one epoch,32unique contiguous ids and identical fanout;2/2green. This supplements the approved multi-instance contract, no design change. Static check/lint/fmt on all14changed TypeScript files0, plus the two amended test files0. No lock change beyond the four required metadata snapshots already recorded.

Full saga plugin196pass/0fail/2existing optional ignores; full core247pass/0fail/4existing ignores before the two native cross-client tests were added. Final core repeat includes those new cases. Every new backend/cursor/HTTP test executes when owned Redis/Garnet endpoints are provided; no new ignore. Native core/plugin JSR dry-runsSuccess, audits exit0 with existing cardinality and the known normal slow-type-check-banner miscount only; native output has no slow-type diagnostic. Core7/plugin30 exact doc-lint baseline unchanged; release:preflight fourPASS/docs:accuracyPASS; review-thread gate0/0.


## S5 implementation completion

Final full core249pass/0fail/4existing optional ignores (includes both separate-native-client cases), plugin196pass/0fail/2existing optional ignores. Targeted new journal/subscription44cases and HTTP9cases all execute with owned Redis/Garnet; no new skip. Final quality:gate0 and assets/corpus/publish freshness PASS, public/operator-path scan clean, no forbidden transport diff. Native core/plugin publish/audits and unchanged exact doc-lint distribution certified as above. Completion proof comment6935399907 maps all4acceptance; issue boxes and fenced PR mappings completed. Draft final DoD remains pending independent evaluation, exact-owned cleanup and required-head CI/threads.

Live matrix confirms feature IMPL-EVAL primary MuseSpark1.3/xhigh, fallback Opus5/xhigh unused. Generator CodexSol/xhigh is a separate vendor/session; no helper agents. T3 fresh delegate requirement retained. Two exact owned Redis/Garnet backends remain available for independent probes; caller adapters/readers close individually and final parent cleanup remains mandatory.


## Independent implementation evaluation and cleanup

Fresh separate MuseSpark1.3/xhigh feature IMPL-EVAL PASS at3e5e6745760abac0867c5d7e87e35bb311263937, comment6935616660; no blocking findings or new debt. Evaluator independently reran all277core/plugin source files check/lint/fmt0, unchanged exact doc-lint baseline, targeted core46/0/0, HTTP9/0/0, full core249/0/4existing and plugin196/0/2existing, native JSR/fitness/docs/consumer gates. Artifact retained unchanged. No production change after verdict.

Maintained read-only leak-check and teardown preview followed by positive native creation-label/image/mount proof removed exactly2owned Redis/Garnet containers and2recorded unshared anonymous volumes. Re-scanned every survivor before volume removal; final owner/recorded-volume scans0, maintained post-cleanup leak-check0. All foreign/unproven objects retained; raw private logs not committed.

All4acceptance boxes/body mappings complete. Draft ready transition and final required-head checks/thread gate remain the last completion steps; no merge, ready-merge or publication.


## Required-head README fence correction

Ready-head quality caught five unbound names in the new README quick-start. Maintained docs:readme-fences reproduced the failure locally:115checked/0exempt,10typeerrors in5READMEs versus the existing5errors/4README ceiling. The five old diagnostics are known consumer-owned import placeholders outside this PR; the five new ones all came from this example.

Changed the example to a self-contained function with explicit host-owned WatchableKv, caller signal and optional replay id parameters; it prints the actual typed event/id. Append usage stays documented separately. No framework/API/runtime change, no gate/ratchet/exemption changed and no new delegate for this small docs correction. Native fence compilation must return to its exact baseline before refreshed consumers and push. Prior independent runtime/public-surface PASS retained.

README correction validated: docs:readme-fences PASS with115checked/0exempt, exact baseline5consumer-owned import diagnostics across4otherREADMEs, no diagnostic in this README. release:preflight fourPASS and docs:accuracyPASS. No gate/ratchet/exemption change or product source change. Canonical documentation freshness and required new-head CI remain to be confirmed.
