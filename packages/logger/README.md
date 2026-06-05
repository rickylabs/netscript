# `@netscript/logger`

[![JSR](https://jsr.io/badges/@netscript/logger)](https://jsr.io/@netscript/logger)
[![Deno](https://img.shields.io/badge/runtime-Deno-000000?logo=deno&logoColor=white)](https://deno.com/)
[![License](https://img.shields.io/badge/license-MIT-0f172a)](https://opensource.org/licenses/MIT)

Structured logging for NetScript services, packages, workers, and jobs, built on LogTape. The root
entrypoint stays lightweight and integration-specific surfaces are isolated behind dedicated Hono
and oRPC subpaths.

## Features

- **Hierarchical loggers** — Create service, package, worker, job, and child loggers with consistent
  NetScript category naming
- **LogTape v2 builtins** — Uses `Logger.getChild()`, `withContext()`, and `getJsonLinesFormatter()`
  instead of package-local reinventions
- **Lightweight root entrypoint** — Import `@netscript/logger` without pulling Hono or oRPC into the
  root module graph
- **Hono middleware** — Request logging, request ID injection, and typed middleware contracts via
  `@netscript/logger/middleware`
- **oRPC integration** — Procedure-level request, success, and error logging via
  `@netscript/logger/orpc`
- **Environment-aware configuration** — Text logs in local development, JSON logs in production and
  deployment environments
- **Test-friendly lifecycle** — `resetLogging()` clears LogTape and the package’s configured state
  for isolated test runs

## Install

```ts
// deno.json
{
  "imports": {
    "@netscript/logger": "jsr:@netscript/logger@^0.1.0"
  }
}
```

Focused subpath imports are available when you need framework integrations:

```ts
import { loggerMiddleware, type LoggerMiddlewareEnv } from '@netscript/logger/middleware';
import { LoggingPlugin } from '@netscript/logger/orpc';
```

## Quick Start

Configure logging once at application startup and create a service logger:

```ts
import { configureLogging, createServiceLogger } from '@netscript/logger';

await configureLogging({ level: 'info' });

const logger = createServiceLogger('users');

logger.info('Service starting', {
  port: 3000,
});
```

## Entry Points

| Import                         | Purpose                                                                  | Key Exports                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `@netscript/logger`            | Root logger creators, configuration helpers, and LogTape core re-exports | `configureLogging`, `ensureLogging`, `createServiceLogger`, `createPackageLogger`, `createWorkerLogger`, `createJobLogger`, `withContext` |
| `@netscript/logger/middleware` | Hono request logging middleware and request-scoped context contracts     | `loggerMiddleware`, `requestLoggerMiddleware`, `injectLogger`, `injectRequestId`, `LoggerMiddlewareEnv`                                   |
| `@netscript/logger/orpc`       | oRPC logging plugin and request-context helpers                          | `LoggingPlugin`, `createLoggingPlugin`, `createLoggerContext`                                                                             |

## Usage

### Create package and worker loggers

```ts
import { createJobLogger, createPackageLogger, createWorkerLogger } from '@netscript/logger';

const packageLogger = createPackageLogger('sdk');
const workerLogger = createWorkerLogger('email-dispatch');
const jobLogger = createJobLogger('job_123');

packageLogger.debug('Cache warmup started');
workerLogger.info('Worker listening');
jobLogger.info('Job accepted');
```

### Create a child logger

```ts
import { createChildLogger, createServiceLogger } from '@netscript/logger';

const serviceLogger = createServiceLogger('orders');
const paymentLogger = createChildLogger(serviceLogger, 'payments');

paymentLogger.info('Payment authorization requested');
```

### Bootstrap logging safely from shared startup code

```ts
import { ensureLogging } from '@netscript/logger';

await ensureLogging({
  level: 'debug',
  format: 'text',
});
```

`ensureLogging()` is safe to call multiple times. The first call configures LogTape; later calls are
no-ops until `resetLogging()` is used.

### Add Hono request logging

```ts
import { Hono } from 'hono';
import { loggerMiddleware, type LoggerMiddlewareEnv } from '@netscript/logger/middleware';

const app = new Hono<LoggerMiddlewareEnv>();

app.use('*', loggerMiddleware('users'));

app.get('/users', (ctx) => {
  ctx.get('logger').info('Listing users', {
    requestId: ctx.get('requestId'),
  });

  return ctx.json({ ok: true });
});
```

### Add oRPC logging

```ts
import { RPCHandler } from '@orpc/server/fetch';
import { LoggingPlugin } from '@netscript/logger/orpc';

const rpcHandler = new RPCHandler(router, {
  plugins: [
    new LoggingPlugin({
      serviceName: 'users',
      debug: true,
    }),
  ],
});
```

### Propagate request-scoped context explicitly

```ts
import { createServiceLogger, withContext } from '@netscript/logger';

const logger = createServiceLogger('payments');

await withContext(
  { requestId: 'req_123', operation: 'capture' },
  async () => {
    logger.info('Capturing payment');
  },
);
```

## Configuration

`configureLogging()` uses environment-aware defaults:

| Environment                  | Default format | Default level             |
| ---------------------------- | -------------- | ------------------------- |
| local development            | `text`         | `debug`                   |
| `DENO_ENV=production`        | `json`         | `info`                    |
| `DENO_DEPLOYMENT_ID` present | `json`         | `debug` unless overridden |

Relevant environment variables:

| Variable              | Effect                                              |
| --------------------- | --------------------------------------------------- |
| `NETSCRIPT_LOG_LEVEL` | Overrides the default minimum level                 |
| `NETSCRIPT_DEBUG`     | Forces the NetScript logger category to `debug`     |
| `DENO_ENV`            | Switches default output toward production-safe JSON |
| `DENO_DEPLOYMENT_ID`  | Treats the runtime as a deployment environment      |
| `NO_COLOR`            | Disables colored console output in text mode        |

## Notes

- The root entrypoint intentionally does not export Hono or oRPC helpers. Import those from
  `@netscript/logger/middleware` and `@netscript/logger/orpc`.
- The Hono middleware logs responses with status `>= 400` at the configured `errorLevel`, which
  defaults to `warn`. A warning-level `HTTP request completed` log usually means the request
  returned a 4xx/5xx status, not that the middleware itself failed.
- The package uses LogTape context-local storage during configuration so `withContext()` works in
  live request flows.

## Resources

- [LogTape documentation](https://logtape.org/)
- [JSR package page](https://jsr.io/@netscript/logger)
- [`@netscript/service`](https://jsr.io/@netscript/service) — service bootstrap package that
  consumes the Hono and oRPC integrations
- [Hono](https://hono.dev/)
- [oRPC](https://orpc.unnoq.com/)

## License

MIT
