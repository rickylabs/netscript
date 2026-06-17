---
title: Error Handling
description: Let framework middleware log request failures without swallowing errors.
package: '@netscript/logger'
order: 4
---

# Error Handling

## Goal

Record failed requests while preserving the framework's normal error flow.

## Prerequisites

Install the Hono middleware at the request edge.

## Steps

```ts
import { Hono } from 'npm:hono@^4';
import {
  loggerMiddleware,
  type LoggerMiddlewareEnv,
} from 'jsr:@netscript/logger@^0.0.1-alpha.0/middleware';

const app = new Hono<LoggerMiddlewareEnv>();

app.use('*', loggerMiddleware('billing', { errorLevel: 'error' }));
app.get('/boom', () => {
  throw new Error('example failure');
});
```

## What This Looked Like

The middleware logs the failure with request duration, error message, and stack, then rethrows the
original error so the framework's configured handler still owns the response.

## Pitfalls

Do not catch and suppress errors only to log them. The middleware records the error and keeps the
crash boundary explicit.
