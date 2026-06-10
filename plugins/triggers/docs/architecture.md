# Architecture

`@netscript/plugin-triggers` is an A5 Plugin Package.

It is the operational layer around `@netscript/plugin-triggers-core`.

## Boundary

The plugin owns manifest contribution and process wiring.

The core package owns trigger behavior.

The plugin imports production cron and watcher primitives.

The core package only defines ports for those primitives.

## Layers

- `src/public/` owns manifest constants and `triggersPlugin`.
- `src/plugin/` mirrors the plugin contribution surface.
- `src/cli/` owns command composition and local project backends.
- `src/scaffolding/` owns generated trigger module templates.
- `src/runtime/` owns cron, watcher, registry, and processor runtime adapters.
- `src/aspire/` owns local orchestration resources and health checks.
- `services/` owns the HTTP API process entrypoint.
- `streams/` owns trigger stream helpers.

## Manifest Axes

The manifest declares services.

The manifest declares contract versions.

The manifest declares runtime config topics.

The manifest declares E2E gates.

The manifest declares an Aspire contribution.

## Runtime Resources

`triggers-api` is the HTTP ingress service.

`trigger-processor` is the background processor resource.

The processor waits for the API resource in Aspire.

Health checks probe `http://localhost:8093/health`.

## Dependency Rules

Application definitions should import from core builders.

The plugin root should stay manifest oriented.

CLI code may import project-file adapters.

Service code may import Hono and oRPC.

Runtime adapters may import cron and watcher packages.

Core runtime logic must stay in the core package.
