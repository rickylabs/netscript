# Scoped plan

Archetype 6 assets with frontend/server concerns; no package public API, framework runtime or dependency changes.

Locked: random per-owner conversation IDs; persistent KV metadata with ownership checked on every API path; verified existing browser auth only; durable streams own history; bounded input and model/tool execution; read-only typed orders tools; existing @netscript/ai providers and agent loop, with a small wire adapter to the existing TanStack chat transport; upstream MCP server/client and tool definitions; native workspace runtime loader outside Vite; safe no-key/connect-provider and unavailable states.

Open decisions: none affecting the contract. Parent selects manifest/carriers, navigation placement and setup orchestration; safe to defer because this slice supplies destinations/requirements.

One implementation commit: scoped templates, source/stub tests, harness notes. Validate rendered templates against real workspace APIs, actual MCP discovery/calls, real durable transport with stub provider, owner isolation, CSRF, rejection paths, restart/replay and prompt history. Use structured check/test/lint/fmt wrappers. Parent runs full provider-boundary build, quality/architecture integration and canonical scaffold.runtime gates.

Risks: unauthenticated chat (mitigation: missing/broken auth denies); shared streams (ownership records plus protected server stream access); Vite provider graph (native loader); concurrent turns (KV lease); poisoned client transcript (accept a single user text only and replay server history); credential exposure (no key or auth session IDs in props/errors/logs).

PLAN-EVAL: N/A for this bounded implementation slice: owner already locks framework APIs, architecture, scope and parent review. Independent IMPL-EVAL and source sign-off remain parent responsibilities. No new accepted doctrine debt.
