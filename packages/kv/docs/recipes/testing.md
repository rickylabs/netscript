---
title: Testing KV Adapters
description: Use @netscript/kv/testing to verify an adapter satisfies the shared KV contract.
package: '@netscript/kv'
order: 2
---

# Testing KV Adapters

## Goal

Run the same behavior contract against every adapter implementation.

## Steps

```ts
import {
  createMemoryKvAdapter,
  runKvStoreContract,
} from 'jsr:@netscript/kv@^0.0.1-alpha.0/testing';

runKvStoreContract({
  name: 'memory',
  make: () => createMemoryKvAdapter(),
});
```

## Pitfalls

The contract creates a fresh adapter per scenario. Do not reuse global adapter instances across
tests because they hide cleanup bugs.
