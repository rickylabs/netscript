# Parent integration: Northwind AI / MCP

This slice contains canonical assets only. Register/render them in the parent's showcase preset, regenerate carriers there, and substitute `{{projectName}}` / `{{appName}}` (default app `portal`). No existing file, manifest, framework API, dependency pin or scaffold pipeline was changed.

| Template below `packages/cli/src/kernel/assets/showcase/ai/` | Generated destination |
| --- | --- |
| `server/*.ts.template` (8 files) | `ai/showcase/*.ts` (same basename) |
| `app/loader.ts.template` | `apps/{{appName}}/lib/showcase-ai.ts` |
| `app/page.tsx.template` | `apps/{{appName}}/routes/ai.tsx` |
| `app/NorthwindChat.tsx.template` | `apps/{{appName}}/islands/NorthwindChat.tsx` |
| `app/threads-route.ts.template` | `apps/{{appName}}/routes/api/showcase/chat.ts` |
| `app/session-route.ts.template` | `apps/{{appName}}/routes/api/showcase/chat/[sessionId].ts` |
| `app/mcp-route.ts.template` | `apps/{{appName}}/routes/api/showcase/mcp.ts` |
| `app/showcase-ai.css.template` | `apps/{{appName}}/assets/showcase-ai.css` |

Link `/ai` in showcase navigation/route registration. Preserve `/sign-in` and the existing auth routes. Import the CSS from the app's normal stylesheet entry after foundation styles.

Run existing setup commands from the generated workspace (or their equivalent parent setup steps):

```sh
netscript plugin install ai --name ai --app portal
netscript plugin install auth --name auth --app portal  # only when absent
netscript ui:add markdown --app portal
netscript ui:add prompt-input --app portal
netscript ui:add tool-call-card --app portal
```

Use the actual app name instead of `portal`. `ui:add` is the verified current CLI spelling; it installs the transitive registry components, sanitizer dependencies and CSS (including KaTeX). Use normal existing plugin registry generation in the parent's recipe. Do not mount the AI plugin's starter chat routes: this page calls its own protected endpoints and uses `ai/models.ts`, not the starter `default` session or optional transcript KV store. No separate AI service or new AI task is required.

Native `ai/showcase` imports must resolve through the installed workspace maps: `@netscript/ai` provider/agent/contracts/ports/tools subpaths, `@netscript/fresh/ai`, `@netscript/sdk/client`, `@netscript/plugin-streams-core`, `@tanstack/ai` and `/client`, `@tanstack/ai-mcp` and `/server`, and `zod`. The app also needs `@durable-streams/tanstack-ai-transport` plus its existing Fresh/Preact imports. Reuse pins already present: NetScript `0.0.8`, TanStack AI `0.68.0`, AI MCP `0.8.3`, durable chat transport `0.0.10`; provider SDK pins remain owned by `@netscript/ai`. No direct provider SDK import belongs in an app route, island, loader or Vite config. `loader.ts` loads a workspace file URL with native Deno at request time, matching #2594.

Auth must be fully configured through the existing plugin and `auth/bff.ts`: cookie verification goes through `handleBrowserAuth(request, 'session')` on every page/API read, send and MCP call. Missing auth gives sign-in/401; broken auth gives unavailable/503. Neither a subject header nor a shared identity is accepted. Existing secure browser cookie rules require localhost or HTTPS for sign-in. Keep the verified auth BFF and its service discovery/configuration from normal setup.

**Private streams are mandatory before connected chat is enabled.** The default legacy streams host is public. In the caller-owned streams host use the existing `startStreamsService` from `@netscript/plugin-streams/service` with `auth.authn.authenticator = createStaticCredentialAuthenticator(...)` from `@netscript/service/auth`. Protect this exact prefix for every method:

```text
/v1/stream/netscript/showcase/{{projectName}}/{{appName}}/ai/chat
```

Supply a server-only credential in that authenticator's `credentials` map and pass the same value to the app as `STREAMS_SECRET` (or `DURABLE_STREAMS_SECRET`). Set `DURABLE_STREAMS_URL` or existing streams discovery variables in the app. Do not add an anonymous rule overlapping this prefix; other activity prefixes can retain their existing policy. The app performs an anonymous GET under this prefix and fails closed unless it returns 401/403. Verify authenticated stream creation/read/write and anonymous denial against the deployed host, rather than just setting an environment variable. Keep the native upstream streams port private as well.

For restart durability, persist the app workspace's `.netscript/showcase-chat.kv` and configure the existing streams `STREAMS_DATA_DIR` to a persistent directory. Give the app Deno read/write/env/net permissions and unstable KV support. The store contains ownership/thread metadata and expiring turn leases; Durable Streams is the sole transcript. This baseline uses one host with persistent local KV; multiple app hosts require a shared ownership-store deployment.

`ai/models.ts` must export `DEFAULT_CHAT_MODEL`. With the installed default `anthropic:*`, set `ANTHROPIC_API_KEY` (existing `ANTHROPIC_AUTH_TOKEN` / `ANTHROPIC_OAUTH_TOKEN` also work). Or select `openai-compatible:<model>` and set `OPENAI_API_KEY`, optionally `OPENAI_BASE_URL`. Restart the app after configuration changes. With no supported credential the page renders connect-provider and never invokes a model; no stub provider ships in product templates.

The orders contract import is the existing `contracts/versions/v1/orders.contract.ts` / `OrdersContractV1`. **Routing correction:** the SDK already adds `apiVersion: 'v1'`, so `routerName: 'orders'` reaches the generated `v1.orders` router at `/api/rpc/v1/orders`. The brief's literal `routerName: 'v1.orders'` produces `/api/rpc/v1/v1.orders` and fails. A real RPCHandler consumer test proves the selected binding. Preserve it unless host and client change together. No customer/product/line mutation procedures are required: tools expose only bounded `list` and numeric `getById` against the live orders service, using normal `services__orders__http__0` discovery.

Validation: run `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/tests/showcase-ai/showcase_ai_test.ts`. It renders real templates, checks/lints/formats emitted source with structured wrappers, renders all page states, and runs 15 scenarios with real framework chat persistence/replay, upstream MCP server/client, a real typed RPC service and scripted provider. No model key is used. Optional `SHOWCASE_AI_EVIDENCE_DIR=<directory>` saves nested structured reports.

Parent still owns asset/carrier registration, final source review/IMPL-EVAL, provider-boundary production build, browser/light/dark/mobile verification, real configured auth/provider/streams acceptance, and the canonical one-pass `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` merge gate. This slice makes no claim that those integration gates ran.
