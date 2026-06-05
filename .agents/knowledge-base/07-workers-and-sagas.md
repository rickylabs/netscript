# Workers, Sagas & Triggers Systems

> Doctrine reference: package/plugin architecture is governed by `docs/architecture/doctrine/` and
> `.llm/harness/debt/arch-debt.md`. This file describes current repo state; doctrine defines the
> target state.

> Background job execution, multi-runtime tasks, durable workflow orchestration, scheduled triggers,
> and event-driven triggers.

## Workers System Architecture

```
netscript.config.ts (installed plugins)
        |
    Filesystem walker + generated registries
    (.netscript/generated/)
        |
    plugin-workers-core runtime + KV registries
        |
    ┌───┴───────────────────┐
    |                       |
Trigger Scheduler        Worker
(plugins/triggers)    (Queue Consumer)
    |                       |
    └───┬───────────────────┘
        |
   Queue / stream integration
        |
   ┌────┴────┐
   |         |
Deno Jobs  Polyglot Tasks
(Web Worker) (Subprocess)
   |         |
ExecutionState (KV, plugin-workers-core)
   |
SSE -> Frontend
```

## Topic-Based Job Groups

Jobs are organized by topic for isolation and scaling:

| Topic           | Purpose               | Concurrency | Jobs                                                                                          |
| --------------- | --------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `notifications` | Fast event processing | 10          | export-notification-processor                                                                 |
| `maintenance`   | System maintenance    | 10          | health-check, exports-cleanup, execution-cleanup                                              |
| `sagas`         | Workflow integration  | 10          | send-welcome-email, create-user-settings, process-payment, reserve-inventory, create-shipment |
| `processing`    | Data processing       | 100         | orders-daily-export, task-orchestration-example, example-job                                  |

## Job Definition Pattern

```typescript
// config/workers/topics/exports.ts
import { defineJob, permissions } from '@netscript/plugin-workers-core';

defineJob('orders-daily-export')
  .entrypoint('./orders-daily-export.ts')
  .name('Daily Orders Export')
  .timeout(300_000)
  .retry(3)
  .permissions(permissions.full)
  .tags('export', 'orders', 'daily')
  .metadata({ exportFormat: 'csv', limit: 50 })
  .build();
```

## Job Handler Pattern

```typescript
// workers/jobs/orders-daily-export.ts
import {
  createFailureResult,
  createSuccessResult,
  defineJobHandler,
} from '@netscript/plugin-workers-core';

export default defineJobHandler(async (ctx) => {
  const payload = ctx.payload as { exportFormat?: string } | undefined;

  try {
    await ctx.log('info', 'Starting export', { format: payload?.exportFormat });

    // Fetch data...
    await ctx.progress(50, 'Fetched orders');

    // Write CSV/JSON...
    await ctx.progress(100, 'Export complete');

    return createSuccessResult({
      recordsExported: 42,
      outputPath: '/exports/orders-2026-05-12.csv',
    });
  } catch (error) {
    return createFailureResult(error);
  }
});
```

## Execution Modes

### Deno Jobs (In-Process via Web Worker Pool)

- Fast: No subprocess overhead
- Default for `.ts` files
- Executed by the workers plugin runtime over `plugin-workers-core` primitives
- Access to `ctx.log()`, `ctx.progress()`, payload, execution metadata, and result factories

### Polyglot Tasks (Subprocess via TaskExecutor)

- Supports: Python, Shell, PowerShell, .NET, Deno
- Executed by the Dax-backed `MultiRuntimeTaskExecutor`
- Environment variables: `JOB_ID`, `JOB_PAYLOAD`, `TRIGGERED_BY`, `TRACEPARENT`
- stdout/stderr captured for result/error

### Task Inventory (9 tasks across 4 runtimes)

| Task                   | Runtime    | Purpose             |
| ---------------------- | ---------- | ------------------- |
| validate-data.ts       | Deno       | Data validation     |
| fetch-data.ts          | Deno       | External API fetch  |
| transform-data.py      | Python     | Data transformation |
| ml-inference.py        | Python     | ML model inference  |
| aggregate-data.sh      | Shell      | Data aggregation    |
| cleanup-temp.sh        | Shell      | File cleanup        |
| generate-report.ps1    | PowerShell | Report generation   |
| system-diagnostics.ps1 | PowerShell | System health       |

## Workers Plugin API (Port 8091)

### Endpoints

| Method | Path                                             | Purpose              |
| ------ | ------------------------------------------------ | -------------------- |
| GET    | `/api/v1/workers/jobs`                           | List job definitions |
| GET    | `/api/v1/workers/jobs/:id`                       | Get job details      |
| POST   | `/api/v1/workers/jobs`                           | Create job           |
| POST   | `/api/v1/workers/jobs/:id/trigger`               | Manual trigger       |
| GET    | `/api/v1/workers/executions`                     | List executions      |
| GET    | `/api/v1/workers/executions/:jobId/:executionId` | Get execution        |
| POST   | `/api/v1/workers/executions/query`               | Batch query          |
| GET    | `/api/v1/workers/subscribe`                      | SSE stream           |
| GET    | `/api/v1/workers/topics`                         | List topics          |

### SSE Events

```
event: heartbeat       # Every 30s
event: jobs            # Initial job list
event: executions      # Initial execution list
event: executionUpdated # Execution state change
event: executionDeleted # Execution removed
```

## Execution State Machine

```
pending -> queued -> running -> completed
                          |-> failed
                          |-> timeout
                          |-> cancelled
```

State persisted in KV at keys:

```
['executions', jobId, executionId]  -> ExecutionRecord
['jobs', jobId, 'current']          -> Current execution pointer
['jobs', jobId, 'last']             -> Last execution
```

---

## Sagas System Architecture

```
Service Event (e.g., OrderCreated)
        |
    Saga Publisher (createSagaPublisher)
        |
    Sagas API (/api/v1/sagas/publish)
        |
    Saga Bus (Redis Streams / Garnet LIST)
        |
    Saga Processor
        |
    ┌───┴───────────┐
    |               |
 Handler         State Store
 (correlate +     (Postgres)
  transition)
    |
 triggerJob()
    |
 Workers API -> Worker -> Job
    |
 Job Complete Event
    |
 Saga Bus -> Next Handler
```

## Saga Definition Pattern

```typescript
// sagas/order-saga.ts
import { defineSaga, send } from '@netscript/plugin-sagas-core';
import { triggerJob } from '@netscript/plugin-sagas-core/integration/workers';

interface OrderState {
  orderId: string;
  status: 'pending' | 'paid' | 'reserved' | 'shipped' | 'completed' | 'cancelled';
  // ...
}

export const orderSaga = defineSaga('order-fulfillment')
  .state<OrderState>({
    orderId: '',
    status: 'pending',
  })
  .on<OrderSagaMessage>('OrderCreated', async (state, msg, ctx) => {
    await triggerJob('process-payment', {
      orderId: msg.orderId,
      amount: msg.total,
    }, { correlationId: ctx.correlationId });
    return [send('payment.requested', { orderId: msg.orderId })];
  })
  .on<OrderSagaMessage>('PaymentCompleted', async (_state, msg) => {
    await triggerJob('reserve-inventory', { orderId: msg.orderId });
    return [send('inventory.reserve', { orderId: msg.orderId })];
  })
  .on<OrderSagaMessage>('InventoryReserved', async (_state, msg) => {
    await triggerJob('create-shipment', { orderId: msg.orderId });
    return [send('shipment.create', { orderId: msg.orderId })];
  })
  .build();
```

## Implemented Sagas

### Order Fulfillment Saga

```
OrderCreated -> process-payment -> PaymentCompleted -> reserve-inventory
  -> InventoryReserved -> create-shipment -> ShipmentCreated -> OrderCompleted
  (PaymentFailed -> OrderCancelled)
```

### User Registration Saga

```
UserRegistered -> send-welcome-email -> WelcomeEmailSent
  -> create-user-settings -> UserSettingsCreated -> UserOnboardingCompleted
```

### Checkout Saga

```
CheckoutStarted -> ValidateInventory -> ReserveCartInventory
  -> ProcessPayment -> CreateOrder -> CheckoutCompleted
```

### Product Restock Saga

```
LowStockDetected -> NotifyPurchasing -> CreatePurchaseOrder
  -> StockReceived -> InventoryUpdated -> RestockCompleted
```

## Saga <-> Worker Integration

### Service -> Saga (Publish event)

```typescript
const publisher = createSagaPublisher<OrderSagaMessage>();
await publisher.publish({ type: 'OrderCreated', orderId: '123', total: 99.99 });
```

### Saga -> Worker (Trigger job)

```typescript
await triggerJob('process-payment', { orderId, amount }, { correlationId: ctx.correlationId });
```

### Worker -> Saga (Publish completion)

```typescript
const sagaCtx = createSagaJobContext<OrderSagaMessage>();
await sagaCtx.publishSagaMessage({ type: 'PaymentCompleted', orderId, transactionId });
```

## Transport Backends

| Transport     | Backend  | Features                                        |
| ------------- | -------- | ----------------------------------------------- |
| Redis Streams | Redis 7+ | Consumer groups, PEL, auto-claim, MAXLEN        |
| Garnet LIST   | Garnet   | RPUSH/BLMOVE, dead letter queue, orphan reclaim |
| InMemory      | None     | Testing only                                    |

## Store Backends

| Store    | Backend | Features                                                       |
| -------- | ------- | -------------------------------------------------------------- |
| Postgres | Prisma  | Durable, queryable, SagaInstance + SagaExecutionHistory tables |
| Redis    | ioredis | Fast, TTL-based cleanup                                        |
| InMemory | None    | Testing only                                                   |

## Sagas Plugin API (Port 8092)

| Method | Path                                                       | Purpose               |
| ------ | ---------------------------------------------------------- | --------------------- |
| GET    | `/api/v1/sagas/sagas`                                      | List saga definitions |
| GET    | `/api/v1/sagas/sagas/:id`                                  | Get saga details      |
| GET    | `/api/v1/sagas/instances`                                  | List saga instances   |
| GET    | `/api/v1/sagas/instances/:sagaName/:correlationId`         | Get instance          |
| GET    | `/api/v1/sagas/instances/:sagaName/:correlationId/history` | Timeline              |
| POST   | `/api/v1/sagas/publish`                                    | Publish message       |
| GET    | `/api/v1/sagas/subscribe`                                  | SSE stream            |

### SSE Events

```
event: saga:started        # New saga instance
event: saga:state_changed  # State transition
event: saga:completed      # Saga finished
event: saga:failed         # Saga error
event: heartbeat           # Every 30s
```

---

## Triggers System Architecture

```
File/Webhook Event
        |
    Watcher (@netscript/watchers)
        |
    Trigger Processor (@netscript/plugin-triggers)
        |
    ┌───┴──────────────────┐
    |                      |
Action Executor       Event Store (KV)
    |                      |
┌───┴────────────┐    SSE -> Frontend
|   |   |   |   |
Job  Saga Service Script Custom
```

## Trigger Definition Pattern

```typescript
// triggers/csv-import.ts
import { defineFileWatch } from '@netscript/plugin-triggers-core/builders';

export const csvImportTrigger = defineFileWatch(
  async ({ enqueueJob }) => {
    await enqueueJob('sales-csv-import');
  },
  {
    id: 'sales-csv-arrival',
    name: 'Sales CSV File Arrival',
    paths: ['./shared/incoming/sales'],
    patterns: ['*.csv'],
    stabilityThreshold: { checkIntervalMs: 1000, stableChecks: 3 },
    deduplication: { ttlMs: 300_000 },
    retry: { maxAttempts: 3 },
  },
);
```

## Action Types

| Action           | Description                           | Target         |
| ---------------- | ------------------------------------- | -------------- |
| `enqueueJob`     | Enqueue a worker job                  | Workers queue  |
| `publishSaga`    | Publish a saga message                | Saga bus       |
| `callService`    | Call a service endpoint               | HTTP service   |
| `runScript`      | Run a script file                     | Subprocess     |
| `executeTask`    | Execute a task via TaskExecutor       | Workers system |
| `enqueueMessage` | Enqueue a raw queue message           | Message queue  |
| `executeBatch`   | Execute multiple actions sequentially | Any            |
| `custom`         | Custom handler function               | User-defined   |

## File Lifecycle

Triggers with file lifecycle enabled can automatically manage processed files:

- **Staging**: Move matched files to a staging directory before processing
- **Archive**: Move successfully processed files to an archive directory
- **Quarantine**: Move failed files to a quarantine directory for manual review

## Trigger Processor

The `TriggerProcessor` multiplexes file watchers across all active triggers:

1. Reads trigger definitions from `.netscript/generated/plugin-triggers/triggers.registry.ts`
2. Creates watchers for each unique path set (with strategy auto-detection)
3. On file event: matches against trigger patterns and stability filters
4. Dispatches to `ActionExecutor` with retry and deduplication
5. Records events in `TriggerEventStore` (KV-backed)

Entry point: `startTriggerProcessorRuntime()` from `@netscript/plugin-triggers`

Regenerate worker, saga, and trigger registries with:

```bash
deno run -A packages/cli/bin/netscript-dev.ts generate plugins --project-root .
```

## Triggers Plugin API

| Method | Path                                    | Purpose                  |
| ------ | --------------------------------------- | ------------------------ |
| GET    | `/api/v1/triggers/triggers`             | List trigger definitions |
| GET    | `/api/v1/triggers/triggers/:id`         | Get trigger details      |
| POST   | `/api/v1/triggers/triggers`             | Create trigger           |
| PUT    | `/api/v1/triggers/triggers/:id`         | Update trigger           |
| DELETE | `/api/v1/triggers/triggers/:id`         | Delete trigger           |
| POST   | `/api/v1/triggers/triggers/:id/enable`  | Enable trigger           |
| POST   | `/api/v1/triggers/triggers/:id/disable` | Disable trigger          |
| POST   | `/api/v1/triggers/triggers/:id/fire`    | Manually fire trigger    |
| GET    | `/api/v1/triggers/events`               | List trigger events      |
| GET    | `/api/v1/triggers/events/:id`           | Get event details        |
| POST   | `/webhooks/:path`                       | Ingest webhook           |
| GET    | `/api/v1/triggers/subscribe`            | SSE stream               |
| GET    | `/api/v1/triggers/topics`               | List topics              |

---

## Runtime Config Hot-Reload

Workers, sagas, and triggers all consume `@netscript/runtime-config` for live configuration changes
without restarts.

### Startup Flow

```typescript
import {
  loadRuntimeConfig,
  logRuntimeConfigSummary,
  watchRuntimeConfig,
} from '@netscript/runtime-config';

// 1. Load initial config
const rtConfig = await loadRuntimeConfig();
logRuntimeConfigSummary(rtConfig, '[Workers]');

// 2. Apply overrides (disable jobs, change schedules, etc.)
applyOverrides(rtConfig);

// 3. Watch for changes
watchRuntimeConfig(async (newConfig) => {
  logRuntimeConfigSummary(newConfig, '[Workers]');
  await applyOverrides(newConfig);
}, { signal: shutdownController.signal, prefix: '[Workers]' });
```

### Override Capabilities

| Consumer                   | Overrides                                                                |
| -------------------------- | ------------------------------------------------------------------------ |
| Workers (scheduler/worker) | Job enabled/disabled, schedule changes, timeout, maxRetries, concurrency |
| Sagas (processor)          | Saga enabled/disabled, timeout, maxRetries, compensationTimeout          |
| Triggers (processor)       | Trigger enabled/disabled, watch path overrides                           |
| All                        | Feature flags (enabled, rolloutPercentage)                               |

### Runtime Tasks

Runtime config also supports adding new task definitions at runtime via `runtime/tasks/v*.json`.
These tasks are auto-registered with the scheduler when a `schedule` field is present.

### Config Directory

Resolution order:

1. `NETSCRIPT_RUNTIME_CONFIG_DIR` env var
2. Parent of `NETSCRIPT_TASKS_DIR`
3. `./runtime` (dev fallback)
