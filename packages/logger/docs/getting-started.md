---
title: Getting Started
description: Configure NetScript logging and add request-scoped logs in a service.
package: '@netscript/logger'
order: 3
---

# Getting Started

Install the package in a Deno project:

```ts
import { configureLogging, createServiceLogger } from 'jsr:@netscript/logger@^0.0.1-alpha.0';

await configureLogging({ level: 'info', format: 'text' });

const logger = createServiceLogger('users');
logger.info('Service starting', { port: 3000 });
```

The 80 percent path is one process-level configuration call and one named logger. Use the service,
package, worker, and job creator functions to keep categories consistent across packages.

## Add Request Logging

Use the middleware subpath at the Hono boundary:

```ts
import { Hono } from 'npm:hono@^4';
import {
  loggerMiddleware,
  type LoggerMiddlewareEnv,
} from 'jsr:@netscript/logger@^0.0.1-alpha.0/middleware';

const app = new Hono<LoggerMiddlewareEnv>();

app.use('*', loggerMiddleware('users'));
app.get('/health', (ctx) => ctx.json({ ok: true }));
```

The middleware injects `logger` and `requestId` into the Hono context. Handlers can log structured
fields without manually reading the request header.

## Run Permissions

When `configureLogging` reads defaults from the environment, run with `--allow-env`. No network,
file, or KV permission is required by the logger package itself.

## Next Steps

Read [basic usage](./recipes/basic-usage.md) for category examples and
[observability](./recipes/observability.md) for request correlation.
