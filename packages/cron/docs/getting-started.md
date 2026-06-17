---
title: Getting Started
description: First steps with @netscript/cron.
package: '@netscript/cron'
order: 3
---

# Getting Started

Install the package:

```bash
deno add jsr:@netscript/cron@^0.0.1-alpha.0
```

Create a scheduler:

```ts
import { createScheduler, CronPresets } from '@netscript/cron';

const scheduler = createScheduler({ provider: 'memory' });

await scheduler.schedule('daily-report', CronPresets.EVERY_DAY, async () => {
  await generateReport();
});
```

Use the testing entrypoint when a consumer test needs the in-memory adapter directly:

```ts
import { MemoryCronAdapter } from '@netscript/cron/testing';

const scheduler = new MemoryCronAdapter();
await scheduler.schedule('sync', '* * * * *', async () => {});
await scheduler.trigger('sync');
await scheduler.stop();
```
