---
title: Shared Observability Recipe
description: Use shared diagnostics without adding logging side effects to contract code.
package: '@netscript/shared'
order: 13
---

# Observability

`@netscript/shared` does not emit logs or metrics. It exposes `inspectShared()` so CLIs and owning
packages can render JSON-stable diagnostics at their presentation edge.

```ts
import { inspectShared, positiveInt } from '@netscript/shared';

const report = inspectShared(positiveInt({ description: 'Resource ID' }));
```

Runtime packages should attach telemetry through their own ports or adapters. Do not add a shared
logger dependency to this package.
