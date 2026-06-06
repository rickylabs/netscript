---
title: Logger Reference
description: Entry point map for the NetScript logger package public API.
package: '@netscript/logger'
order: 0
---

# Logger Reference

Use JSR's generated API explorer for symbol-level documentation. This page maps the package
entrypoints to the symbols most callers need first.

| Entry point                    | Primary symbols                                                                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@netscript/logger`            | `configureLogging`, `ensureLogging`, `resetLogging`, `createServiceLogger`, `createPackageLogger`, `createWorkerLogger`, `createJobLogger`, `createChildLogger`, `withContext` |
| `@netscript/logger/middleware` | `loggerMiddleware`, `requestLoggerMiddleware`, `injectLogger`, `injectRequestId`, `LoggerMiddlewareEnv`, `LoggerMiddlewareOptions`                                             |
| `@netscript/logger/orpc`       | `LoggingPlugin`, `createLoggingPlugin`, `createLoggerContext`, `LoggingPluginOptions`                                                                                          |

Run `deno doc --lint ./mod.ts ./middleware.ts ./orpc.ts` before publishing.
