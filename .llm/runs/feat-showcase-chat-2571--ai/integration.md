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
| `integration/stream-secret.ts.template` | `showcase/stream-secret.ts` |
| `integration/streams-host.ts.template` | `showcase/streams-host.ts` |

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

Native `ai/showcase` imports must resolve through the installed workspace maps: `@netscript/ai` provider/agent/contracts/ports/tools subpaths, `@netscript/fresh/ai`, `@netscript/sdk/client`, `@netscript/plugin-streams-core`, `@tanstack/ai` and `/client`, `@tanstack/ai-mcp` and `/server`, and `zod`. The app also needs `@durable-streams/tanstack-ai-transport` and `@durable-streams/client` plus its existing Fresh/Preact imports. Reuse pins already present: NetScript `0.0.8`, TanStack AI `0.68.0`, AI MCP `0.8.3`, durable chat transport `0.0.10`, durable client `0.2.7`; provider SDK pins remain owned by `@netscript/ai`. No direct provider SDK import belongs in an app route, island, loader or Vite config. `loader.ts` loads a workspace file URL with native Deno at request time, matching #2594.

Auth must be fully configured through the existing plugin and `auth/bff.ts`: cookie verification goes through `handleBrowserAuth(request, 'session')` on every page/API read, send and MCP call. Missing auth gives sign-in/401; broken auth gives unavailable/503. Neither a subject header nor a shared identity is accepted. Existing secure browser cookie rules require localhost or HTTPS for sign-in. Keep the verified auth BFF and its service discovery/configuration from normal setup.

**Automatic private streams (S2):** render the two new integration files at exactly the destinations above. In the parent's generated `showcase/setup.ts`, import `provisionShowcaseStreams` from `./stream-secret.ts` and call `await provisionShowcaseStreams(root)` before starting services. It is idempotent, returns no credential, and prints nothing. No user source edits or manually shared stream secret are needed.

After normal plugin installation, the parent's setup should patch only these fields on the existing streams entry, retaining its identity, ports, references and permissions:

```json
{ "NetScript": { "Plugins": { "streams": {
  "Workdir": ".",
  "Entrypoint": "showcase/streams-host.ts"
} } } }
```

Retain `--allow-net`, `--allow-env`, `--allow-read`, `--allow-write`, `--allow-sys`, `--allow-ffi` on that native host; the app needs read access to its user's `.secrets` as well as its existing KV permissions. Regenerate Aspire through the parent's normal setup recipe after this override (`netscript generate aspire`). Existing pinned imports must resolve `@netscript/plugin-streams/service` and `@netscript/service/auth`; no new package/version is required. No credential-valued appsettings/environment entry or DataDirectories override is needed: the host initializes server-only `STREAMS_SECRET` and pins `STREAMS_DATA_DIR` to project `.data/streams` itself.

The helper creates a cryptographically random per-canonical-workspace credential in `~/.secrets/netscript-showcase-<workspace-hash>.secret` (directory 700, regular single-link file 600). The generated `.netscript/showcase-streams.json` stores only its basename/version. Runtime checks ownership, permissions, file type, size and metadata identity; missing/unsafe/copied metadata fails closed. Setup and the app/streams processes must run as the same POSIX OS user at the same canonical workspace path. Moving a workspace requires rerunning setup; no credential is put in the repo. POSIX permissions are enforced; Windows is refused rather than silently claiming mode-600 protection.

The new caller-owned host protects this exact prefix for every method through the existing service auth policy:

```text
/v1/stream/netscript/showcase/{{projectName}}/{{appName}}/ai/chat
```

All other prefixes, including public order activity and normal workers/sagas/triggers/auth streams, retain their current public behavior. The native API binds the underlying store listener to loopback; the caller exposes only its guarded front listener. Retain normal streams discovery (`DURABLE_STREAMS_URL` or existing resource references) in the app. The native chat runtime reads the same provisioned credential before the unchanged anonymous-read privacy probe. No-key page rendering returns before secret/auth/service/model initialization. The BFF session action is invoked with an app-owned GET even when authorizing chat/MCP POST, matching its actual GET-only contract.

For restart durability, persist `.netscript/showcase-chat.kv`, `.data/streams`, `.netscript/showcase-streams.json` and the user's private credential file. Give the app Deno read/write/env/net permissions and unstable KV support. The store contains ownership/thread metadata and expiring turn leases; Durable Streams is the sole transcript. This baseline uses one host with persistent local KV; multiple app hosts require a shared ownership-store deployment.

`ai/models.ts` must export `DEFAULT_CHAT_MODEL`. With the installed default `anthropic:*`, set `ANTHROPIC_API_KEY` (existing `ANTHROPIC_AUTH_TOKEN` / `ANTHROPIC_OAUTH_TOKEN` also work). Or select `openai-compatible:<model>` and set `OPENAI_API_KEY`, optionally `OPENAI_BASE_URL`. Restart the app after configuration changes. With no supported credential the page renders connect-provider and never invokes a model; no stub provider ships in product templates.

The orders contract import is the existing `contracts/versions/v1/orders.contract.ts` / `OrdersContractV1`. **Routing correction:** the SDK already adds `apiVersion: 'v1'`, so `routerName: 'orders'` reaches the generated `v1.orders` router at `/api/rpc/v1/orders`. The brief's literal `routerName: 'v1.orders'` produces `/api/rpc/v1/v1.orders` and fails. A real RPCHandler consumer test proves the selected binding. Preserve it unless host and client change together. No customer/product/line mutation procedures are required: tools expose only bounded `list` and numeric `getById` against the live orders service, using normal `services__orders__http__0` discovery.

Default **kv-oauth** needs real OAuth/OIDC credentials, a stable 32-byte base64url KV encryption key, working KV, and the generated BFF callback registered with the provider. The generated sign-in surface remains mandatory. See [auth prerequisites](auth-prerequisites.md) for exact environment/configuration and the **better-auth limitation**: that backend validates existing sessions and does not implement the generated interactive sign-in flow. Credentials alone cannot make better-auth turnkey; use kv-oauth for this no-code-wiring showcase path.

Validation: run `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/tests/showcase-ai/showcase_ai_test.ts`. It renders real templates, checks/lints/formats emitted source with structured wrappers, renders all page states, and runs 21 scenarios, including actual generated BFF cookie-to-bearer verification and two fresh native streams processes proving private denial, authenticated read/write, public prefixes, loopback upstream and durable transcript replay after restart. No model key is used. Optional `SHOWCASE_AI_EVIDENCE_DIR=<directory>` saves nested structured reports with repo-relative paths.

**S3 repair integration:** apply only the island and thread-store changes plus scoped tests/run notes. Parent's restyled page/CSS remain parent-owned. The island now authenticates a finite native durable-stream catch-up before unlocking Send, then resumes the existing transport at its exact returned offset. Ensure the generated app import map resolves `"@durable-streams/client": "npm:@durable-streams/client@0.2.7"`, reusing the existing pin; no new framework API or package version is needed. Thread listing scans all owner metadata then sorts by creation time/ID, O(n) for this small single-host showcase; scale-out needs a chronological index and pagination.

Add the explicit mounted-browser gate from [the checked-in browser README](../../../packages/cli/tests/showcase-ai/browser/README.md) to the parent's CI path after the checked-in npm/Chromium prerequisite. The local command is `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/tests/showcase-ai/browser/showcase_ai_browser.ts`. It mounts the emitted island and real registry UI, native streams/chat, typed order MCP and production send/proxy/ownership/origin guards; only composition auth/provider ports are test fixtures. [S3 evidence and reproduction](repair-evidence.md) records baseline RED and repaired GREEN. Same-reviewer independent acceptance remains pending with the parent.

Parent still owns asset/carrier registration, final source review/IMPL-EVAL, provider-boundary production build, browser/light/dark/mobile verification, real configured auth/provider/streams acceptance, and the canonical one-pass `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` merge gate. This slice makes no claim that those integration gates ran.
