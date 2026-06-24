# @netscript/cron

[![JSR](https://jsr.io/badges/@netscript/cron)](https://jsr.io/@netscript/cron)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**A runtime-agnostic cron scheduler for NetScript that drives background work through one port
contract, auto-detecting native `Deno.cron` in production and falling back to a deterministic
in-memory adapter for tests.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/cron

# Node.js / Bun
npx jsr add @netscript/cron
bunx jsr add @netscript/cron
```

### Usage

```typescript
import { createScheduler, CronPresets } from '@netscript/cron';

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

---

## 📦 Key Capabilities

- **One port, many backends**: every adapter implements the `CronScheduler` contract — `schedule`,
  `unschedule`, `trigger`, `enable`/`disable`, `list`, and `stop` — so handlers stay identical
  across runtimes.
- **Runtime auto-detection**: `createScheduler()` selects the native `DenoCronAdapter` when
  `Deno.cron` is available and the `MemoryCronAdapter` otherwise; force a backend with the
  `provider` option.
- **Deterministic testing**: the `MemoryCronAdapter` exposes `triggerAll`, `waitForExecutions`,
  `getExecutionCount`, and `setTickInterval` for fast, time-independent test runs.
- **Timezone-aware jobs**: `ScheduleOptions` carries `timezone`, `runOnInit`, and retry settings;
  validate expressions ahead of time with `isValidCronExpression` and inspect them with
  `parseCronExpression`.
- **Typed lifecycle events**: subscribe with `scheduler.on(...)` to a typed `SchedulerEventMap`
  covering job-run and schedule/unschedule events, plus shared-instance helpers `getScheduler` and
  `stopScheduler`.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/cron/](https://rickylabs.github.io/netscript/reference/cron/)
- **Background Processing**:
  [rickylabs.github.io/netscript/background-processing/](https://rickylabs.github.io/netscript/background-processing/)
- **How-To — Queue, KV, and cron**:
  [rickylabs.github.io/netscript/how-to/queue-kv-cron/](https://rickylabs.github.io/netscript/how-to/queue-kv-cron/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
