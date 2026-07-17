# Nitro v3 live-doc extract — 2026-07-18

This is a concise extraction from the live Nitro v3 documentation fetched on
2026-07-18. It preserves source URLs and the facts used by the Stage-B corpus;
the linked pages remain authoritative.

## Maturity and Deno

- Nitro v3 is a **public beta**, built around Web Standards, Rolldown, and Vite
  v8. The beta announcement also states a Node.js 20 minimum for the v3 toolchain.
  Source: https://nitro.build/blog/v3-beta
- The v3 migration guide calls itself a living document for a beta and records
  intentional backward-incompatible changes, including renamed/removed presets.
  Source: https://nitro.build/docs/migration
- The `deno_server` page says to build the Nitro server **using Node.js**, then
  launch `.output/server/index.ts` with
  `deno run --unstable --allow-net --allow-read --allow-env`.
  Source: https://nitro.build/deploy/runtimes/deno
- Deno Deploy is a distinct `deno_deploy` preset. The documented paths are a
  Deno Deploy project linked to GitHub or a token-driven `deployctl` flow.
  Source: https://nitro.build/deploy/providers/deno-deploy

## Runtime surface

- Database: built-in lightweight SQL via db0; SQLite is the default only for
  development and Node-compatible production. The whole database layer is
  experimental and requires `experimental.database`. Primary API:
  `useDatabase`, `db.sql`, `db.exec`, `db.prepare`.
  Source: https://nitro.build/docs/database
- KV/storage: `useStorage()` exposes unstorage-backed mounts. The default mount
  is memory and therefore does not persist across restarts; drivers and dynamic
  plugin mounts supply persistent backends. Source: https://nitro.build/docs/storage
- Cache: ocache-backed handler/function caching (`defineCachedHandler`,
  `defineCachedFunction`) sits on the storage layer. It supports route rules,
  TTL/`maxAge`, conditional responses, and request deduplication. Only GET/HEAD
  handlers are cached; error/undefined responses are excluded; cached function
  values must be JSON-serializable. Source: https://nitro.build/docs/cache
- Tasks: the task API is experimental and requires `experimental.tasks`.
  `defineTask` and `runTask` model named one-off operations. Cron schedules are
  supported through `scheduledTasks`; process presets use croner, while
  Cloudflare/Vercel receive generated native schedule configuration. Each task
  name has at most one concurrent invocation; same-name callers share its result.
  `context.waitUntil` is optional and runtime-dependent. More native preset
  integrations are explicitly planned. Source: https://nitro.build/docs/tasks
- WebSocket: opt-in `features.websocket` support is powered by CrossWS/H3 and
  documented for Node, Bun, Deno, and Cloudflare. Handlers expose `upgrade`,
  `open`, `message`, `close`, and `error`, plus namespaces, peers, topics,
  publish/subscribe, send, close, and terminate. Source: https://nitro.build/docs/websocket
- Lifecycle: runtime hooks are `request`, `response`, `error`, and `close`.
  Static assets are checked before middleware/routes; process-level unhandled
  rejections and exceptions enter the error hook; `close` is the cleanup hook.
  Presets may augment the hook interface. Source: https://nitro.build/docs/lifecycle
- Plugins: `definePlugin` synchronously registers runtime behavior and hooks;
  hooks may themselves be async, but the plugin function returns void.
  Source: https://nitro.build/docs/plugins

## Deployment presets/providers

- The default production output is a Node.js server; development always uses
  `nitro-dev`. A preset is selected with `NITRO_PRESET`, `SERVER_PRESET`,
  `--preset`, or config. Nitro auto-detects AWS Amplify, Azure, Cloudflare,
  Firebase App Hosting, Netlify, StormKit, Vercel, and Zeabur. Compatibility
  dates deliberately pin provider behavior and should be updated with testing.
  Source: https://nitro.build/deploy
- Provider docs enumerate Vercel, Deno Deploy, Zerops, Azure, Koyeb, Cloudflare,
  Zephyr, Heroku, Netlify, Genezio, Alwaysdata, Zeabur, Render, StormKit, IIS,
  DigitalOcean, Cleavr, AWS Lambda, Firebase, AWS Amplify, GitHub Pages,
  Platform.sh, and GitLab Pages. A provider page is not necessarily a distinct
  first-class runtime preset; some are recipes around the standard server.
  Source index: https://nitro.build/deploy/providers
- Exact representative preset names from provider pages: Cloudflare
  `cloudflare_module`/`cloudflare_pages`; Vercel `vercel`; Netlify
  `netlify`/`netlify_edge`; AWS Lambda `aws_lambda`; Azure `azure-swa`; Deno
  Deploy `deno_deploy`; Genezio `genezio` (explicitly experimental).
  Sources: https://nitro.build/deploy/providers/cloudflare,
  https://nitro.build/deploy/providers/vercel,
  https://nitro.build/deploy/providers/netlify,
  https://nitro.build/deploy/providers/aws,
  https://nitro.build/deploy/providers/azure,
  https://nitro.build/deploy/providers/deno-deploy,
  https://nitro.build/deploy/providers/genezio

