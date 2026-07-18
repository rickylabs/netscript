# @netscript/logger

[![JSR](https://jsr.io/badges/@netscript/logger)](https://jsr.io/@netscript/logger)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**Structured logging for NetScript services, packages, workers, and jobs, built on
[LogTape](https://logtape.org/): configure once at startup, create category-scoped loggers, and bind
request-scoped context across the runtime.**

Every NetScript process logs through the same hierarchy: `configureLogging()` sets up LogTape once —
human-readable text in local development, structured JSON in production — and the creator functions
hand out loggers under a consistent `netscript·…` category tree, so a service, a worker, and a job
all emit records an operator can filter the same way. `withContext()` binds request-scoped fields
onto every record emitted inside a callback, and the middleware and oRPC subpaths wire that context
into HTTP and RPC handling automatically.

## Why teams use it

- **Category-scoped creators** — `createServiceLogger`, `createPackageLogger`, `createWorkerLogger`,
  `createJobLogger`, and `createChildLogger` produce loggers with a consistent NetScript category
  hierarchy.
- **One-shot configuration** — `configureLogging` and `ensureLogging` set up LogTape with
  environment-aware sinks; `isLoggingConfigured` and `resetLogging` cover lifecycle and test
  isolation.
- **Hono request logging** — `@netscript/logger/middleware` exposes `loggerMiddleware`, injecting a
  request-scoped logger and request ID and logging start, completion, and failure with
  sensitive-field redaction.
- **oRPC integration** — `@netscript/logger/orpc` exposes `LoggingPlugin` and `createLoggingPlugin`
  to log oRPC handler and client interceptions.
- **LogTape contract re-exported** — `getLogger`, `getConsoleSink`, `withContext`, and the `Logger`,
  `LogRecord`, `LogLevel`, and `Sink` types pass through unchanged, so anything LogTape can do stays
  available.

## Install

```bash
deno add jsr:@netscript/logger@<version>
```

Pin `<version>` to match your installed CLI; bare `jsr:@netscript/*` specifiers do not resolve on
the pre-release line.

## Quick example

```typescript
import { configureLogging, createServiceLogger, withContext } from '@netscript/logger';

await configureLogging({ level: 'info' });

const logger = createServiceLogger('users');
logger.info('Service starting', { port: 3000 });

// Bind request-scoped fields onto every record emitted in the callback.
withContext({ requestId: 'req-42' }, () => {
  logger.info('Handling request');
});
```

In development this prints readable lines under the service category
(`netscript·services·users Service starting`); in production the same calls emit structured JSON.
Use `ensureLogging()` instead of `configureLogging()` on shared startup paths that may run more than
once.

## Public surface

| Entry          | What it gives you                                                                  |
| -------------- | ---------------------------------------------------------------------------------- |
| `.`            | `configureLogging` / `ensureLogging`, category-scoped creators, LogTape re-exports |
| `./middleware` | `loggerMiddleware` and request-ID/logger injection helpers for Hono                |
| `./orpc`       | `LoggingPlugin` / `createLoggingPlugin` for oRPC handler and client logging        |

The always-current symbol list is
[`deno doc jsr:@netscript/logger@<version>`](https://jsr.io/@netscript/logger/doc) (pin `<version>`
on the pre-release line, as above).

## Docs

- **Reference — configuration, creators, middleware, and plugins**:
  [rickylabs.github.io/netscript/reference/logger/](https://rickylabs.github.io/netscript/reference/logger/)
- **Observability — logging, tracing, and the dashboard together**:
  [rickylabs.github.io/netscript/observability/](https://rickylabs.github.io/netscript/observability/)
- **API docs on JSR**: [jsr.io/@netscript/logger/doc](https://jsr.io/@netscript/logger/doc)

## Compatibility

Runs wherever LogTape does — Deno, Node.js, and Bun. Environment-aware sink selection reads
environment variables, so grant `--allow-env` under Deno. The middleware subpath targets Hono 4 and
the oRPC subpath targets `@orpc/server` 1.x; both stay out of your module graph unless imported.

## License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
