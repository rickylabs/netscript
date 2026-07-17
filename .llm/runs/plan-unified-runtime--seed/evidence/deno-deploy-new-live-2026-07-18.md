# New Deno Deploy evidence extract

Retrieved: 2026-07-18 (Europe/Zurich). This is a concise extract of the official live pages used by
`research/deno-deploy-new.md`; the linked pages remain authoritative.

## Classic migration and removed queues

Source: https://docs.deno.com/deploy/migration_guide/

- Deno Deploy Classic (`dash.deno.com`) and the subhosting v1 API shut down on 2026-07-20.
- Classic projects are not transferred automatically; the new platform uses a separate account,
  organization, and application model at `console.deno.com`.
- `deployctl` is sunset. The supported CLI path is `deno deploy`.
- The new runtime requires the built-in `Deno.serve()` API; the legacy std `serve()` fails warmup.
- Deno queues (`Deno.Kv.enqueue()` and `Deno.Kv.listenQueue()`) are not supported. The official
  alternatives are an external message queue or a database-backed job queue.
- Deno KV is available, but Classic data is not automatically migrated.
- `Deno.cron()` remains supported.

## Current platform comparison

Source: https://docs.deno.com/deploy/

- The new Deno Deploy is a rework of Classic using Deno 2.0 and a new execution environment.
- The current feature table marks databases and cron supported, but queues unsupported.
- The platform supports integrated builds, full Deno and Node applications, CLI/GitHub deployment,
  static sites, CDN caching, logs, tracing, and metrics.

## Application and build contract

Sources:

- https://docs.deno.com/deploy/getting_started/
- https://docs.deno.com/deploy/reference/builds/
- https://docs.deno.com/runtime/reference/cli/deploy/

- A Deno Deploy application is one deployed web service with one build configuration.
- GitHub monorepos are not yet supported by the getting-started flow.
- A custom dynamic app config declares an install command, build command, working directory,
  JavaScript/TypeScript entrypoint, arguments, and optional static directory.
- The platform executes install/build, prepares an artifact, then sends a warmup request before
  routing the revision.
- Builds can be triggered from linked GitHub commits, the UI, or `deno deploy`; `deno deploy create`
  configures new applications.

## Databases and Deno KV

Sources:

- https://docs.deno.com/deploy/reference/databases/
- https://docs.deno.com/deploy/reference/deno_kv/
- https://docs.deno.com/runtime/reference/cli/deploy/#database-management-1

- An application can be assigned Deno KV, a managed Prisma Postgres database, or a linked external
  database. Deploy injects the appropriate database connection for each timeline/environment.
- Deno KV connects with `Deno.openKv()` after assignment and creates isolated databases per
  timeline.
- The CLI can provision/assign Deno KV and link/assign an external PostgreSQL database.
- Database availability does not imply queue availability: the migration guide and platform table
  explicitly exclude the Deno KV enqueue/listenQueue APIs.

## Nitro's currently documented Deno Deploy provider

Source: https://nitro.build/deploy/providers/deno-deploy

- Nitro names the `deno_deploy` preset and emits `.output/server/index.ts`.
- Every documented deployment path is Classic-specific: it requests a token at `dash.deno.com`,
  invokes `deployctl`, or uses `denoland/deployctl@v1` with a linked Classic project.
- The page does not document `console.deno.com`, `deno deploy`, a new-platform build configuration,
  database assignment, or a queue replacement.
