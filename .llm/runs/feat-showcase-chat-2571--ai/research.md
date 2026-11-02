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
