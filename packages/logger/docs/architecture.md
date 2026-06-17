---
title: Logger Architecture
description: Archetype 2 facade architecture for NetScript structured logging.
package: '@netscript/logger'
order: 1
---

# Logger Architecture

`@netscript/logger` implements the Archetype 2 Integration pattern for logging, but it deliberately
uses the one-adapter facade variant. LogTape is the external system, and the package adds
NetScript-specific category names, environment defaults, and request/RPC context wiring.

## Layered Shape

The package is intentionally flat because the total source size is small and the public surface has
three focused entrypoints.

| Layer          | Files                                | Responsibility                                           |
| -------------- | ------------------------------------ | -------------------------------------------------------- |
| Public surface | `mod.ts`, `middleware.ts`, `orpc.ts` | Curated entrypoints for core, Hono, and oRPC callers.    |
| Application    | `config.ts`, `creators.ts`           | Configure LogTape and create NetScript category loggers. |
| Domain         | `types.ts`, `constants.ts`           | Configuration types and reusable logging constants.      |
| Adapter edge   | `middleware.ts`, `orpc-plugin.ts`    | Framework integration at Hono and oRPC boundaries.       |

Flow: caller -> public entrypoint -> configuration or framework edge -> LogTape.

## Public Surface

| Subpath        | Purpose                                                                   |
| -------------- | ------------------------------------------------------------------------- |
| `.`            | `configureLogging`, `ensureLogging`, logger creators, LogTape core types. |
| `./middleware` | `loggerMiddleware`, `requestLoggerMiddleware`, context variable types.    |
| `./orpc`       | `LoggingPlugin`, `createLoggingPlugin`, oRPC logging context helpers.     |

The root entrypoint avoids Hono and oRPC imports so core consumers do not pay for framework-specific
module graphs.

## Axioms In Play

| Axiom                   | How the package applies it                                                           |
| ----------------------- | ------------------------------------------------------------------------------------ |
| A1 public types first   | `LoggingConfig`, `LoggerMiddlewareEnv`, and oRPC options are exported contracts.     |
| A2 simple over easy     | The root quickstart is `configureLogging` plus one logger creator.                   |
| A6 helper justification | Helpers encode NetScript category and request-context policy, not platform wrappers. |
| A7 Web Platform first   | Request IDs use `crypto.randomUUID`; timing uses `performance.now`.                  |
| A10 composition root    | `configureLogging` is the single LogTape wiring function.                            |

## Anti-patterns Avoided

| Anti-pattern                | Avoidance                                                             |
| --------------------------- | --------------------------------------------------------------------- |
| AP-3 God interface          | Logger does not invent a logging port over LogTape.                   |
| AP-8 Premature DI container | Callers configure LogTape with one function.                          |
| AP-11 Hidden globals        | Configuration is explicit and resettable for tests.                   |
| AP-16 Helpers folder        | No generic helper folders exist.                                      |
| AP-19 Silent permissions    | README and docs declare `--allow-env` for environment-based defaults. |

## Permissions

`configureLogging` reads environment variables such as `NETSCRIPT_LOG_LEVEL`, `NETSCRIPT_DEBUG`,
`DENO_ENV`, `DENO_DEPLOYMENT_ID`, and `NO_COLOR`. Applications that call it with defaults need
`--allow-env`. Supplying a fully explicit config still uses LogTape console sinks but does not
require network, file, or KV permissions.
