# @netscript/cron

[![JSR](https://jsr.io/badges/@netscript/cron)](https://jsr.io/@netscript/cron)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**A runtime-agnostic cron scheduler for NetScript: one `CronScheduler` contract that drives
scheduled work through native `Deno.cron` in production and a deterministic in-memory adapter in
tests.**

Scheduled jobs are easy to write and miserable to test: the native scheduler only fires on real
wall-clock boundaries, so test suites either mock time or skip the path entirely. `@netscript/cron`
splits the contract from the clock. `createScheduler()` picks the native `DenoCronAdapter` when
`Deno.cron` is available and the `MemoryCronAdapter` otherwise — and the memory adapter can trigger
every registered job on demand, wait for executions, and tick on a compressed interval, so the same
handler code is exercised deterministically in milliseconds.

## Why teams use it

- **One port, many backends** — every adapter implements the `CronScheduler` contract (`schedule`,
  `unschedule`, `trigger`, `enable`/`disable`, `list`, `stop`), so handlers stay identical across
  runtimes.
- **Runtime auto-detection** — `createScheduler()` selects the native adapter when `Deno.cron`
  exists and the in-memory adapter otherwise; force a backend with the `provider` option
  (`CronProviders.DENO` / `CronProviders.MEMORY`; `node` and `temporal` ids are reserved and not yet
  implemented).
- **Deterministic testing** — the `MemoryCronAdapter` exposes `triggerAll`, `waitForExecutions`,
  `getExecutionCount`, and `setTickInterval` for fast, time-independent test runs.
- **Timezone-aware jobs** — `ScheduleOptions` carries `timezone`, `runOnInit`, and retry settings;
  validate expressions ahead of time with `isValidCronExpression` and inspect them with
  `parseCronExpression`, or start from a `CronPresets` constant.
- **Typed lifecycle events** — subscribe with `scheduler.on(...)` to a typed `SchedulerEventMap`
  covering job runs and schedule/unschedule changes, plus shared-instance helpers `getScheduler` and
  `stopScheduler`.

## Install

```bash
deno add jsr:@netscript/cron@<version>
```

Pin `<version>` to match your installed CLI; bare `jsr:@netscript/*` specifiers do not resolve on
the pre-release line.

## Quick example

```typescript
import { createScheduler, CronPresets } from '@netscript/cron';

declare function generateDailyReport(): Promise<void>;

// Auto-detects the runtime: native Deno.cron in production, in-memory under tests.
const scheduler = createScheduler();

await scheduler.schedule(
  'nightly-report',
  CronPresets.WEEKDAYS_9AM,
  async () => {
    await generateDailyReport();
  },
  { timezone: 'America/New_York', runOnInit: true },
);

scheduler.on('jobRun', (event) => {
  if (!event.result.success) throw event.result.error;
});

await scheduler.trigger('nightly-report');
await scheduler.stop();
```

## Public surface

| Entry        | What it gives you                                                                     |
| ------------ | ------------------------------------------------------------------------------------- |
| `.`          | `createScheduler`, `getScheduler`, `stopScheduler`, `CronPresets`, expression helpers |
| `./ports`    | The `CronScheduler` contract, event map, and option types                             |
| `./adapters` | `DenoCronAdapter` and `MemoryCronAdapter`                                             |
| `./testing`  | Test helpers for cron-driven code                                                     |

The always-current symbol list is
[`deno doc jsr:@netscript/cron@<version>`](https://jsr.io/@netscript/cron/doc) (pin `<version>` on
the pre-release line, as above).

## Docs

- **Reference — scheduler, adapters, and exports**:
  [rickylabs.github.io/netscript/reference/cron/](https://rickylabs.github.io/netscript/reference/cron/)
- **Background Processing — where cron fits the background stack**:
  [rickylabs.github.io/netscript/background-processing/](https://rickylabs.github.io/netscript/background-processing/)
- **How-to: queue, KV, and cron together**:
  [rickylabs.github.io/netscript/how-to/queue-kv-cron/](https://rickylabs.github.io/netscript/how-to/queue-kv-cron/)
- **API docs on JSR**: [jsr.io/@netscript/cron/doc](https://jsr.io/@netscript/cron/doc)

## Compatibility

Designed for Deno. The native adapter requires the `Deno.cron` API, which sits behind Deno's `cron`
unstable feature (`--unstable-cron` or `"unstable": ["cron"]` in `deno.json`); without it,
auto-detection falls back to the in-memory adapter. The in-memory adapter needs no permissions or
flags.

## License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
