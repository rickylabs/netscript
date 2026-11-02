# Scoped plan

Archetype 6 assets with frontend/server concerns; no package public API, framework runtime or dependency changes.

Locked: random per-owner conversation IDs; persistent KV metadata with ownership checked on every API path; verified existing browser auth only; durable streams own history; bounded input and model/tool execution; read-only typed orders tools; existing @netscript/ai providers and agent loop, with a small wire adapter to the existing TanStack chat transport; upstream MCP server/client and tool definitions; native workspace runtime loader outside Vite; safe no-key/connect-provider and unavailable states.

Open decisions: none affecting the contract. Parent selects manifest/carriers, navigation placement and setup orchestration; safe to defer because this slice supplies destinations/requirements.

One implementation commit: scoped templates, source/stub tests, harness notes. Validate rendered templates against real workspace APIs, actual MCP discovery/calls, real durable transport with stub provider, owner isolation, CSRF, rejection paths, restart/replay and prompt history. Use structured check/test/lint/fmt wrappers. Parent runs full provider-boundary build, quality/architecture integration and canonical scaffold.runtime gates.

Risks: unauthenticated chat (mitigation: missing/broken auth denies); shared streams (ownership records plus protected server stream access); Vite provider graph (native loader); concurrent turns (KV lease); poisoned client transcript (accept a single user text only and replay server history); credential exposure (no key or auth session IDs in props/errors/logs).

PLAN-EVAL: N/A for this bounded implementation slice: owner already locks framework APIs, architecture, scope and parent review. Independent IMPL-EVAL and source sign-off remain parent responsibilities. No new accepted doctrine debt.

## S2 automatic private streams (owner-authorized continuation)

Only new `ai/integration/` assets, existing runtime/stream-policy templates, scoped tests and this run may change. Parent owns setup.ts, appsettings integration, manifests and app scaffold. Add a shared setup/read helper generated as `showcase/stream-secret.ts` and a caller-owned native host generated as `showcase/streams-host.ts`. A per-workspace random credential lives only in the current user's `.secrets` directory (700 / file 600); `.netscript/showcase-streams.json` carries a non-secret filename reference. Setup is idempotent and runtime refuses missing/tampered/unsafe files. No secret appears in appsettings, source or output.

Host protects only the exact chat namespace through the existing native auth policy; all other first-party stream namespaces keep their existing public behavior. Native API owns loopback upstream and durable file store; host pins storage to project `.data/streams`. Existing no-key page returns before credential, auth or network initialization. BFF validation remains mandatory; no demo identity or subject header.

Validation adds secret permissions/idempotence/tamper/missing-file checks, actual BFF verification, and native fresh-process host restart with private denial/authenticated IO/public-prefix acceptance. Inspect default kv-oauth and better-auth prerequisites from current implementation; document unsupported validate-only login instead of claiming credentials create a login UI. PLAN-EVAL N/A: bounded extension of the already locked implementation with no new framework API/dependency. Parent retains independent evaluation/signoff.

## S3 FAIL_FIX repair (same implementation session)

Independent source review returned first terminal FAIL_FIX. Only NorthwindChat.tsx.template, thread-store.ts.template, scoped tests/browser tooling and run docs are writable. Parent owns InstalledFrom, restyled page/CSS, setup, carriers, CI and evaluation. No evaluator dispatch or self-certification.

P1: establish readiness from an authenticated finite durable catch-up, retaining the framework's native replay and resuming live at the exact returned offset, including empty catch-up. Mounted Chromium regression must first fail on current source, then pass unchanged after repair: create/send first turn, reopen unused/send, reload nonempty messages/tool history. Use emitted component and actual registry composer/Markdown/tool cards; real native streams and app chat handlers, only auth/provider ports stubbed. Keep sends, proxies and ownership/origin guards real. Browser tooling uses the checked-in npm lock and process-local library path only.

P2: list all owner metadata before sorting newest-first with stable ID tie break. No UUID scan cap; document O(n) single-host showcase scaling. A >50 deterministic-ID regression must fail before repair and pass after it, retaining all conversations and owner isolation. Preserve the existing 20 scenario checks and structured gates. One scoped repair commit; parent re-evaluates through the same reviewer.
