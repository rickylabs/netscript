# Research — fix-1583-duplicate-sse-subscriptions--1583

## Re-baseline

- Carried-in source: issue #1583 and `.llm/runs/release-0.0.6-features--orchestration/slices/implement-1583.md`.
- Re-derived against `main@fc312f2116f9b463e5a049b5e70d8152e448463c` plus the brief-only branch commit `884f100fe` on 2026-08-12.
- The live issue body confirms the one-target reproduction but currently contains no acceptance checkboxes; the brief nevertheless requires `box-index` acceptance evidence. This must be reconciled before the draft PR body is finalized.

## Findings

| # | Finding | How to verify |
| - | - | - |
| 1 | One call to `createNetScriptChatConnection` creates one internal abort controller and one cold upstream connection handle; it does not itself start network IO. | `packages/fresh/src/runtime/ai/create-chat-connection.ts:378-393`; upstream `npm:@durable-streams/tanstack-ai-transport@0.0.8/src/client.ts:58-70` |
| 2 | Every consumed NetScript `subscribe()` iterable reaches `subscribeWithRetry`, whose line 606 invokes `connection.subscribe(signal)` without an active-owner guard. The upstream invocation opens a new durable-stream read at its lines 70-78. There is no NetScript dedupe or memo today. | `packages/fresh/src/runtime/ai/create-chat-connection.ts:404-409,596-623`; `npm:@durable-streams/tanstack-ai-transport@0.0.8/src/client.ts:70-78` |
| 3 | The pinned Preact hook is not recreating its client on ordinary renders: `useChat` memoizes `ChatClient` by stable `clientId`; its live effect depends on `[client, options.live]`. | `npm:@tanstack/ai-preact@0.10.1/src/use-chat.ts:29-30,60-157,181-187` |
| 4 | TanStack's client-level `subscribe()` is already idempotent: it returns when `isSubscribed` and only restarts when explicitly requested. Its unsubscribe aborts the subscription controller. Therefore ordinary rerenders of one pinned hook do not explain two upstream calls. | `npm:@tanstack/ai-client@0.19.1/src/chat-client.ts:638-672,1093-1120` |
| 5 | Existing NetScript lifecycle teardown aborts a connection-wide controller, and the signal is combined with a caller signal before reaching the upstream path. The existing test only observes the signal after a finite generator has completed; it does not prove cancellation of a physically in-flight live GET. | `packages/fresh/src/runtime/ai/create-chat-connection.ts:385-402,395-396`; `packages/fresh/src/runtime/ai/create-chat-connection_test.ts:229-263` |
| 6 | The upstream durable client deliberately performs a non-live catch-up GET before its SSE GET, but that sequencing alone does not authorize two concurrently active NetScript subscription loops. | `npm:@durable-streams/client@0.2.6/src/stream-api.ts:132-175,218-225,252-286` |

## Mechanism verdict

The reproducible package defect is the absence of structural ownership at the NetScript connection handle. A second consumer of the same handle starts a second `subscribeWithRetry` loop and therefore a second upstream durable-stream subscription. The pinned `useChat` render/effect code is stable and its `ChatClient` guards duplicate logical subscriptions, so this is not a demonstrated caller dependency-array bug. The external EIS `ChatPane` source is not present in this checkout, so its exact connection-construction expression cannot be cited or independently replayed here.

## jsr-audit surface scan

- Surface scanned: `packages/fresh/deno.json` export `./ai`, `packages/fresh/src/runtime/ai/mod.ts`, and `deno doc --filter createNetScriptChatConnection packages/fresh/src/runtime/ai/mod.ts`.
- Planned surface change: none. The existing `NetScriptChatConnection` signature remains intact; only internal subscription ownership changes.
- Slow-type / surface risk: none introduced. Full export-map doc lint remains a required gate.

## Open questions

- Closed for implementation: dedupe belongs to the connection handle because that is the narrowest layer that can structurally guarantee one physical upstream subscription while preserving callers and upstream packages unchanged.
- Deferred/non-blocking: the external EIS `ChatPane` construction site is unavailable in this repository, so browser replay of that application is not possible from this worktree.

