# `@netscript/cron`

[![JSR](https://jsr.io/badges/@netscript/cron)](https://jsr.io/@netscript/cron)
[![Deno](https://img.shields.io/badge/runtime-Deno-000000?logo=deno&logoColor=white)](https://deno.com/)
[![License](https://img.shields.io/badge/license-MIT-0f172a)](https://opensource.org/licenses/MIT)

Runtime-agnostic cron scheduling for Deno applications and NetScript workers. It provides one
scheduler interface across native `Deno.cron()` and an in-memory adapter for tests, local
development, and deterministic flows.

## Features

- **One scheduler contract** — Use the same `CronScheduler` API across runtime-backed and in-memory
  scheduling.
- **Native Deno support** — Uses `Deno.cron()` when the runtime exposes it.
- **Deterministic test adapter** — The memory adapter supports manual triggering and predictable
  test flows.
- **Shared singleton helpers** — Reach for `getScheduler()` and `stopScheduler()` in simple
  single-scheduler apps.
- **Cron validation helpers** — Validate and parse expressions with `isValidCronExpression()` and
  `parseCronExpression()`.
- **Preset schedules** — Use `CronPresets` for common schedules like hourly, daily, and weekday
  jobs.
- **Lifecycle events** — Observe `jobRun`, `jobError`, `jobScheduled`, and `jobUnscheduled` events
  from the scheduler.

## Install

```sh
deno add jsr:@netscript/cron
```

The package is Deno-first. Native scheduling requires a runtime that exposes `Deno.cron()`.

## Quick Start

Use the root factory when you want a scheduler that auto-detects the best available provider.

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

## Entry Points

| Import                     | Purpose                                         | Key exports                                                       |
| -------------------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `@netscript/cron`          | Root scheduler API and shared singleton helpers | `createScheduler`, `getScheduler`, `stopScheduler`, `CronPresets` |
| `@netscript/cron/adapters` | Direct adapter access                           | `DenoCronAdapter`, `MemoryCronAdapter`                            |
| `@netscript/cron/types`    | Cron types and validation helpers               | `CronExpression`, `ScheduleOptions`, `parseCronExpression`        |

## Usage Examples

### Force the in-memory adapter for tests

```ts
import { createScheduler } from '@netscript/cron';

const scheduler = createScheduler({
  provider: 'memory',
  tickInterval: 100,
});
```

### Run contextual jobs with scheduling metadata

```ts
import { createScheduler } from '@netscript/cron';

const scheduler = createScheduler({ provider: 'memory' });

await scheduler.schedule('cleanup', '0 * * * *', async (context) => {
  console.log(context.jobId, context.attempt, context.scheduledTime.toISOString());
});
```

### Listen to scheduler lifecycle events

```ts
import { createScheduler } from '@netscript/cron';

const scheduler = createScheduler({ provider: 'memory' });

scheduler.on('jobRun', (event) => {
  if (!event.result.success) {
    console.error(`Job ${event.jobId} failed`, event.result.error);
  }
});
```

### Validate and inspect cron expressions

```ts
import { isValidCronExpression, parseCronExpression } from '@netscript/cron';

if (isValidCronExpression('0 9 * * 1-5')) {
  const parsed = parseCronExpression('0 9 * * 1-5');
  console.log(parsed?.hour, parsed?.dayOfWeek);
}
```

## API Reference

The root entrypoint keeps the package small enough to stay mostly self-explanatory. The most
important exports are:

- `createScheduler(options?)` creates a new scheduler instance.
- `getScheduler(options?)` returns a lazily-created shared scheduler singleton.
- `stopScheduler()` stops and resets the shared singleton.
- `CronScheduler` defines `schedule`, `unschedule`, `list`, `get`, `enable`, `disable`, `trigger`,
  `on`, `off`, and `stop`.

Full generated docs: https://jsr.io/@netscript/cron/doc

## Configuration

### `CreateSchedulerOptions`

```ts
interface CreateSchedulerOptions {
  provider?: 'deno' | 'node' | 'memory' | 'temporal';
  tickInterval?: number; // memory adapter only
}
```

### `ScheduleOptions`

```ts
interface ScheduleOptions {
  timezone?: string;
  runOnInit?: boolean;
  enabled?: boolean;
  backoff?: {
    type: 'fixed' | 'exponential' | 'linear';
    initialDelay: number;
    maxDelay?: number;
    multiplier?: number;
  };
  maxRetries?: number;
  metadata?: Record<string, unknown>;
}
```

## Runtime Model

`createScheduler()` chooses a provider in this order:

1. `provider` from `CreateSchedulerOptions`
2. native `Deno.cron()` support when available
3. the in-memory adapter as the safe fallback

The in-memory adapter is the default fallback in tests and any environment where `Deno.cron()` is
not available.

## Resources

- https://jsr.io/@netscript/cron
- https://jsr.io/@netscript/cron/doc
- https://docs.deno.com/api/deno/~/Deno.cron
- `@netscript/queue`
- `@netscript/plugin-workers-core`

## License

MIT
