---
title: Testing Shared Contracts
description: Test package-owned schemas and resource error inference.
package: '@netscript/shared'
order: 12
---

# Testing

Shared package tests focus on public behavior and small invariants.

```ts
import { getResourceType } from '@netscript/shared';

Deno.test('resource names skip version path segments', () => {
  if (getResourceType({ path: ['v1', 'users'] }) !== 'user') {
    throw new Error('expected singular resource name');
  }
});
```

Do not import private implementation files from consumer tests. Exercise the root surface whenever a
symbol is published.
