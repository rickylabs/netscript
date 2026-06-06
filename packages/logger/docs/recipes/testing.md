---
title: Testing Logger Setup
description: Reset logger configuration between tests that configure LogTape.
package: '@netscript/logger'
order: 2
---

# Testing Logger Setup

## Goal

Keep tests isolated when multiple scenarios configure LogTape.

## Prerequisites

Use the package test task or run `deno test --allow-env`.

## Steps

```ts
import {
  configureLogging,
  isLoggingConfigured,
  resetLogging,
} from 'jsr:@netscript/logger@^0.0.1-alpha.0';

await resetLogging();
await configureLogging({ level: 'info', format: 'text' });

if (!isLoggingConfigured()) {
  throw new Error('expected logging to be configured');
}

await resetLogging();
```

## What This Looked Like

The test starts from a clean logging state, configures LogTape, asserts the package state, and then
cleans up before the next scenario.

## Pitfalls

Do not let a test depend on LogTape state created by an earlier test. Call `resetLogging` in the
scenario that owns configuration.
