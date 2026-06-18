# @netscript/logger

Structured logging for NetScript services, packages, workers, and jobs, built on LogTape.

## Install

```sh
deno add jsr:@netscript/logger
```

Focused subpath imports are available when you need framework integrations:

```ts
import { loggerMiddleware, type LoggerMiddlewareEnv } from '@netscript/logger/middleware';
import { LoggingPlugin } from '@netscript/logger/orpc';
```

## Quick example

Configure logging once at application startup and create a service logger:

```ts
import { configureLogging, createServiceLogger } from '@netscript/logger';

await configureLogging({ level: 'info' });

const logger = createServiceLogger('users');

logger.info('Service starting', { port: 3000 });
```

`configureLogging()` is environment-aware: text logs in local development, JSON logs in production
and deployment environments. Use `ensureLogging()` when shared startup code may run more than once,
and `withContext()` to attach request-scoped fields to live log flows.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/logger/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
- [LogTape documentation](https://logtape.org/)
