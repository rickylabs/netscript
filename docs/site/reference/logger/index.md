---
layout: layouts/base.vto
title: "@netscript/logger"
---

# `@netscript/logger`

Structured logging for NetScript packages, services, workers, and jobs. This page is written
against the package's public surface reported by `deno doc`. For the full index of
packages and plugins return to the [reference overview](/reference/).

The root entrypoint (`@netscript/logger`) exposes the lightweight core surface only:
the NetScript logger creators and configuration helpers, plus a curated re-export of the
underlying [LogTape](https://jsr.io/@logtape/logtape) primitives. Two sub-path exports
carry the framework integrations:

- [`@netscript/logger/middleware`](#sub-path-exports) — Hono request-logging middleware.
- [`@netscript/logger/orpc`](#sub-path-exports) — the oRPC logging plugin.

## Configuration

| Symbol | Signature | Description |
| --- | --- | --- |
| `configureLogging` | `async function configureLogging(config?: LoggingConfig): Promise<void>` | Configure LogTape for NetScript applications, using the provided options or sensible defaults. |
| `ensureLogging` | `async function ensureLogging(config?: LoggingConfig): Promise<void>` | Ensure logging is configured, initializing with defaults if needed. |
| `isLoggingConfigured` | `function isLoggingConfigured(): boolean` | Check whether logging has been configured. |
| `markConfigured` | `function markConfigured(): void` | Mark logging as configured (for manual configuration scenarios). |
| `resetLogging` | `async function resetLogging(): Promise<void>` | Reset the LogTape configuration. |

## Logger creators

| Symbol | Signature | Description |
| --- | --- | --- |
| `createLogger` | `function createLogger(category): Logger` | Create a logger with a custom category hierarchy. |
| `createServiceLogger` | `function createServiceLogger(serviceName: string): Logger` | Create a logger for a NetScript service. |
| `createPackageLogger` | `function createPackageLogger(packageName: string): Logger` | Create a logger for a NetScript package. |
| `createWorkerLogger` | `function createWorkerLogger(workerName: string): Logger` | Create a logger for workers/jobs. |
| `createJobLogger` | `function createJobLogger(jobId: string): Logger` | Create a logger for a job. |
| `createChildLogger` | `function createChildLogger(parent: Logger, name: string): Logger` | Create a child logger from a parent logger, preserving the parent hierarchy. |

## Re-exported LogTape primitives

These symbols are re-exported unchanged from [`@logtape/logtape`](https://jsr.io/@logtape/logtape)
and form the core logging contract.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `getLogger` | function | `function getLogger(): Logger` | Get a logger for the given category. |
| `getConsoleSink` | function | `function getConsoleSink()` | A console sink factory that logs records to the console. |
| `configure` | function | `async function configure(config: Config): Promise<void>` | Configure the loggers with the specified sinks, filters, and loggers. |
| `withContext` | function | `function withContext(context: Record, callback): T` | Run a callback with the given implicit context attached to every log record. |
| `Logger` | interface | `interface Logger` | A logger interface providing methods to log messages at different levels. |
| `LogRecord` | interface | `interface LogRecord` | A single log record. |
| `LogLevel` | type alias | `type LogLevel` | The severity level of a `LogRecord`. |
| `Sink` | type alias | `type Sink` | A function that accepts a log record and writes it somewhere. |

## Types

| Symbol | Kind | Description |
| --- | --- | --- |
| `LoggerOptions` | interface | Options for creating loggers. |
| `LoggingConfig` | interface | Logging configuration options accepted by `configureLogging`. |
| `RequestLogContext` | interface | Request context used by the logging middleware. |

## Sub-path exports

The following entrypoints are published alongside the root export. Their public symbols are
documented here from each entrypoint's own `deno doc` surface.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/logger` | `./mod.ts` | Core logging surface (documented above). |
| `@netscript/logger/middleware` | `./middleware.ts` | Hono request-logging middleware. |
| `@netscript/logger/orpc` | `./orpc.ts` | oRPC logging plugin. |

### `@netscript/logger/middleware`

| Symbol | Kind | Description |
| --- | --- | --- |
| `Logger` | interface | Re-export of the root `Logger` type for consumers that import only the middleware sub-path. |
| `LoggerContextVariables` | interface | The `logger` and `requestId` values installed on a request context; use it as the Hono variables shape when reading those values downstream. |
| `LoggerMiddlewareRequest` | interface | Minimal request contract the middleware reads: headers, method, normalized path, and absolute URL. Consumers meet it when adapting or testing the middleware without a concrete Hono context. |
| `LoggerMiddlewareResponse` | interface | Minimal response contract the middleware reads for the downstream HTTP status. Consumers meet it when adapting or testing a middleware context. |
| `LoggerMiddlewareContext` | interface | Minimal context accepted by the middleware, combining request and response access with setters for `logger` and `requestId`. |
| `LoggerMiddlewareEnv` | interface | Hono environment shape whose `Variables` are `LoggerContextVariables`; use it as the app or route environment when installing the middleware. |
| `LoggerMiddlewareOptions` | interface | Controls skipped paths and request, success, and error log levels. `logBody` is reserved for a future implementation and currently has no effect. |
| `LoggerMiddlewareNext` | type alias | Downstream middleware callback that resolves after the next handler completes. |
| `LoggerMiddleware` | type alias | Public request-logging handler signature over `LoggerMiddlewareContext` and `LoggerMiddlewareNext`. |
| `injectLogger` | function | Stores a supplied `Logger` under the context's `logger` variable; use it when composing custom middleware around the package's context contract. |
| `injectRequestId` | function | Stores and returns the `X-Request-ID` header value, or a generated short UUID segment when the header is absent. |
| `loggerMiddleware` | function | Creates the full Hono integration: injects a service logger and request ID, skips configured paths, and logs request start, completion, and failure. |
| `requestLoggerMiddleware` | function | Creates the lightweight integration that injects a service logger and request ID and logs request receipt before running the downstream handler. |

### `@netscript/logger/orpc`

| Symbol | Kind | Description |
| --- | --- | --- |
| `Logger` | interface | Re-export of the root `Logger` type for consumers that import only the oRPC sub-path. |
| `RootLoggingInterceptorOptions` | interface | Root-interceptor input containing the `next` callback. Consumers meet it when implementing or testing a root logging interceptor. |
| `ClientLoggingInterceptorOptions` | interface | Procedure-interceptor input containing the procedure input, path, and `next` callback. Consumers meet it when implementing or testing a client interceptor. |
| `RootLoggingInterceptor` | type alias | Root-level interceptor signature that wraps the next interceptor or handler and resolves to its result. |
| `ClientLoggingInterceptor` | type alias | Procedure-level interceptor signature that can inspect the procedure input and path before delegating. |
| `LoggingInterceptor` | type alias | Union accepted by the plugin's root and client interceptor arrays. |
| `LoggingHandlerOptions` | interface | Mutable handler options whose interceptor arrays `LoggingPlugin.init` creates or appends to. Consumers meet it when initializing the plugin outside the concrete oRPC handler type. |
| `LogLevelConfig` | interface | Optional log levels for procedure start, success, client-error, and server-error events. |
| `LoggingPluginOptions` | interface | Plugin configuration for service identity, debug behavior, levels, input summaries, skipped paths, and an optional custom logger. |
| `LoggingPlugin` | class | oRPC handler plugin that installs a root request interceptor and a procedure interceptor for correlated request, completion, and failure logging. |
| `createLoggingPlugin` | function | Constructs a `LoggingPlugin`; use it as the factory alternative to calling the class constructor directly. |
| `LoggerContext` | interface | Logger and generated request ID returned for injection into an oRPC handler context. |
| `createLoggerContext` | function | Creates a service-scoped logger with a generated request ID and returns both as a `LoggerContext`. |

---

Back to the [reference overview](/reference/).
