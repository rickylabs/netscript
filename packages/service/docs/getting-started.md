# Getting Started

Use `defineService()` for generated service entrypoints and `createService()` when an application
needs explicit composition.

```ts
import { defineService } from '@netscript/service';
import { router } from './router.ts';

const running = await defineService(router, {
  name: 'users',
  port: 3000,
});

await running.stop();
```

For tests and host composition, call `build()` instead of `serve()`:

```ts
const app = createService(router, { name: 'users' })
  .withHealth()
  .build();

const response = await app.request('/health');
```
