/** Durable workflow/job storage for the t2 golden reference. @module */

import { getKv } from '@netscript/kv';

export type WorkflowStatus = 'payment_pending' | 'paid' | 'completed' | 'cancelled';
export type JobKind = 'process-payment' | 'reserve-inventory' | 'reconcile-checkouts';
export type JobSource = 'saga' | 'cron';

export interface CheckoutWorkflow {
  readonly id: string;
  readonly orderId: string;
  readonly customerId: string;
  readonly totalCents: number;
  readonly status: WorkflowStatus;
  readonly transactionId?: string;
  readonly cancelReason?: string;
}

export interface QueuedJob {
  readonly id: string;
  readonly kind: JobKind;
  readonly source: JobSource;
  readonly status: 'queued';
  readonly payload: Readonly<Record<string, string | number>>;
}

const WORKFLOWS = 'workflows';
const JOBS = 'jobs';
let store: Awaited<ReturnType<typeof getKv>> | null = null;

async function kv(): Promise<Awaited<ReturnType<typeof getKv>>> {
  if (store === null) {
    const path = Deno.env.get('NETSCRIPT_BENCH_KV_PATH');
    store = await getKv(path ? { provider: 'deno-kv', path } : { provider: 'deno-kv' });
  }
  return store;
}

/** Read a workflow by correlation id. */
export async function getWorkflow(id: string): Promise<CheckoutWorkflow | null> {
  const entry = await (await kv()).get<CheckoutWorkflow>([WORKFLOWS, id]);
  return entry?.value ?? null;
}

/** Persist a workflow checkpoint. */
export async function putWorkflow(workflow: CheckoutWorkflow): Promise<void> {
  await (await kv()).set([WORKFLOWS, workflow.id], workflow);
}

/** Read an observable queued job. */
export async function getJob(id: string): Promise<QueuedJob | null> {
  const entry = await (await kv()).get<QueuedJob>([JOBS, id]);
  return entry?.value ?? null;
}

/** Persist a newly emitted queued job. */
export async function putJob(job: QueuedJob): Promise<void> {
  await (await kv()).set([JOBS, job.id], job);
}
