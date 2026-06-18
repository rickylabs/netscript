---
layout: layouts/base.vto
title: "@netscript/logger"
---

# `@netscript/logger`

Structured logging for NetScript packages, services, workers, and jobs. This page is
generated from the package's public surface with `deno doc` (US-2). For the full index of
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

The following entrypoints are published alongside the root export. Their reference pages are
generated separately from their own `deno doc` surface.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/logger` | `./mod.ts` | Core logging surface (documented above). |
| `@netscript/logger/middleware` | `./middleware.ts` | Hono request-logging middleware. |
| `@netscript/logger/orpc` | `./orpc.ts` | oRPC logging plugin. |

---

Back to the [reference overview](/reference/).
