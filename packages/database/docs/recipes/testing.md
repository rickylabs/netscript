---
title: Database Testing
description: Use @netscript/database/testing to verify adapter contract behavior.
package: '@netscript/database'
order: 3
---

# Database Testing

## Goal

Run the same contract against every database adapter.

```ts
import {
  createMockDatabaseAdapter,
  runDatabaseAdapterContract,
} from 'jsr:@netscript/database@^0.0.1-alpha.0/testing';

runDatabaseAdapterContract({
  name: 'mock',
  make: () => createMockDatabaseAdapter(),
});
```

## Pitfalls

The contract creates a fresh adapter per scenario. Do not share live clients between tests.
