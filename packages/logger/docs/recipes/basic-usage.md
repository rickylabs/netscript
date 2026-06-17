---
title: Basic Usage
description: Configure LogTape and create NetScript service, package, worker, and job loggers.
package: '@netscript/logger'
order: 1
---

# Basic Usage

## Goal

Create consistent logger categories for the main NetScript runtime roles.

## Prerequisites

Install `@netscript/logger` and run with `--allow-env` when you use environment-based defaults.

## Steps

```ts
import {
  configureLogging,
  createJobLogger,
  createPackageLogger,
  createServiceLogger,
  createWorkerLogger,
} from 'jsr:@netscript/logger@^0.0.1-alpha.0';

await configureLogging({ level: 'debug', format: 'text' });

const serviceLogger = createServiceLogger('orders');
const packageLogger = createPackageLogger('kv');
const workerLogger = createWorkerLogger('email-dispatch');
const jobLogger = createJobLogger('daily-export');

serviceLogger.info('Service ready');
packageLogger.debug('Cache lookup');
workerLogger.info('Worker listening');
jobLogger.info('Job accepted');
```

## What This Looked Like

Each logger writes to a LogTape category rooted in `netscript`, which lets downstream sinks filter
by service, package, worker, or job without parsing message text.

## Pitfalls

Do not create ad hoc category strings in each handler. Prefer the exported creator that names the
runtime role, then use `createChildLogger` for local subdivisions.
