/** FROZEN black-box HTTP suite for `t2-saga-queue-cron`. @module */

import type {
  FrozenSuite,
  ProbeContext,
  ProbeDefinition,
} from '../../../src/domain/frozen-suite.ts';
import type { HttpMethod, HttpResponse } from '../../../src/ports/http-client.ts';

const TIMEOUT_MS = 10_000;
const SCHEDULE_ID = 'daily-reconciliation';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function record(value: unknown, message: string): Record<string, unknown> {
  assert(typeof value === 'object' && value !== null, message);
  return value as Record<string, unknown>;
}

function uniqueOrder(): string {
  return `order-${crypto.randomUUID()}`;
}

async function request(
  ctx: ProbeContext,
  method: HttpMethod,
  path: string,
  body?: Record<string, unknown>,
): Promise<HttpResponse> {
  return await ctx.http.request({
    method,
    url: `${ctx.baseUrl}${path}`,
    body,
    timeoutMs: TIMEOUT_MS,
  });
}

async function startWorkflow(
  ctx: ProbeContext,
  orderId = uniqueOrder(),
): Promise<Record<string, unknown>> {
  const response = await request(ctx, 'POST', '/api/workflows', {
    orderId,
    customerId: 'customer-1',
    totalCents: 12500,
  });
  assert(response.status === 202, `expected 202, got ${response.status}`);
  return record(response.json, 'workflow response must be an object');
}

function workflowFrom(result: Record<string, unknown>): Record<string, unknown> {
  return record(result.workflow, 'result.workflow must be an object');
}

function jobFrom(result: Record<string, unknown>): Record<string, unknown> {
  return record(result.emittedJob, 'result.emittedJob must be an object');
}

const probes: ProbeDefinition[] = [
  {
    id: 'start-correlated-saga',
    title: 'Creating a checkout starts a correlated payment-pending saga',
    async run(ctx) {
      const orderId = uniqueOrder();
      const result = await startWorkflow(ctx, orderId);
      const workflow = workflowFrom(result);
      assert(workflow.id === orderId, 'workflow id must equal the order correlation key');
      assert(workflow.status === 'payment_pending', 'initial status must be payment_pending');
    },
  },
  {
    id: 'saga-emits-payment-job',
    title: 'Starting the saga emits observable queued payment work',
    async run(ctx) {
      const result = await startWorkflow(ctx);
      const job = jobFrom(result);
      assert(job.kind === 'process-payment', 'expected process-payment job');
      assert(job.source === 'saga' && job.status === 'queued', 'job must be queued from saga');
      const fetched = await request(ctx, 'GET', `/api/jobs/${job.id}`);
      assert(fetched.status === 200, `expected queued job lookup 200, got ${fetched.status}`);
    },
  },
  {
    id: 'payment-advances-and-queues-inventory',
    title: 'PaymentCompleted advances the saga and queues inventory work',
    async run(ctx) {
      const orderId = uniqueOrder();
      await startWorkflow(ctx, orderId);
      const response = await request(ctx, 'POST', `/api/workflows/${orderId}/events`, {
        type: 'PaymentCompleted',
        transactionId: 'txn-1',
      });
      assert(response.status === 202, `expected 202, got ${response.status}`);
      const result = record(response.json, 'event result must be an object');
      assert(workflowFrom(result).status === 'paid', 'PaymentCompleted must transition to paid');
      assert(jobFrom(result).kind === 'reserve-inventory', 'must queue reserve-inventory');
    },
  },
  {
    id: 'inventory-completes-saga',
    title: 'InventoryReserved completes a paid workflow',
    async run(ctx) {
      const orderId = uniqueOrder();
      await startWorkflow(ctx, orderId);
      await request(ctx, 'POST', `/api/workflows/${orderId}/events`, {
        type: 'PaymentCompleted',
        transactionId: 'txn-2',
      });
      const response = await request(ctx, 'POST', `/api/workflows/${orderId}/events`, {
        type: 'InventoryReserved',
      });
      const result = record(response.json, 'event result must be an object');
      assert(workflowFrom(result).status === 'completed', 'workflow must be completed');
      assert(result.emittedJob === null, 'terminal transition must not emit extra work');
    },
  },
  {
    id: 'payment-failure-compensates',
    title: 'PaymentFailed compensates the workflow to cancelled',
    async run(ctx) {
      const orderId = uniqueOrder();
      await startWorkflow(ctx, orderId);
      const response = await request(ctx, 'POST', `/api/workflows/${orderId}/events`, {
        type: 'PaymentFailed',
        reason: 'declined',
      });
      const workflow = workflowFrom(record(response.json, 'event result must be an object'));
      assert(workflow.status === 'cancelled', 'failed payment must cancel workflow');
      assert(workflow.cancelReason === 'declined', 'failure reason must persist');
    },
  },
  {
    id: 'redelivery-is-idempotent',
    title: 'Duplicate starts and events do not emit duplicate work',
    async run(ctx) {
      const orderId = uniqueOrder();
      await startWorkflow(ctx, orderId);
      const duplicateStart = await startWorkflow(ctx, orderId);
      assert(duplicateStart.emittedJob === null, 'duplicate start must not emit a job');
      await request(ctx, 'POST', `/api/workflows/${orderId}/events`, {
        type: 'PaymentCompleted',
        transactionId: 'txn-3',
      });
      const duplicateEvent = await request(ctx, 'POST', `/api/workflows/${orderId}/events`, {
        type: 'PaymentCompleted',
        transactionId: 'txn-3',
      });
      const result = record(duplicateEvent.json, 'duplicate result must be an object');
      assert(workflowFrom(result).status === 'paid', 'duplicate event must not corrupt state');
      assert(result.emittedJob === null, 'duplicate event must not emit a second job');
    },
  },
  {
    id: 'cron-schedule-contract',
    title: 'Daily reconciliation exposes an explicit UTC cron schedule',
    async run(ctx) {
      const response = await request(ctx, 'GET', `/api/schedules/${SCHEDULE_ID}`);
      assert(response.status === 200, `expected 200, got ${response.status}`);
      const body = record(response.json, 'schedule must be an object');
      assert(body.cron === '0 6 * * *', 'schedule cron must be 0 6 * * *');
      assert(body.timezone === 'UTC', 'schedule timezone must be UTC');
    },
  },
  {
    id: 'cron-trigger-enqueues-work',
    title: 'Triggering the schedule enqueues reconciliation work',
    async run(ctx) {
      const response = await request(ctx, 'POST', `/api/schedules/${SCHEDULE_ID}/trigger`, {
        requestedAt: '2026-07-12T06:00:00.000Z',
      });
      assert(response.status === 202, `expected 202, got ${response.status}`);
      const job = jobFrom(record(response.json, 'trigger result must be an object'));
      assert(job.kind === 'reconcile-checkouts', 'cron must enqueue reconciliation');
      assert(job.source === 'cron' && job.status === 'queued', 'cron work must be queued');
      const payload = record(job.payload, 'cron job payload must be an object');
      assert(payload.scheduleId === SCHEDULE_ID, 'job payload must name the schedule');
    },
  },
  {
    id: 'typed-errors',
    title: 'Invalid workflows and missing resources return typed errors',
    async run(ctx) {
      const invalid = await request(ctx, 'POST', '/api/workflows', {
        orderId: '',
        customerId: 'customer-1',
        totalCents: -1,
      });
      assert(
        invalid.status === 400 || invalid.status === 422,
        `expected 400/422, got ${invalid.status}`,
      );
      assert(
        record(invalid.json, 'error must be an object').code === 'VALIDATION_ERROR',
        'expected VALIDATION_ERROR',
      );
      const missing = await request(ctx, 'GET', '/api/workflows/missing-workflow');
      assert(missing.status === 404, `expected 404, got ${missing.status}`);
      assert(
        record(missing.json, 'error must be an object').code === 'NOT_FOUND',
        'expected NOT_FOUND',
      );
    },
  },
  {
    id: 'durable-across-restart',
    title: 'Workflow checkpoints and emitted jobs survive process restart',
    async run(ctx) {
      const orderId = uniqueOrder();
      const started = await startWorkflow(ctx, orderId);
      const jobId = jobFrom(started).id;
      await ctx.restart();
      const workflow = await request(ctx, 'GET', `/api/workflows/${orderId}`);
      assert(workflow.status === 200, `workflow must survive restart, got ${workflow.status}`);
      const job = await request(ctx, 'GET', `/api/jobs/${jobId}`);
      assert(job.status === 200, `job must survive restart, got ${job.status}`);
    },
  },
];

/** Frozen suite consumed by the bench runner. */
export const suite: FrozenSuite = { taskId: 't2-saga-queue-cron', probes };
