# Market patterns for unified deployment

Research date: 2026-07-18. This is the mandatory external leg of Stage B. Fetch extracts are saved
at `../evidence/market-frameworks-live-2026-07-18.md`; original URLs remain the authority.

## Comparable models

| Framework                     | Single/decomposed deployment model                                                                                                                                                                                                                                                                                                                                                                            | What NetScript can steal                                                                                                                                                                                              | What NetScript must beat                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nuxt / Nitro                  | A conventional Node output starts one generated `.output/server/index.mjs`; Nitro can alternatively emit `node_cluster`, PM2-oriented, serverless, and provider-specific output. ([Nuxt deployment](https://nuxt.com/docs/4.x/getting-started/deployment), [Nitro deploy](https://nitro.build/deploy))                                                                                                        | One application model compiled through named presets, with a boring default server artifact and an explicit cluster escape hatch. ([Nuxt deployment](https://nuxt.com/docs/4.x/getting-started/deployment))           | Nitro's preset changes packaging and hosting, but NetScript also has to preserve durable KV/queue/database and background-execution semantics across those targets; Nitro marks database and tasks experimental. ([Nitro database](https://nitro.build/guide/database), [Nitro tasks](https://nitro.build/guide/tasks))                                                                         |
| Next.js standalone            | `output: "standalone"` emits a minimal server plus output-file-traced dependencies; static/public files require deliberate copying, and monorepos may need an expanded tracing root. ([Next.js output docs](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output))                                                                                                                        | Produce a self-describing, minimal deploy artifact from dependency tracing rather than copying the whole workspace. ([Next.js output docs](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output)) | Make assets, migrations, plugin registries, native binaries, and sidecar requirements explicit in the artifact contract; Next's documented static-file and monorepo caveats show why “standalone” alone is not enough. ([Next.js output docs](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output))                                                                        |
| React Router 7 framework mode | Deployment may be full-stack, static, Docker, or a provider template. Its adapter contract translates a host request to a Web Fetch `Request`, calls the framework handler, and translates the `Response` back; official targets include Node, Express, and Cloudflare. ([RR deployment](https://reactrouter.com/start/framework/deploying), [RR adapter API](https://reactrouter.com/api/other-api/adapter)) | Standardize the Web Request/Response seam and make host adapters thin, independently testable translations. ([RR adapter API](https://reactrouter.com/api/other-api/adapter))                                         | Cover background resources and service-to-service composition in the same contract; React Router's published adapter boundary is request-handler focused. ([RR adapter API](https://reactrouter.com/api/other-api/adapter))                                                                                                                                                                     |
| SvelteKit                     | Small build adapters transform one app for automatic providers, official targets, or community targets. `adapter-node` emits `node build`, while environment, proxy trust, and graceful shutdown are documented operator inputs. ([SvelteKit adapters](https://svelte.dev/docs/kit/adapters), [adapter-node](https://svelte.dev/docs/kit/adapter-node))                                                       | Keep provider selection at the build boundary and publish a clear generic-server fallback. ([SvelteKit adapters](https://svelte.dev/docs/kit/adapters))                                                               | Include lifecycle and operator metadata in NetScript's contract—shutdown, trust boundaries, env, health, telemetry—rather than treating a successful build as deployment completeness. ([adapter-node](https://svelte.dev/docs/kit/adapter-node))                                                                                                                                               |
| Redwood                       | Redwood separates a static `web` side from API code and supports serverless or serverful deployment; its Docker path runs web and API as distinct units. ([Redwood deployment](https://docs.redwoodjs.com/docs/deploy/introduction), [Redwood Docker](https://docs.redwoodjs.com/docs/docker))                                                                                                                | Preserve one developer project while allowing target-specific web/API artifacts and independently scalable units. ([Redwood deployment](https://docs.redwoodjs.com/docs/deploy/introduction))                         | Avoid making the web/API split the only topology. The unified contract should allow true in-process mounting when capabilities permit and deliberate decomposition when they do not. Redwood's documented Docker topology is distinct web/API units. ([Redwood Docker](https://docs.redwoodjs.com/docs/docker))                                                                                 |
| Wasp                          | Production is described as three components—a Node server, static client, and PostgreSQL—which may be deployed separately; Wasp generates a server Dockerfile. ([Wasp deployment](https://wasp.sh/docs/deployment/deployment-methods/overview))                                                                                                                                                               | Generate topology-aware deployment artifacts from a higher-level application definition. ([Wasp deployment](https://wasp.sh/docs/deployment/deployment-methods/overview))                                             | Generalize beyond a fixed client/server/Postgres triplet: NetScript ships database, KV, queue, worker, saga, trigger, and stream contracts whose capability needs vary by target. (`packages/database/ports/database-client.ts:80-127`, `packages/kv/types/kv-store.ts:19-98`, `packages/queue/ports/message-queue.ts:80-133`, `packages/plugin-sagas-core/src/domain/saga-definition.ts:1-57`) |

## Cross-market contract

The repeated external pattern is **one source/application model, multiple target adapters, and a
generated artifact whose topology may differ by target**. Nitro, React Router, and SvelteKit all put
target translation at an adapter/preset boundary rather than in application routes.
([Nitro deploy](https://nitro.build/deploy),
[RR adapter API](https://reactrouter.com/api/other-api/adapter),
[SvelteKit adapters](https://svelte.dev/docs/kit/adapters)) Next and Wasp additionally demonstrate
that generated artifacts need explicit dependency/component inventories, not merely an entry file.
([Next.js output docs](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output),
[Wasp deployment](https://wasp.sh/docs/deployment/deployment-methods/overview))

The board can therefore steal four concrete rules:

1. Define a stable Fetch handler boundary for HTTP composition, following React Router's host
   translation contract and the shipped NetScript `FetchHandler` surface.
   ([RR adapter API](https://reactrouter.com/api/other-api/adapter),
   `packages/service/src/types.ts:206-212`)
2. Make target presets pure declarations of capabilities, artifact shape, and operational
   requirements; Nitro and SvelteKit make the build adapter the target boundary.
   ([Nitro deploy](https://nitro.build/deploy),
   [SvelteKit adapters](https://svelte.dev/docs/kit/adapters))
3. Emit a manifest that lists server entry points, assets, traced dependencies, migrations, durable
   resources, schedules, sidecars, and shutdown/health behavior. Next documents the failure modes of
   implicit assets and monorepo tracing, while SvelteKit documents runtime operator knobs.
   ([Next.js output docs](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output),
   [adapter-node](https://svelte.dev/docs/kit/adapter-node))
4. Treat “single” and “multi” as two realizations of one logical graph, not as separate product
   models. Redwood and Wasp keep one project while permitting decomposed deployment, and Nuxt/Nitro
   can emit one server or clustered/provider output.
   ([Redwood deployment](https://docs.redwoodjs.com/docs/deploy/introduction),
   [Wasp deployment](https://wasp.sh/docs/deployment/deployment-methods/overview),
   [Nuxt deployment](https://nuxt.com/docs/4.x/getting-started/deployment))

## Competitive bar for NetScript

NetScript should not define “unified” as merely producing one server bundle. Its differentiator is a
**capability-checked composition graph** that can mount HTTP services in-process while retaining the
same logical resource contracts when a database, queue, scheduler, worker, saga, trigger, or stream
must become provider-backed or separately supervised. The need follows from the shipped adapter
surfaces (`packages/database/ports/database-client.ts:80-127`,
`packages/kv/types/kv-store.ts:19-98`, `packages/queue/ports/message-queue.ts:80-133`) and Nitro's
experimental/target-dependent data and task facilities.
([Nitro database](https://nitro.build/guide/database),
[Nitro tasks](https://nitro.build/guide/tasks))

The acceptance bar should consequently require the same application graph to either (a) produce a
one-listener local/server artifact when all capabilities fit or (b) reject that preset with a
specific reason and emit a declared multi-unit/provider topology. That is stricter than the
request-only adapter contracts documented by React Router and the fixed component decomposition
documented by Wasp. ([RR adapter API](https://reactrouter.com/api/other-api/adapter),
[Wasp deployment](https://wasp.sh/docs/deployment/deployment-methods/overview))
