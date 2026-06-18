---
layout: layouts/base.vto
title: "@netscript/cron"
---

# `@netscript/cron`

Runtime-agnostic cron scheduling abstraction for NetScript applications. Provides a
consistent interface across different backends (native `Deno.cron` and an in-memory
scheduler) with timezone support, job-lifecycle event emission, and runtime
auto-detection. This page is generated from the package public surface with `deno doc`
(US-2). For the full index of packages and plugins return to the
[reference overview](/reference/).

The root entrypoint (`@netscript/cron`) exposes the scheduler factory, the shared-instance
helpers, the cron-expression utilities, and the full port contract (interfaces and type
aliases). Three sub-path exports carry the rest of the surface:

- [`@netscript/cron/ports`](#sub-path-exports) - the port contract types only (no factory).
- [`@netscript/cron/adapters`](#sub-path-exports) - the concrete adapter classes.
- [`@netscript/cron/testing`](#sub-path-exports) - the in-memory adapter for tests.

## Scheduler factory

| Symbol | Signature | Description |
| --- | --- | --- |
| `createScheduler` | `function createScheduler(options?: CreateSchedulerOptions): CronScheduler` | Create a cron scheduler, auto-detecting the runtime (native `Deno.cron`, or in-memory for tests). |
| `getScheduler` | `function getScheduler(options?: CreateSchedulerOptions): CronScheduler` | Get the default shared scheduler instance, creating it on first call (options only used on first call). |
| `stopScheduler` | `async function stopScheduler(): Promise<void>` | Stop and reset the default scheduler so the next `getScheduler()` creates a fresh instance. |

## Cron expression utilities

| Symbol | Signature | Description |
| --- | --- | --- |
| `isValidCronExpression` | `function isValidCronExpression(expression: string): boolean` | Validate a cron expression, returning `true` if valid. |
| `parseCronExpression` | `function parseCronExpression(expression: string): ParsedCronExpression \| null` | Parse a cron expression string into its component parts, or `null` if invalid. |

## Constants

| Symbol | Kind | Description |
| --- | --- | --- |
| `CronPresets` | const | Common cron presets (`EVERY_MINUTE`, `EVERY_5_MINUTES`, `EVERY_HOUR`, `EVERY_DAY`, `WEEKDAYS_9AM`, `WEEKENDS_NOON`, and more). |
| `CronProviders` | const | Canonical provider identifiers supported by the built-in factory. |

## Scheduler contract

The core scheduling interface implemented by every adapter.

| Symbol | Kind | Description |
| --- | --- | --- |
| `CronScheduler` | interface | Runtime-agnostic scheduling abstraction: `schedule`, `unschedule`, `list`, `get`, `has`, `enable`, `disable`, `trigger`, `isValid`, `on`/`off`, and `stop`, plus `provider` and `isRunning`. |
| `CreateSchedulerOptions` | interface | Options for creating a scheduler (`provider`, `tickInterval`). |
| `ScheduleOptions` | interface | Options for scheduling a job (timezone, run-on-init, retries). |
| `ScheduledJob` | interface | Scheduled-job metadata. |
| `JobContext` | interface | Job execution context passed to contextual handlers. |
| `JobExecutionResult` | interface | Result of a single job execution. |
| `JobRunEvent` | interface | Event emitted when a job runs. |
| `JobLifecycleEvent` | interface | Event emitted when a job is scheduled or unscheduled. |
| `SchedulerEventMap` | interface | Typed scheduler event-payload map. |
| `ParsedCronExpression` | interface | A cron expression parsed into its component parts. |

## Types

| Symbol | Kind | Description |
| --- | --- | --- |
| `CronExpression` | type alias | Cron expression string. |
| `JobHandler` | type alias | Job handler function signature. |
| `ContextualJobHandler` | type alias | Job handler that receives a `JobContext`. |
| `JobEventListener` | type alias | Event listener for scheduler events. |
| `SchedulerEvent` | type alias | Scheduler event-name union. |
| `CronProvider` | type alias | Cron provider identifier (built-in providers runtime-validated by `createScheduler()`). |
| `KnownCronProvider` | type alias | Union of the known built-in provider identifiers. |
| `CronProviderRegistry` | type alias | Canonical provider-identifier registry shape. |
| `BackoffStrategy` | type alias | Backoff strategy for retry logic. |

## Adapters

Concrete implementations of `CronScheduler`, exported from `@netscript/cron/adapters`.

| Symbol | Kind | Description |
| --- | --- | --- |
| `DenoCronAdapter` | class | Uses the native `Deno.cron` runtime; works on Deno Deploy and local Deno. |
| `MemoryCronAdapter` | class | `setInterval`-based in-memory scheduler with test helpers (`triggerAll`, `waitForExecutions`, `getExecutionCount`, `setTickInterval`). Ideal for tests and development. |

## Sub-path exports

The following entrypoints are published alongside the root export. Their reference surface is
generated from their own `deno doc` output.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/cron` | `./mod.ts` | Scheduler factory, expression utilities, constants, and the full port contract (documented above). |
| `@netscript/cron/ports` | `./ports/mod.ts` | The port contract only - every interface and type alias above, without the factory functions. |
| `@netscript/cron/adapters` | `./adapters/mod.ts` | The concrete `DenoCronAdapter` and `MemoryCronAdapter` classes (plus re-exported contract types and utilities). |
| `@netscript/cron/testing` | `./testing/mod.ts` | The `MemoryCronAdapter` for tests. |

---

Back to the [reference overview](/reference/).
