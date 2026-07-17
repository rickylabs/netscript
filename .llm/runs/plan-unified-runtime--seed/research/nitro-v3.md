# Nitro v3 live validation

Evidence date: 2026-07-18. The fetched live-doc digest is preserved at
`../evidence/nitro-v3-live-2026-07-18.md`.

## Verdict

Nitro v3 is a credible **host/output substrate**, but not yet a production-grade replacement for
NetScript's durable adapters. The v3 line is still public beta; its Deno server path requires a
Node-built output and an `--unstable` Deno launch, while database and tasks are separately
experimental. Those are board-level acceptance risks, not reasons to reject Nitro outright.
([v3 beta](https://nitro.build/blog/v3-beta),
[Deno runtime](https://nitro.build/deploy/runtimes/deno),
[database](https://nitro.build/docs/database), [tasks](https://nitro.build/docs/tasks))

## Deno preset maturity and limitations

| Finding                                                                                                                                    | Consequence for Unified                                                                                                                                       | Evidence                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| v3 is a public beta with intentional breaking changes; the migration guide is a living beta document.                                      | Pin an exact Nitro v3 version and make upgrade compatibility a board gate. Do not describe the runtime as stable.                                             | [beta announcement](https://nitro.build/blog/v3-beta), [migration guide](https://nitro.build/docs/migration) |
| `deno_server` is built using Node.js and launched with `deno run --unstable --allow-net --allow-read --allow-env .output/server/index.ts`. | “Deno preset” does not mean a Deno-only build pipeline or stable-API-only artifact. CI needs Node for the build and must audit the broad runtime permissions. | [Deno runtime page](https://nitro.build/deploy/runtimes/deno)                                                |
| `deno_deploy` is a separate provider preset and flow, not the same thing as `deno_server`.                                                 | Treat local/bare-metal Deno and Deno Deploy as separate conformance cells.                                                                                    | [Deno Deploy page](https://nitro.build/deploy/providers/deno-deploy)                                         |
| Default production output remains Node server; `nitro-dev` is always Node/ESM in an isolated worker.                                       | A Deno target must be selected and tested explicitly; local dev does not prove Deno production compatibility.                                                 | [deploy overview](https://nitro.build/deploy)                                                                |

## Full adapter/runtime surface

| Surface         | Live v3 capability                                                                                                                      | Maturity/limit                                                                                                                                           | Unified implication                                                                                                                    | Evidence                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| SQL database    | db0-backed `useDatabase`; SQLite default; `sql`, `exec`, `prepare`; configurable connectors.                                            | Entire database layer is experimental. Default SQLite is documented for development and Node-compatible production, not as a universal preset guarantee. | Keep `@netscript/database` as the application contract; a Nitro database bridge is optional and provider-scoped.                       | [database](https://nitro.build/docs/database)                                                |
| KV/storage      | unstorage-backed `useStorage`; named mounts, many drivers, dynamic plugin mounts, watch support where driver permits.                   | Default storage is in-memory and loses data on restart. Driver semantics vary.                                                                           | Map Nitro mounts behind `KvStore`; never infer persistence, atomics, watch, or consistency from `useStorage` alone.                    | [KV storage](https://nitro.build/docs/storage)                                               |
| Cache           | `defineCachedHandler`, `defineCachedFunction`, route-rule caching, TTL, conditional responses, deduplication.                           | GET/HEAD only for handlers; errors/undefined excluded; cached function values JSON-serializable; request headers require `varies`.                       | Useful host cache, but distinct from general KV and durable workflow state.                                                            | [cache](https://nitro.build/docs/cache)                                                      |
| Tasks/schedules | `defineTask`, `runTask`, cron `scheduledTasks`; croner on process presets; generated Cloudflare/Vercel schedules; optional `waitUntil`. | Experimental; one running invocation per task name; same-name callers share a result; `waitUntil` is runtime-dependent; more native presets are planned. | Suitable for command execution and cron dispatch. It is not, by itself, a durable queue, retry ledger, workflow engine, or saga store. | [tasks](https://nitro.build/docs/tasks)                                                      |
| WebSocket/SSE   | CrossWS/H3 handlers across Node, Bun, Deno, Cloudflare; upgrade/open/message/close/error; peers, namespaces, pub/sub; H3 SSE.           | Feature opt-in; remote address and underlying behavior are adapter-dependent.                                                                            | Host real-time endpoints through Nitro, but keep NetScript stream persistence and auth semantics above the transport.                  | [WebSocket](https://nitro.build/docs/websocket)                                              |
| Lifecycle       | `request`, `response`, `error`, `close`; process errors captured; preset augmentation.                                                  | Static files run before middleware/routes; request-hook errors are reported but do not stop the pipeline; plugin registration is synchronous.            | Define a lifecycle bridge with explicit ordering and cleanup ownership; do not assume Hono/Fresh middleware order matches Nitro.       | [lifecycle](https://nitro.build/docs/lifecycle), [plugins](https://nitro.build/docs/plugins) |

## Cloud deploy presets

Nitro's output contract is real: the same source is transformed by preset, with selection through
environment, CLI, or config, and a compatibility date pins provider behavior. Auto-detected
providers are AWS Amplify, Azure, Cloudflare, Firebase App Hosting, Netlify, StormKit, Vercel, and
Zeabur. ([deploy overview](https://nitro.build/deploy))

Representative first-class pages name these presets:

| Provider/runtime | Preset(s)                               | Notable caveat                                                                          | Evidence                                                        |
| ---------------- | --------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Deno server      | `deno_server`                           | Node-built; Deno `--unstable` and broad permissions.                                    | [Deno](https://nitro.build/deploy/runtimes/deno)                |
| Deno Deploy      | `deno_deploy`                           | Separate linked-repository or token/deployctl flow.                                     | [Deno Deploy](https://nitro.build/deploy/providers/deno-deploy) |
| Cloudflare       | `cloudflare_module`, `cloudflare_pages` | Module preset is recommended; platform adds scheduled/email/queue/tail/trace hooks.     | [Cloudflare](https://nitro.build/deploy/providers/cloudflare)   |
| Vercel           | `vercel`                                | `/api` directory conflicts with Vercel conventions; route function rules may be needed. | [Vercel](https://nitro.build/deploy/providers/vercel)           |
| Netlify          | `netlify`, `netlify_edge`               | Edge runtime uses Deno/V8 and differs from function output.                             | [Netlify](https://nitro.build/deploy/providers/netlify)         |
| AWS Lambda       | `aws_lambda`                            | Streaming and dynamic-import behavior require explicit flags.                           | [AWS Lambda](https://nitro.build/deploy/providers/aws)          |
| Azure SWA        | `azure-swa`                             | Generated/custom routing interaction must be tested.                                    | [Azure](https://nitro.build/deploy/providers/azure)             |
| Genezio          | `genezio`                               | Explicitly experimental.                                                                | [Genezio](https://nitro.build/deploy/providers/genezio)         |

The provider index also documents recipes for Zerops, Koyeb, Zephyr, Heroku, Alwaysdata, Render,
IIS, DigitalOcean, Cleavr, Firebase, GitHub/GitLab Pages, Platform.sh, and others. A documented
provider recipe must not be counted as a distinct runtime preset without its page naming the preset.
([provider index](https://nitro.build/deploy/providers))

## Board inputs

1. Add a Nitro-version/compatibility-date pin and an upgrade conformance gate. This follows directly
   from beta maturity and compatibility-date behavior. ([beta](https://nitro.build/blog/v3-beta),
   [deploy](https://nitro.build/deploy))
2. Make `deno_server`, `deno_deploy`, one Node server preset, and at least one isolate/serverless
   preset separate runtime cells; they do not share identical task, lifecycle, storage, or WebSocket
   behavior. ([tasks](https://nitro.build/docs/tasks),
   [WebSocket](https://nitro.build/docs/websocket))
3. Preserve NetScript contracts above Nitro primitives. Database/tasks are experimental and storage
   defaults to volatile memory, so direct substitution would silently weaken guarantees.
   ([database](https://nitro.build/docs/database), [storage](https://nitro.build/docs/storage))
