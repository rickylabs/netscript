/**
 * Runtime start APIs for Aspire-managed workers plugin background processes.
 *
 * @module
 */

// Register Redis/Garnet KV adapter before createWorkersServiceRuntime() calls getKv().
import '@netscript/kv/redis';
import { createDefaultTaskExecutor } from '@netscript/plugin-workers-core/executor';
import type { StaticJobRegistry } from '@netscript/plugin-workers-core/runtime';
export {
  loadGeneratedJobRegistry,
  projectFileUrl,
  registerStaticJobDefinitions,
  type StaticJobDefinitionRegistry,
  WORKERS_JOB_REGISTRY_PATH,
} from '../src/runtime/generated-jobs.ts';
import {
  registerStaticJobDefinitions,
  type StaticJobDefinitionRegistry,
} from '../src/runtime/generated-jobs.ts';
import { createWorkersServiceRuntime } from '../services/src/service-runtime.ts';
import { Scheduler, Worker } from '../worker/mod.ts';

/** Options for starting only the workers job execution process. */
export type StartWorkerProcessOptions = Readonly<{
  /** Number of jobs the worker may execute concurrently. */
  concurrency?: number;
  /** Project-generated static job definitions to register before processing. */
  definitions?: StaticJobDefinitionRegistry;
  /** Project-relative directory containing job modules. */
  jobsDir?: string;
  /** Queue name consumed by the worker. */
  queueName?: string;
  /** Worker-pool registry used for isolated job execution. */
  registry?: StaticJobRegistry;
  /** Stable worker id used for telemetry and execution state. */
  workerId?: string;
}>;

/** Options for starting only the workers scheduler process. */
export type StartSchedulerProcessOptions = Readonly<{
  /** Project-generated static job definitions to register before scheduling. */
  definitions?: StaticJobDefinitionRegistry;
  /** Queue name used for scheduled job dispatch. */
  queueName?: string;
}>;

/** Options for starting worker execution and scheduling in one process. */
export type StartCombinedProcessOptions = StartWorkerProcessOptions & StartSchedulerProcessOptions;

/** Start the plugin worker process. */
export async function startWorkerProcess(options: StartWorkerProcessOptions = {}): Promise<Worker> {
  const runtime = await createWorkersServiceRuntime();
  await registerStaticJobDefinitions(runtime.jobRegistry, options.definitions);
  const worker = new Worker({
    workerId: options.workerId ?? Deno.env.get('WORKER_ID') ?? crypto.randomUUID(),
    queueName: options.queueName ?? Deno.env.get('WORKERS_QUEUE') ?? 'jobs',
    concurrency: options.concurrency ?? parseInt(Deno.env.get('WORKERS_CONCURRENCY') ?? '1'),
    registry: runtime.jobRegistry,
    executionState: runtime.executionState,
    taskExecutor: createDefaultTaskExecutor(),
    taskRegistry: runtime.taskRegistry,
    idempotency: runtime.idempotency,
    jobsDir: options.jobsDir ?? Deno.env.get('NETSCRIPT_JOBS_DIR') ?? './workers/jobs',
    workerPoolOptions: options.registry ? { registry: options.registry } : undefined,
  });
  await worker.start();
  return worker;
}

/** Start the plugin scheduler process. */
export async function startSchedulerProcess(
  options: StartSchedulerProcessOptions = {},
): Promise<Scheduler> {
  const runtime = await createWorkersServiceRuntime();
  await registerStaticJobDefinitions(runtime.jobRegistry, options.definitions);
  const scheduler = new Scheduler({
    queueName: options.queueName ?? Deno.env.get('WORKERS_QUEUE') ?? 'jobs',
    registry: runtime.jobRegistry,
    executionState: runtime.executionState,
  });
  await scheduler.start();
  return scheduler;
}

/** Start worker and scheduler in the same process. */
export async function startCombinedProcess(
  options: StartCombinedProcessOptions = {},
): Promise<Readonly<{ scheduler: Scheduler; worker: Worker }>> {
  const runtime = await createWorkersServiceRuntime();
  await registerStaticJobDefinitions(runtime.jobRegistry, options.definitions);
  const taskExecutor = createDefaultTaskExecutor();
  const scheduler = new Scheduler({
    queueName: options.queueName ?? Deno.env.get('WORKERS_QUEUE') ?? 'jobs',
    registry: runtime.jobRegistry,
    executionState: runtime.executionState,
  });
  const worker = new Worker({
    workerId: options.workerId ?? Deno.env.get('WORKER_ID') ?? crypto.randomUUID(),
    queueName: options.queueName ?? Deno.env.get('WORKERS_QUEUE') ?? 'jobs',
    concurrency: options.concurrency ?? parseInt(Deno.env.get('WORKERS_CONCURRENCY') ?? '1'),
    registry: runtime.jobRegistry,
    executionState: runtime.executionState,
    taskExecutor,
    taskRegistry: runtime.taskRegistry,
    idempotency: runtime.idempotency,
    jobsDir: options.jobsDir ?? Deno.env.get('NETSCRIPT_JOBS_DIR') ?? './workers/jobs',
    workerPoolOptions: options.registry ? { registry: options.registry } : undefined,
  });
  await scheduler.start();
  await worker.start();
  return Object.freeze({ scheduler, worker });
}
