# @netscript/cron

Runtime-agnostic cron scheduling for Deno applications and NetScript workers.

## Install

```sh
deno add jsr:@netscript/cron
```

Focused subpath imports are available when you need adapters, ports, or the deterministic test
adapter directly:

```ts
import { DenoCronAdapter, MemoryCronAdapter } from '@netscript/cron/adapters';
```

## Quick example

Create a scheduler that auto-detects the best available provider, schedule a job with a preset, and
trigger it:

```ts
import { createScheduler, CronPresets } from '@netscript/cron';

const scheduler = createScheduler();

await scheduler.schedule('daily-report', CronPresets.WEEKDAYS_9AM, async () => {
  await generateDailyReport();
}, {
  timezone: 'America/New_York',
});

await scheduler.trigger('daily-report');
await scheduler.stop();
```

`createScheduler()` uses native `Deno.cron()` when the runtime exposes it and falls back to a
deterministic in-memory adapter for tests and local development. Use `getScheduler()` and
`stopScheduler()` for a shared singleton in simple single-scheduler apps.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/cron/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
