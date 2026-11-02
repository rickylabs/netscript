# Research

- Read requested skills, harness activation/run-loop/gates, doctrine axioms, helpers, Archetype 6 and current verdict. No `profiles/` reads.
- CLI is Archetype 6 (Keep); scope is new app-owned templates and focused tests only. No framework exports/dependencies change, so package surface/JSR audit is N/A for this slice.
- Inspected AI plugin scaffold sources first: chat-route, stream-proxy, models, barrel, thread-store, MCP-server, tool and agent. Their default session and non-atomic optional transcript store are starters, not a production identity or a second history store to copy.
- `@netscript/fresh/ai` supplies durable connection, snapshot, projection, response and sanitized stream proxy. History must use its native messages and one projection; app metadata/ownership can use Deno KV.
- `auth/bff.ts` supplies `handleBrowserAuth(request, 'session')`: verifies browser cookie with the installed auth service and returns only authenticated + subject. Load that workspace module natively; missing auth fails closed. Never accept a subject header.
- Provider modules must be loaded from workspace files through `import(/* @vite-ignore */ specifier)` at request time, matching scaffold-plugin-capabilities and #2594.
- Generated orders contract is `contracts/versions/v1/orders.contract.ts`, exporting OrdersContractV1. Owner explicitly binds serviceName orders, routerName v1.orders. CRUD list uses page/limit/sortOrder/search/status; getById takes id.
- Existing pins: @tanstack/ai 0.68.0, @tanstack/ai-mcp 0.8.3, and @netscript/ai providers. ai-mcp/server supplies createMCPServer and the client accepts a direct server, avoiding a loopback HTTP auth hop or custom MCP runtime.
- Registry UI offers Markdown, PromptInput, ToolCallCard. Use those with app-owned thread chrome. No fake messages or unsupported controls.
- Host has Deno 2.9.7 but no rtk binary. Use focused shell output and structured validation wrappers; no lock/cache deletion.

## S2 findings

- Native `startStreamsService` accepts the existing ServiceAuthPolicy and hardcodes its store upstream to `127.0.0.1`; `STREAMS_DATA_DIR` uses the existing bounded file-backed store with restart recovery. Protecting only the chat prefix retains the existing public raw-stream behavior elsewhere.
- Existing generated auth BFF session is GET-only. Passing original chat/MCP POST returned 404; runtime now performs an app-owned GET with the same cookie/signal, verified through the actual generated BFF and typed auth RPC test.
- Default auth backend is kv-oauth. It requires a configured 32-byte encryption key and real OAuth/OIDC provider endpoints, credentials and app-origin BFF callback. Better-auth selects Prisma persistence but exposes no interactive flow; credentials alone do not make the generated sign-in work. Exact prerequisites are in auth-prerequisites.md.
- An isolated native test originally resolved open oRPC ranges beyond the repository lock. The consumer fixture now derives exact npm pins from the existing repository lock and uses the native no-node_modules runtime flag. No product pin or dependency changed.
