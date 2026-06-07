---
title: Observability
description: Attach request context to structured logs in NetScript services.
package: '@netscript/logger'
order: 3
---

# Observability

## Goal

Propagate request metadata so logs from one request can be correlated.

## Prerequisites

Configure logging before your server starts.

## Steps

```ts
import { createServiceLogger, withContext } from 'jsr:@netscript/logger@^0.0.1-alpha.0';

const logger = createServiceLogger('payments');

await withContext(
  { requestId: 'req_123', operation: 'capture' },
  () => {
    logger.info('Payment capture requested');
  },
);
```

## What This Looked Like

The `requestId` and operation fields travel with the asynchronous callback through LogTape context
storage. Request middleware uses the same pattern around downstream handlers.

## Pitfalls

Context does not replace explicit domain fields. Include important values such as order IDs or job
IDs on the log call itself.
