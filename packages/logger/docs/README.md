---
title: NetScript Logger
description: Documentation map for structured NetScript logging with LogTape, Hono, and oRPC.
package: '@netscript/logger'
order: 0
---

# NetScript Logger

`@netscript/logger` is the structured logging facade used by NetScript packages, services, workers,
jobs, and request middleware. It keeps the root entrypoint focused on logger creation and
configuration while Hono and oRPC integrations live behind dedicated subpaths.

## Contents

| Page                                    | Purpose                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------- |
| [Architecture](./architecture.md)       | Archetype, public surface, layering, and permissions.                   |
| [Concepts](./concepts.md)               | Vocabulary for categories, request context, and LogTape configuration.  |
| [Getting started](./getting-started.md) | First-run setup for service logging and request middleware.             |
| [Recipes](./recipes/README.md)          | Task-oriented examples for service logs, middleware, and observability. |
| [Reference](./reference/README.md)      | Entry point and symbol map for JSR API navigation.                      |

## Package Shape

Logger is an Archetype 2 Integration package with a facade shape. It integrates with LogTape and
framework middleware, but it does not own a storage backend or a multi-adapter port. The package
therefore stays flat and exposes three entrypoints:

| Import                         | Role                                        |
| ------------------------------ | ------------------------------------------- |
| `@netscript/logger`            | Core configuration and logger creators.     |
| `@netscript/logger/middleware` | Hono-compatible request logging middleware. |
| `@netscript/logger/orpc`       | oRPC logging plugin and context helpers.    |

Use the root package when you need process-wide LogTape configuration or named NetScript loggers.
Use the framework subpaths only at request or RPC edges.
