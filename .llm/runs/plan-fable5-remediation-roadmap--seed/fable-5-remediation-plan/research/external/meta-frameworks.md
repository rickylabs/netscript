# Competitive teardown — production meta-frameworks, 2026

**Run:** `plan-fable5-remediation-roadmap--seed` · **Baseline:** `origin/main` `fac9e339042c` (2026-08-08)
· **Scope:** external competitive research + verification of NetScript's current state against the
bar. Read-only audit; no repo source touched.

**Evidence rules applied:** every framework claim carries a vendor-doc URL. Every NetScript claim
carries a repo path (+line where load-bearing) or a command output reproduced inline. Where a claim
is sentiment rather than fact it is labelled `[sentiment]` and its source is named.

---

## 0. Verification commands used for NetScript claims

```text
$ ls packages
ai aspire auth-better-auth auth-kv-oauth auth-workos bench cli config contracts cron database
fresh fresh-ui kv logger mcp plugin plugin-ai-core plugin-auth-core plugin-sagas-core
plugin-streams-core plugin-triggers-core plugin-workers-core prisma-adapter-mysql queue
runtime-config sdk service telemetry watchers

$ ls plugins
ai auth sagas streams triggers workers

$ ls packages/cli/src/public/features
agent config contracts db deploy generate init marketplace plugins root services ui

$ curl -s https://jsr.io/@fresh/core/meta.json   # latest: 2.3.3
```

---

## 1. Per-framework teardown

Axes per framework: **(a) scaffold/CLI generation depth · (b) typed end-to-end data story ·
(c) auth · (d) background jobs / durable workflows · (e) observability · (f) docs / AI-agent
readiness · (g) the ONE thing users praise.**

### 1.1 Next.js 16 (Vercel)

- **(a) Scaffold/CLI.** `create-next-app` only. There is **no incremental generator surface** —
  no `make:route`, no `make:job`. Config-level features are toggles in `next.config.js`, e.g.
  `cacheComponents: true` and `reactCompiler: true`
  (<https://nextjs.org/blog/next-16>,
  <https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents>).
  Next.js competes on *runtime* depth, not *generation* depth.
- **(b) Typed data.** Server Components + Server Actions. Types flow because the call is a direct
  import, not a wire contract — there is no emitted client, no OpenAPI, no contract artifact. Next
  16 added `updateTag()` (Server-Actions-only, read-your-writes) and `refresh()` (uncached-data
  refresh) as explicit cache-coherence primitives on top of Cache Components / PPR
  (<https://nextjs.org/blog/next-16>). **Note the direction of travel: the frontier is no longer
  "can you type the call", it is "can you express cache/invalidation semantics in the type-safe
  call".**
- **(c) Auth.** **Nothing first-party.** Users assemble Better Auth / Auth.js / Clerk / WorkOS.
  This is the single largest hole in the market leader and the reason auth vendors have such
  leverage in the React ecosystem.
- **(d) Jobs/durable workflows.** Not in the framework. Vercel ships this *beside* the framework:
  the open-source **Workflow Development Kit** (public beta) turns any async function durable with
  a `"use workflow"` directive — "Durable: Survive deployments and crashes with deterministic
  replays… No manual wiring of queues, no schedulers, no YAML"
  (<https://vercel.com/docs/workflows>,
  <https://vercel.com/changelog/open-source-workflow-dev-kit-is-now-in-public-beta>).
  **This is the new bar for durable execution ergonomics: a directive, not a DSL.**
- **(e) Observability.** Vercel-platform-coupled. In-framework: dev overlay + a built-in MCP
  endpoint exposing runtime errors/routes/logs.
- **(f) Agent readiness.** Strongest-in-class *runtime* agent surface: Next 16 **enables an MCP
  endpoint by default at `http://localhost:3000/_next/mcp`**, and `next-devtools-mcp` discovers it
  so agents get "live runtime errors, routes, and logs"
  (<https://nextjs.org/docs/app/guides/mcp>, <https://github.com/vercel/next-devtools-mcp>).
  Gated behind `experimental.mcpServer` in some configs
  (<https://stackoverflow.com/questions/79797822/>).
- **(g) Praised for:** ubiquity and hiring signal — "78% of new React apps use Next.js"
  `[sentiment]` (<https://www.intuz.com/best-frontend-frameworks/>). Satisfaction is *falling*:
  State of JS 2025 shows a 21% positive / 17% negative split and Astro leading meta-framework
  satisfaction by 39 points `[sentiment, secondary source]` (same URL).

### 1.2 Nuxt 4 (+ Nitro v3)

- **(a) Scaffold/CLI.** `nuxi` with a real incremental generator surface (`nuxi add` for pages,
  components, composables, server routes, middleware, layers). Plus a **modules ecosystem** —
  install-a-module is the extension unit. Layers (`~~/layers/test` → `#layers/test`) give
  cross-project config inheritance (<https://nuxt.com/llms-full.txt>).
- **(b) Typed data.** `useFetch`/`useAsyncData` typed against Nitro server routes; typed
  per-environment config overrides in `nuxt.config`; typed layout props and typed route meta
  (`definePageMeta` with dynamic `types`/`toTypes`/`fromTypes`). 4.4 added custom
  `useFetch`/`useAsyncData` factories (<https://nuxt.com/llms.txt>). Payloads are serialized with
  devalue; custom class types need explicit reducers/revivers — **a real seam** documented as such
  (<https://nuxt.com/llms-full.txt>).
- **(c) Auth.** No first-party auth in core; `nuxt-auth-utils` and community modules carry it. Same
  hole as Next, softened by module-ecosystem discoverability.
- **(d) Jobs.** **Nitro Tasks**, still gated: `experimental: { tasks: true }`, with
  `scheduledTasks: { '* * * * *': ['cms:update'] }`, a `nitro task list` CLI, and dev API routes
  `/_nitro/tasks` and `/_nitro/tasks/:name` (<https://nitro.build/docs/tasks>). **Not durable** —
  no replay, no at-least-once guarantee, and it does not work on several serverless hosts
  (<https://github.com/nuxt/nuxt/issues/30471>,
  <https://vueschool.io/articles/uncategorized/how-to-run-scheduled-tasks-in-nuxt-on-netlify-the-hacky-way-for-now/>).
- **(e) Observability.** Nuxt DevTools; build profiling added in 4.4. No first-party distributed
  tracing.
- **(f) Agent readiness.** **Best-in-class docs-for-agents.** `nuxt.com/llms.txt` is a curated task
  router with per-page raw-markdown twins (`/raw/docs/4.x/...md`), plus a full
  `nuxt.com/llms-full.txt` corpus, plus a public docs MCP server. The team states it *dogfooded*
  this: 4.4 "was built internally using the AI SDK, our MCP server, and Nuxt UI components"
  (<https://nuxt.com/llms.txt>, <https://nuxt.com/llms-full.txt>).
- **(g) Praised for:** documentation + module ecosystem DX; consistently top-ranked "admired"
  `[sentiment]` (<https://quartzdevs.com/resources/best-fullstack-frameworks-2026-top-meta-frameworks>).

### 1.3 SvelteKit 2

- **(a) Scaffold/CLI.** `sv create` / `sv add` (add-ons for tailwind, drizzle, lucia, paraglide…).
  Thin, but the add-on model exists.
- **(b) Typed data — the reference implementation of the 2026 seam.** **Remote functions**
  (stable since 2.27) exported from `.remote.ts` in four flavours: `query`, `form`, `command`,
  `prerender`. Arguments are validated by any **Standard Schema** passed as the first argument
  (`query(v.string(), async (slug) => …)`), and errors/redirects are first-class. Critically,
  **single-flight mutations**: `form` submission or `command` invocation "can refresh queries and
  pass their results back to the client in a single request", and `form` degrades gracefully with
  JS disabled (<https://svelte.dev/docs/kit/remote-functions>).
  **This is the cleanest typed-RPC-with-cache-coherence design shipping today.**
- **(c) Auth.** Nothing first-party. Lucia/Better Auth via `sv add`.
- **(d) Jobs/durable workflows.** **Nothing.** Not in scope for SvelteKit.
- **(e) Observability.** Nothing first-party.
- **(f) Agent readiness.** `svelte.dev/docs` serves LLM-oriented text; community Claude skills
  exist for remote functions (<https://lobehub.com/skills/seeker1911-dotfiles-sveltekit-remote-functions>)
  — i.e. the *community*, not the vendor, closed the agent gap.
- **(g) Praised for:** the simplest correct mental model + highest satisfaction of the big three
  `[sentiment]`; 91% retention / 62.4% admiration in State of JS 2025 for Svelte
  (<https://www.intuz.com/best-frontend-frameworks/>).

### 1.4 TanStack Start

- **(a) Scaffold/CLI.** `npm create @tanstack/start` with an **add-on picker** — Better Auth is a
  first-class checkbox in the create flow (<https://better-auth.com/docs/integrations/tanstack>).
- **(b) Typed data.** `createServerFn()` with `.validator()` + `.handler()`, method selection,
  composable request middleware, and — uniquely — **serialization type-checking as a type-system
  feature**: `createServerFn({ strict: false })` / `{ strict: { input: false } }` explicitly opts
  out of input/output serializability checks. Production function IDs are configurable via
  `serverFns.generateFunctionId` in the Vite/rsbuild plugin
  (<https://tanstack.com/start/v0/docs/framework/react/guide/server-functions>). CSRF is a
  first-class middleware (`createCsrfMiddleware`, filtered by `handlerType: 'serverFn'`).
  **The serialization-boundary type check is a directly stealable idea for a contract-first
  framework.**
- **(c) Auth.** Partner-backed (Clerk, WorkOS gold partners) plus the Better Auth create-flow
  add-on; not first-party (<https://tanstack.com/start/latest>).
- **(d) Jobs.** **Nothing.**
- **(e) Observability.** Nothing first-party.
- **(f) Agent readiness.** Standard docs site; no vendor llms.txt/MCP surfaced in the docs nav.
- **(g) Praised for:** explicitness. The recurring community line is that Start "makes you define
  loaders and server fns explicitly. IMO this is the right approach" `[sentiment]`
  (<https://www.reddit.com/r/reactjs/comments/1jsq5ar/tanstack_start_vs_nextjs_server_functions_battle/>).
- **Maturity caveat:** v1 was announced as a **Release Candidate** on 2025-09-23 and the live docs
  still serve under `/start/v0/docs/…` — treat as pre-1.0
  (<https://tanstack.com/blog/announcing-tanstack-start-v1>).

### 1.5 RedwoodSDK

- **(a) Scaffold/CLI.** `npx create-rwsdk my-project-name`; the app is a `defineApp([...])` route
  list, deliberately minimal — no generator suite (the Redwood *generator* heritage was
  **abandoned** in the pivot)
  (<https://developers.cloudflare.com/workers/framework-guides/web-apps/redwoodsdk/>,
  <https://www.reddit.com/r/reactjs/comments/1k56etu/redwoodjs_pivots_rebuilds_from_scratch_redwoodsdk/>).
- **(b) Typed data.** RSC + Server Functions via a Vite plugin; `useSyncedState` for bidirectional
  realtime state (<https://rwsdk.com/>).
- **(c) Auth.** **First-party-ish and opinionated**: a bundled **Passkey (WebAuthn) addon** with
  server logic + client hooks, sessions stored in **Cloudflare Durable Objects**
  (<https://docs.rwsdk.com/core/authentication/>, <https://github.com/redwoodjs/passkey-addon>).
  Notable: it picks *one* modern mechanism rather than shipping an abstraction over five.
- **(d) Jobs/durable.** Inherited from the platform: Durable Objects "handle coordination,
  persistence, and global distribution" for realtime (<https://rwsdk.com/realtime>). Queues/cron
  are Cloudflare primitives, not RedwoodSDK abstractions. **Platform lock-in is the design.**
- **(e) Observability.** Cloudflare's.
- **(f) Agent readiness — most forward-looking of the set.** Ships a `.well-known/api-catalog` and
  `.well-known/agent-skills/index.json`, and states the design principle explicitly: *"Simplicity
  for humans is clarity for AI"* — avoid "custom noise" so AI focuses on business logic rather than
  framework conventions (<https://rwsdk.com/>). **Agent-skills-as-a-published-artifact is ahead of
  llms.txt.**
- **(g) Praised for:** web-standards purity on Cloudflare — Request/Response in, no framework
  ceremony.

### 1.6 AdonisJS 6

- **(a) Scaffold/CLI — the deepest generator surface in the Node world.** `node ace make:command`,
  `make:controller`, `make:test`, plus **`node ace add <pkg>`** which installs the package, wires
  `adonisrc.ts` (`commands`, `providers`, `preloads`) and writes config in one step
  (<https://docs.adonisjs.com/guides/ace/creating-commands>,
  <https://docs.adonisjs.com/guides/digging-deeper/queues>). Commands declare lifecycle intent via
  `static options: CommandOptions = { startApp, staysAlive, allowUnknownFlags }` and can register
  teardown with `this.app.terminating(...)` — **a genuinely good CLI-command contract to copy.**
  Controllers are now referenced through a **generated typed registry**:
  `import { controllers } from '#generated/controllers'` then
  `router.resource('posts', controllers.Posts)`
  (<https://docs.adonisjs.com/guides/basics/controllers>). Directory layout is configurable via
  `defineConfig({ directories: { controllers: 'app/http/controllers' } })`.
- **(b) Typed data.** VineJS validation + Lucid ORM; typed within the app, no emitted client.
- **(c) Auth.** **First-party** (`@adonisjs/auth`), plus `@adonisjs/bouncer` for authorization and
  an AdonisJS Plus type-safe RBAC layer on Bouncer `[sentiment: reddit r/adonisjs]`.
- **(d) Jobs.** `@adonisjs/queue`, built on `@boringnode/queue`, with Redis / Database (Lucid) /
  Sync adapters, `worker: { concurrency, idleDelay }`, `locations: ['./app/jobs/**/*']`, and a
  **fake for tests** (`QueueManager.fake()` + `fake.assertPushed(Job, { payload, delay })`).
  **Explicitly experimental**: "The `@adonisjs/queue` package is currently experimental. Its API
  may change between minor releases… Pin the package version"
  (<https://docs.adonisjs.com/guides/digging-deeper/queues>). Not durable-workflow-grade (no
  replay/compensation).
- **(e) Observability.** No first-party tracing.
- **(f) Agent readiness.** **Weakest of the set.** The introduction page carries no llms.txt, no
  AI-docs, no MCP reference (<https://docs.adonisjs.com/guides/preface/introduction>).
- **(g) Praised for:** "Laravel for TypeScript" — batteries-included conventions and the Ace
  generator flow `[sentiment]` (<https://dev.to/michi/adonisjs-v6-its-even-better-5gnp>).

### 1.7 Encore.ts — the closest structural competitor to NetScript

- **(a) Scaffold/CLI.** `encore run`, `encore build docker`, scaffold commands for init, and
  **`encore gen client <app> --output=./client.ts`** — a generated typed RPC client as a first-class
  artifact (<https://encore.dev/docs/ts>,
  <https://vovk.dev/blog/backend-framework-comparison>).
- **(b) Typed data.** "Define APIs as plain TypeScript functions. Calling another service is a
  normal function call; Encore handles serialization, routing, and validation."
  **Infrastructure primitives are declared in TypeScript**: SQL databases, Pub/Sub
  topics/subscriptions, object-storage buckets, caches, cron jobs, secrets
  (<https://encore.dev/docs/ts>).
- **(c) Auth.** Auth handlers as a framework concept (declared, then enforced across services).
- **(d) Jobs/durable.** Pub/Sub topics + subscriptions and **cron jobs declared in code**. Not
  replay-durable workflows, but *infrastructure-backed* rather than in-process.
- **(e) Observability — the bar.** Built-in local dev dashboard with **distributed tracing**, logs,
  and DB exploration, with production tracing in Encore Cloud
  (<https://encore.dev/docs/platform/observability/tracing>, <https://encore.dev/docs/ts>).
- **(f) Agent readiness — the bar, and the one to beat.** *"Because infrastructure is declared in
  code, AI coding assistants can understand and modify your full stack"* — shipped as AI
  instructions **plus a local MCP server**: `encore mcp run --app=<app>`, attachable with
  `claude mcp add --transport stdio encore-local -- encore mcp run --app=…`. The MCP server exposes
  **19 tools across nine areas: services and APIs, databases, traces, pub/sub, cache and storage,
  infrastructure…** (<https://encore.dev/docs/ts/cli/mcp>,
  <https://encore.dev/docs/go/ai-integration>, <https://encore.dev/blog/mcp-deep-dive>).
  Positioning is explicit: "the infrastructure platform for the intelligence era, where engineers
  **and AI agents** build production systems" (<https://bestofjs.org/projects/encore>).
- **(g) Praised for:** "you get observability for free" — the automatic distributed tracing across
  services without manual instrumentation `[sentiment]`
  (<https://stackoverflow.com/questions/79911334/>).
- **Structural gap noted by third-party analysis:** Encore is Tier A "3/4 SSOT (one structural
  gap)" in a single-source-of-truth ranking of TS backend frameworks
  (<https://vovk.dev/blog/backend-framework-comparison>).

### 1.8 Laravel 13 — the full-stack bar

- **(a) Scaffold/CLI.** `php artisan make:*` for every archetype, official **starter kits**
  (React/Vue/Livewire × Breeze/Jetstream, WorkOS option) as the standard entry point
  (<https://laravel-news.com/modern-laravel-starter-kits-by-ship-fast-labs>,
  <https://www.youtube.com/watch?v=mjSwVWhgpGc>). The MCP surface itself is generated:
  `php artisan make:mcp-server WeatherServer`, `php artisan make:mcp-tool CurrentWeatherTool`
  (<https://laravel.com/docs/13.x/mcp>).
- **(b) Typed data.** N/A in the TS sense (PHP); Inertia collapses the client/server seam instead.
- **(c) Auth.** First-party and complete (starter kits + Fortify/Sanctum/Passport + policies).
- **(d) Jobs/durable — the bar.** Queues + scheduler in core; **Horizon** for queue ops.
- **(e) Observability — the bar.** **Telescope** (dev introspection) and **Pulse** (production
  app-health) shipped as first-party packages, listed in the docs nav alongside Horizon
  (<https://laravel.com/docs/13.x/mcp> → "Packages: Horizon / Telescope / Pulse").
- **(f) Agent readiness — the bar, twice over.**
  1. **Laravel MCP** (first-party, in core docs): servers, tools with **streaming responses**
     (`yield Response::notification('processing/progress', …)`), an **MCP client**
     (`Mcp::client('github')->tools()`), an **inspector** (`php artisan mcp:inspector mcp/weather`),
     and **unit-testable servers** (`WeatherServer::actingAs($user)->tool(...)`)
     (<https://laravel.com/docs/13.x/mcp>).
  2. **Laravel Boost** — `composer require laravel/boost --dev`, `php artisan boost:install`,
     `claude mcp add -s local -t stdio laravel-boost php artisan boost:mcp`. Boost ships **AI
     guidelines**, a **Record Rule** MCP tool that writes durable project rules into `.ai/rules`
     "so future agents inherit it", and **third-party packages can ship their own AI guidelines**
     that Boost auto-loads on install (<https://laravel.com/docs/13.x/boost>,
     <https://github.com/laravel/boost>). Boost 2.0 made guidelines "~40% leaner" `[sentiment]`.
  Note the tagline Laravel now uses: *"The clean stack for Artisans **and agents**"* (page title,
  <https://laravel.com/docs/13.x/mcp>).
- **(g) Praised for:** "everything is already there and it all fits together" — the completeness of
  the first-party surface. **This is the standard NetScript's README explicitly benchmarks against**
  (`README.md:11-12`).

### 1.9 Deno Fresh 2 — NetScript's own substrate

- **Status.** Out of beta. `curl https://jsr.io/@fresh/core/meta.json` → `latest: 2.3.3`; the
  road-to-2.0 tracking issue is closed with "Fresh 2 has been officially released, though a proper
  announcement blog post will follow" (<https://github.com/freshframework/fresh/issues/2363>).
  NetScript pins `"fresh": "jsr:@fresh/core@^2.3.3"` (`packages/fresh/deno.json:38`) — **current**.
- **(a) Scaffold/CLI.** `deno run -A -r jsr:@fresh/init`. Minimal.
- **(b) Typed data.** Islands + handlers; **no server-function/RPC layer at all**. This is the
  hole NetScript fills with oRPC.
- **(c) Auth / (d) jobs / (e) observability.** None. Fresh is a routing + islands + build layer.
- **(f) Agent readiness.** Docs only.
- **(g) Praised for:** zero-JS-by-default islands and 10× faster boot (86ms → 8ms) with the Vite
  plugin; `<Head>` restored; programmatic `App()` API with file routing as a plugin; automatic
  React/Preact aliasing (<https://deno.com/blog/fresh-and-vite>,
  <https://strapi.io/blog/fresh-explained-deno-web-framework>).
- **Honest downside cited by the ecosystem:** "you also accept a smaller ecosystem than larger
  JavaScript frameworks" and Preact-only islands
  (<https://strapi.io/blog/fresh-explained-deno-web-framework>). **NetScript inherits this.**

---

## 2. The capability bar NetScript must clear, per category

| Category | Table stakes (must have to be credible) | Frontier (differentiator in 2026) | Who sets it |
|---|---|---|---|
| Scaffold/CLI generation | `create` command + **incremental generators for every archetype** + one-step `add <feature>` that wires config, providers and commands atomically | Generated **typed registries** the app imports (`#generated/controllers`) rather than string wiring | AdonisJS, Laravel |
| Typed end-to-end data | Server functions with schema-validated inputs (Standard Schema), typed errors + redirects, composable middleware | **Single-flight mutations** (mutation returns refreshed query results in one round trip); **serialization-boundary type checking**; emitted client as an artifact (`encore gen client`) | SvelteKit, TanStack Start, Encore |
| Auth | A default that works out of the scaffold, not a shopping list | Pick one modern primitive and make it excellent (passkeys/WebAuthn) rather than abstracting five | Adonis/Laravel (table stakes); RedwoodSDK (frontier) |
| Jobs / durable workflows | Queue + scheduler + a **test fake** (`assertPushed`) + a worker command | Durable execution by **directive** (`"use workflow"`), deterministic replay across deploys/crashes | Laravel/Adonis (stakes); Vercel WDK (frontier) |
| Observability | Local dev dashboard with logs + resource health | **Automatic distributed tracing** across services with zero manual instrumentation, queryable in dev and prod | Encore (frontier); Laravel Pulse/Telescope (stakes) |
| Docs / agent readiness | `llms.txt` + per-page raw-markdown twins on the **public docs site** | **Runtime** MCP over the *running app* (traces, routes, DB, pub/sub) + published agent skills + package-authored AI guidelines that install transitively | Nuxt, Next 16, Encore, Laravel Boost, RedwoodSDK |
| Deployment | One command to a container/host, multiple targets | Portability guarantee: "deployment configuration changes; route authoring and server boundaries do not" | TanStack Start, Nitro |

---

## 3. NetScript measured against that bar (verified current state)

### 3.1 What exists and works

- **Contract-first typed data path is real and current.** oRPC `^1.14.6` is a direct dependency of
  both the server and the client packages: `packages/service/deno.json:22-25`
  (`@orpc/server`, `@orpc/openapi`, `@orpc/client`, `@orpc/zod`) and `packages/sdk/deno.json:31-36`
  (adds `@orpc/contract`, `@orpc/tanstack-query`). `@netscript/sdk` describes itself as "Service
  discovery, oRPC clients, and cache-backed query factories" and exports `./client`, `./query`,
  `./query-client`, `./collections`, `./streams`, `./discovery` (`packages/sdk/deno.json`).
  **This clears the "emitted typed client" bar that only Encore also clears.**
- **Jobs/durable workflows exist as first-party plugins, not add-ons.** `@netscript/plugin-sagas`
  — "durable saga orchestration, workflow APIs, and saga runtime metadata"
  (`plugins/sagas/deno.json:4`); `@netscript/plugin-workers` — "background job scheduling, task
  execution, and worker API endpoints"; `@netscript/plugin-triggers`; `@netscript/plugin-streams`
  ("Durable Streams service"). Each exports a uniform seam set — `./contracts`, `./runtime`,
  `./services`, `./cli`, `./aspire`, `./scaffold`, `./doctor`, `./streams`
  (`plugins/sagas/deno.json`, `plugins/workers/deno.json`). Plus substrate packages
  `@netscript/queue` (Deno KV / Redis / AMQP / Postgres adapters **with dead-letter stores per
  backend**) and `@netscript/cron`. **No JS meta-framework in this teardown ships a first-party
  saga/compensation abstraction. This is a genuine differentiator.**
- **Auth is first-party and multi-backend**: `packages/auth-better-auth`, `packages/auth-kv-oauth`,
  `packages/auth-workos`, `packages/plugin-auth-core`, `plugins/auth` ("unified auth API,
  single-active backend selection, auth database schema, and auth session streams"). **Ahead of
  Next/Nuxt/SvelteKit/TanStack on this axis.**
- **Observability is OTEL-native**: `@netscript/telemetry` exports `./tracer`, `./context`,
  `./instrumentation`, `./registry`, `./orpc`, `./hono`, `./ai`, `./otel`, `./query`, `./testing`
  (`packages/telemetry/deno.json`) — i.e. **RPC and HTTP instrumentation is built in, and there is
  a query surface plus a testing surface.** Aspire supplies the dashboard/graph.
- **Agent readiness is genuinely competitive on two of three fronts.**
  1. *Docs site*: `docs/site/_plugins/ai-tooling.ts` emits `/llms.txt` (tiered index) and
     `/llms-full.txt` from live page data (lines 12–15, 116, 120), published at
     `https://rickylabs.github.io/netscript/` (`docs/site/_config.ts:52`).
  2. *Scaffolded projects*: `netscript agent init` writes `llms.txt`/`llms-full.txt` into the user's
     project with a `## Task router` section that is version-checked on regeneration
     (`packages/cli/src/public/adapters/agent/deno-agent-docs-generator.ts:141,236`).
  3. *Runtime MCP*: `@netscript/mcp` — "Token-bounded MCP tools for NetScript diagnostics,
     telemetry insights, docs, and CLI actions" (`packages/mcp/deno.json`), with an immutable
     enumerable tool registry (`createToolRegistry`, `packages/mcp/src/application/tool-registry.ts:63`)
     and flows for doctor/telemetry, bounded CLI execution under a `CommandPolicy`, service +
     operation + schema discovery over an endpoint directory, export-surface discovery, and
     `record_drift`. Exposed via `netscript agent mcp`
     (`packages/cli/src/public/features/agent/mcp/agent-mcp-command.ts`), with a
     `command-policy-parity_test.ts` guarding CLI↔MCP parity.
     **This is Encore-class in kind. Encore ships 19 tools across nine areas; NetScript's registry
     is smaller and should be counted before claiming parity.**
- **CLI generation depth is above every JS competitor except Adonis.** Feature groups:
  `agent config contracts db deploy generate init marketplace plugins root services ui`
  (`packages/cli/src/public/features/`). Notably `services add`, `services add-handler`,
  `services generate`, `services configure` (Adonis-class incremental generation);
  `db` with 16 subcommands including `introspect`, `studio`, `seed`, `migrate`, `resolve`,
  `validate`; `ui add|list|update|remove` over a registry (`packages/cli/src/public/features/ui/registry.ts`,
  shadcn-style); `plugins install|new|scaffold|doctor|update|dispatch|host`; `deploy` with
  `deno-deploy`, `package-cli`, `build`, `target`, `logs`, `status`, `upgrade`; `marketplace
  publish|search`.

### 3.2 Gaps — classified

| # | Gap | Class | Evidence / bar |
|---|---|---|---|
| G1 | **No single-flight mutation semantics.** oRPC + TanStack Query gives typed calls and cache factories (`packages/sdk/deno.json:35`), but nothing in the exports (`./query`, `./query-client`, `./collections`) advertises "this mutation returns the refreshed queries in one round trip". SvelteKit ships this as a named, documented guarantee. | API/type-system seam | <https://svelte.dev/docs/kit/remote-functions#Single-flight-mutations> |
| G2 | **No serialization-boundary type checking on the RPC seam**, and no documented escape hatch equivalent to `createServerFn({ strict: { input: false } })`. Contract-first frameworks are *more* exposed to this than directive-based ones. | API/type-system seam | <https://tanstack.com/start/v0/docs/framework/react/guide/server-functions#serialization-type-checking> |
| G3 | **No durable-execution ergonomics story.** Sagas exist as a plugin with contracts/runtime; the 2026 frontier is a one-line opt-in that survives deploys and crashes with deterministic replay. NetScript should either match the ergonomic (a directive/decorator) or explicitly position sagas as *compensating orchestration*, which is a different and arguably stronger product — but that positioning is not stated anywhere in `README.md:11-18`. | product-expectation / docs-discovery | <https://vercel.com/docs/workflows> |
| G4 | **No `netscript` equivalent of `node ace add <pkg>`** that installs a package *and* wires providers/commands/preloads/config atomically. `plugins install` exists; whether it reaches Adonis's atomicity is unverified from manifests alone. | scaffold/generation | <https://docs.adonisjs.com/guides/digging-deeper/queues#installation> |
| G5 | **No generated typed registry import surface** analogous to `import { controllers } from '#generated/controllers'`. NetScript has `generate runtime-schemas` and `generate plugins` (`packages/cli/src/public/features/generate/`), but the *ergonomic payoff* — a typed object you import instead of strings — is the part users praise. | scaffold/generation | <https://docs.adonisjs.com/guides/basics/controllers> |
| G6 | **No job-testing fake in the public surface.** `@netscript/queue` exports `./testing` and `@netscript/telemetry` exports `./testing`, but `plugins/workers/deno.json` exports no `./testing`. Adonis's `QueueManager.fake()` + `fake.assertPushed(Job, { payload, delay })` is table stakes for jobs. | API/type-system seam | <https://docs.adonisjs.com/guides/digging-deeper/queues#testing> |
| G7 | **MCP tool count and coverage areas are unpublished.** Encore markets "19 tools across nine areas"; Laravel markets an inspector + testable servers + a Record Rule that persists agent rules to `.ai/rules`. NetScript has the machinery (`packages/mcp/src/application/`) but no comparable published tool catalog on the docs site. | docs/discovery | <https://encore.dev/blog/mcp-deep-dive>, <https://laravel.com/docs/13.x/boost> |
| G8 | **No transitive AI-guidelines contract for third-party plugins.** Laravel Boost auto-loads guidelines shipped by any installed package. NetScript has a marketplace (`packages/cli/src/public/features/marketplace/`) and a plugin protocol — the natural place for `plugin ships agent guidelines → installing it teaches the agent` — but nothing in `plugins/*/deno.json` exports an agent/guidelines surface. | docs/discovery + plugin-composition | <https://laravel.com/docs/13.x/boost#third-party-package-ai-guidelines> |
| G9 | **No published agent-skills artifact.** RedwoodSDK serves `.well-known/agent-skills/index.json` and `.well-known/api-catalog`. NetScript's docs site emits llms.txt only (`docs/site/_plugins/ai-tooling.ts:116,120`). | docs/discovery | <https://rwsdk.com/> |
| G10 | **Substrate ecosystem risk, inherited.** Fresh is Preact-only with an acknowledged smaller ecosystem; `packages/fresh-ui` is *excluded from the root `deno task check`* (`deno.json` check task exclude regex `^(packages/(fresh-ui)\|…)`), i.e. the UI package is not type-checked by the default gate. | runtime correctness / gate integrity | `deno.json` (`tasks.check`), <https://strapi.io/blog/fresh-explained-deno-web-framework> |
| G11 | **Praise-line is unowned.** Every framework in this teardown has one crisp thing users repeat (Next: ubiquity; Nuxt: docs; SvelteKit: mental model; TanStack: explicitness; Encore: free tracing; Laravel: completeness; Fresh: zero-JS). `README.md:3-5` leads with six adjectives and no single claim. A meta-framework with no repeatable one-liner does not get repeated. | product-expectation / positioning | `README.md:3-18` |

### 3.3 Where NetScript is genuinely differentiated

Ranked by defensibility, not by effort:

1. **First-party durable *orchestration* (sagas + compensation), not just durable *execution*.**
   Vercel WDK gives replay; nobody in the JS meta-framework space gives sagas with compensation as
   a framework primitive with contracts, runtime, CLI, Aspire wiring and a doctor
   (`plugins/sagas/deno.json`). Encore gives pub/sub; Laravel gives queues. **This is the strongest
   unowned position on the board.**
2. **Aspire as the local-graph orchestrator.** Encore's headline is "no Docker Compose needed —
   real Postgres, local Pub/Sub broker, object storage" (<https://encore.dev/docs/ts>). NetScript
   gets the same outcome from a *standard, non-proprietary* orchestrator (`packages/aspire`,
   `netscript generate aspire`), where Encore's equivalent is proprietary and pushes toward Encore
   Cloud. **"Encore's dev experience without Encore's cloud" is a sayable sentence.**
3. **Plugin composition as the extension unit with a uniform seam contract.** Every plugin exports
   the same set — `./contracts ./runtime ./services ./cli ./aspire ./scaffold ./doctor ./streams`.
   Nuxt modules are the closest analogue and have no equivalent typed seam vocabulary. **This is
   also the natural carrier for G8 (transitive agent guidelines) — a plugin that teaches the agent
   when installed is a category-defining move Laravel only does at package level in PHP.**
4. **Contract-first as the *reason* the agent story works.** Encore's own argument is "because
   infrastructure is declared in code, AI coding assistants can understand and modify your full
   stack". NetScript's oRPC contract + generated runtime schemas + MCP endpoint directory is the
   same argument with a *portable* contract format (oRPC/OpenAPI) rather than a proprietary one.
5. **Deno-native single toolchain.** No node_modules, no bundler config, `deno doc` as the public
   surface, JSR as the registry. Competitors' scaffolds all begin with a package-manager choice
   prompt.

### 3.4 Table stakes NetScript currently misses (do these before differentiating)

In priority order, each traceable to a gap above:

- **G11 → one claim.** Pick the sentence. Recommended: *"The only TypeScript framework where
  background jobs, sagas and streams are first-party — behind one typed contract."*
- **G1/G2 → close the RPC seam to 2026 spec.** Single-flight mutation + serialization type checking
  are the two things a reviewer coming from SvelteKit/TanStack will look for first and not find.
- **G6 → ship `plugins/workers/./testing` with an `assertDispatched`-style fake.** Cheapest
  credibility win on the whole list; Adonis proves the API shape.
- **G7/G9 → publish the MCP tool catalog and an agent-skills artifact on the docs site.** The
  machinery exists (`packages/mcp/src/application/tool-registry.ts:63`); the *marketing surface*
  does not. Competitors win this axis by publishing, not by building.
- **G10 → get `packages/fresh-ui` inside the default check gate** or state publicly why it is out.
  An excluded package in the root gate is the kind of thing an evaluator finds and discounts the
  whole quality story for.
- **G4/G5 → make `plugins install` atomic and emit a typed registry.** Adonis's `node ace add`
  and `#generated/controllers` are the two ergonomics users cite when they say a framework "feels
  finished".

---

## 4. Source index

Next.js: <https://nextjs.org/blog/next-16> ·
<https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents> ·
<https://nextjs.org/docs/app/guides/mcp> · <https://github.com/vercel/next-devtools-mcp> ·
<https://vercel.com/docs/workflows> ·
<https://vercel.com/changelog/open-source-workflow-dev-kit-is-now-in-public-beta>
Nuxt: <https://nuxt.com/llms.txt> · <https://nuxt.com/llms-full.txt> ·
<https://nuxt.com/docs/4.x/guide/going-further/experimental-features> · <https://nitro.build/docs/tasks> ·
<https://github.com/nuxt/nuxt/issues/30471>
SvelteKit: <https://svelte.dev/docs/kit/remote-functions> ·
<https://github.com/sveltejs/kit/discussions/13897> · <https://svelte.dev/blog/whats-new-in-svelte-june-2026>
TanStack Start: <https://tanstack.com/start/v0/docs/framework/react/guide/server-functions> ·
<https://tanstack.com/start/latest> · <https://tanstack.com/blog/announcing-tanstack-start-v1> ·
<https://better-auth.com/docs/integrations/tanstack>
RedwoodSDK: <https://rwsdk.com/> · <https://rwsdk.com/realtime> ·
<https://docs.rwsdk.com/core/authentication/> · <https://github.com/redwoodjs/passkey-addon> ·
<https://developers.cloudflare.com/workers/framework-guides/web-apps/redwoodsdk/>
AdonisJS: <https://docs.adonisjs.com/guides/basics/controllers> ·
<https://docs.adonisjs.com/guides/ace/creating-commands> ·
<https://docs.adonisjs.com/guides/digging-deeper/queues>
Encore: <https://encore.dev/docs/ts> · <https://encore.dev/docs/ts/cli/mcp> ·
<https://encore.dev/docs/go/ai-integration> · <https://encore.dev/blog/mcp-deep-dive> ·
<https://encore.dev/docs/platform/observability/tracing> · <https://bestofjs.org/projects/encore> ·
<https://vovk.dev/blog/backend-framework-comparison>
Laravel: <https://laravel.com/docs/13.x/mcp> · <https://laravel.com/docs/13.x/boost> ·
<https://github.com/laravel/boost> · <https://laravel.com/ai/boost>
Fresh: <https://deno.com/blog/fresh-and-vite> · <https://github.com/freshframework/fresh/issues/2363> ·
<https://strapi.io/blog/fresh-explained-deno-web-framework> · `curl https://jsr.io/@fresh/core/meta.json`
Sentiment (secondary, labelled in text): <https://www.intuz.com/best-frontend-frameworks/> ·
<https://quartzdevs.com/resources/best-fullstack-frameworks-2026-top-meta-frameworks> ·
<https://2025.stateofjs.com/>

## 5. Confidence and residual unknowns

- **High confidence:** all vendor-doc capability claims (§1), all NetScript manifest/path claims (§3.1).
- **Medium:** G4 (`plugins install` atomicity) and G5 (typed registry) were inferred from directory
  listings, not from reading the command implementations — a follow-up should read
  `packages/cli/src/public/features/plugins/install/` and `.../generate/plugins/` before these are
  written into an issue.
- **Medium:** NetScript's MCP tool *count* was not enumerated (flows were read, the registry array
  was not). Do not publish a "N tools" number until `packages/mcp/src/application/tool-registry.ts`
  is read in full.
- **Low/labelled:** all `[sentiment]` items; State of JS figures are quoted through secondary
  aggregators, not the primary survey export.
