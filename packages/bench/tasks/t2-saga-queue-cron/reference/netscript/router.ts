/** Typed HTTP surface for the t2 saga/queue/cron golden reference. @module */

import { os } from '@orpc/server';
import { z } from 'zod';
import { notFound, validationFailed } from '@netscript/contracts';
import {
  type CheckoutWorkflow,
  getJob,
  getWorkflow,
  type JobKind,
  type JobSource,
  putJob,
  putWorkflow,
  type QueuedJob,
} from './store.ts';

const SCHEDULE_ID = 'daily-reconciliation';
const schedule = { id: SCHEDULE_ID, cron: '0 6 * * *', timezone: 'UTC' } as const;

const workflowShape = z.object({
  id: z.string(),
  orderId: z.string(),
  customerId: z.string(),
  totalCents: z.number(),
  status: z.enum(['payment_pending', 'paid', 'completed', 'cancelled']),
  transactionId: z.string().optional(),
  cancelReason: z.string().optional(),
});
const jobShape = z.object({
  id: z.string(),
  kind: z.enum(['process-payment', 'reserve-inventory', 'reconcile-checkouts']),
  source: z.enum(['saga', 'cron']),
  status: z.literal('queued'),
  payload: z.record(z.string(), z.union([z.string(), z.number()])),
});
const resultShape = z.object({ workflow: workflowShape, emittedJob: jobShape.nullable() });
const scheduleShape = z.object({ id: z.string(), cron: z.string(), timezone: z.string() });

const base = os.errors({
  NOT_FOUND: { status: 404, message: 'Resource not found' },
  VALIDATION_ERROR: { status: 422, message: 'Validation failed' },
});

function queuedJob(
  kind: JobKind,
  source: JobSource,
  payload: Readonly<Record<string, string | number>>,
): QueuedJob {
  return { id: crypto.randomUUID(), kind, source, status: 'queued', payload };
}

function failValidation(
  errors: Parameters<typeof validationFailed>[0]['errors'],
  message: string,
): never {
  return validationFailed({ errors, message, fieldErrors: { _root: [message] } });
}

const createWorkflow = base
  .route({ method: 'POST', path: '/workflows', successStatus: 202 })
  .input(z.object({
    orderId: z.string().optional(),
    customerId: z.string().optional(),
    totalCents: z.number().optional(),
  }))
  .output(resultShape)
  .handler(async ({ input, errors }) => {
    const parsed = z.object({
      orderId: z.string().trim().min(1),
      customerId: z.string().trim().min(1),
      totalCents: z.number().int().positive(),
    }).safeParse(input);
    if (!parsed.success) failValidation(errors, 'Invalid checkout');
    const existing = await getWorkflow(parsed.data.orderId);
    if (existing !== null) return { workflow: existing, emittedJob: null };

    const workflow: CheckoutWorkflow = {
      id: parsed.data.orderId,
      orderId: parsed.data.orderId,
      customerId: parsed.data.customerId,
      totalCents: parsed.data.totalCents,
      status: 'payment_pending',
    };
    const emittedJob = queuedJob('process-payment', 'saga', {
      orderId: workflow.orderId,
      amountCents: workflow.totalCents,
    });
    await putWorkflow(workflow);
    await putJob(emittedJob);
    return { workflow, emittedJob };
  });

const getWorkflowById = base
  .route({ method: 'GET', path: '/workflows/{id}' })
  .input(z.object({ id: z.string() }))
  .output(workflowShape)
  .handler(async ({ input, errors }) => {
    const workflow = await getWorkflow(input.id);
    if (workflow === null) notFound({ errors, path: ['workflows'], resourceId: input.id });
    return workflow;
  });

const applyEvent = base
  .route({ method: 'POST', path: '/workflows/{id}/events', successStatus: 202 })
  .input(z.object({
    id: z.string(),
    type: z.string().optional(),
    transactionId: z.string().optional(),
    reason: z.string().optional(),
  }))
  .output(resultShape)
  .handler(async ({ input, errors }) => {
    const current = await getWorkflow(input.id);
    if (current === null) notFound({ errors, path: ['workflows'], resourceId: input.id });

    let workflow = current;
    let emittedJob: QueuedJob | null = null;
    if (input.type === 'PaymentCompleted' && current.status === 'payment_pending') {
      if (!input.transactionId?.trim()) failValidation(errors, 'transactionId is required');
      workflow = { ...current, status: 'paid', transactionId: input.transactionId };
      emittedJob = queuedJob('reserve-inventory', 'saga', { orderId: current.orderId });
    } else if (input.type === 'PaymentFailed' && current.status === 'payment_pending') {
      if (!input.reason?.trim()) failValidation(errors, 'reason is required');
      workflow = { ...current, status: 'cancelled', cancelReason: input.reason };
    } else if (input.type === 'InventoryReserved' && current.status === 'paid') {
      workflow = { ...current, status: 'completed' };
    } else if (
      !['PaymentCompleted', 'PaymentFailed', 'InventoryReserved'].includes(input.type ?? '')
    ) {
      failValidation(errors, 'Unknown saga event');
    }

    if (workflow !== current) await putWorkflow(workflow);
    if (emittedJob !== null) await putJob(emittedJob);
    return { workflow, emittedJob };
  });

const getJobById = base
  .route({ method: 'GET', path: '/jobs/{id}' })
  .input(z.object({ id: z.string() }))
  .output(jobShape)
  .handler(async ({ input, errors }) => {
    const job = await getJob(input.id);
    if (job === null) notFound({ errors, path: ['jobs'], resourceId: input.id });
    return job;
  });

const getSchedule = base
  .route({ method: 'GET', path: '/schedules/{id}' })
  .input(z.object({ id: z.string() }))
  .output(scheduleShape)
  .handler(({ input, errors }) => {
    if (input.id !== SCHEDULE_ID) notFound({ errors, path: ['schedules'], resourceId: input.id });
    return schedule;
  });

const triggerSchedule = base
  .route({ method: 'POST', path: '/schedules/{id}/trigger', successStatus: 202 })
  .input(z.object({ id: z.string(), requestedAt: z.string().optional() }))
  .output(z.object({ schedule: scheduleShape, emittedJob: jobShape }))
  .handler(async ({ input, errors }) => {
    if (input.id !== SCHEDULE_ID) notFound({ errors, path: ['schedules'], resourceId: input.id });
    const emittedJob = queuedJob('reconcile-checkouts', 'cron', {
      scheduleId: SCHEDULE_ID,
      requestedAt: input.requestedAt ?? new Date().toISOString(),
    });
    await putJob(emittedJob);
    return { schedule, emittedJob };
  });

/** The t2 oRPC router mounted under `/api`. */
export const router = {
  workflows: { create: createWorkflow, get: getWorkflowById, applyEvent },
  jobs: { get: getJobById },
  schedules: { get: getSchedule, trigger: triggerSchedule },
};
