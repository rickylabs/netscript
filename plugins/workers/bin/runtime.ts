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
  describeGeneratedJobRegistry,
  GeneratedJobRegistryError,
  type GeneratedWorkersJobRegistry,
  loadGeneratedJobRegistry,
  projectFileUrl,
  registerGeneratedJobRegistry,
  registerStaticJobDefinitions,
  resolveGeneratedJobRegistryUrl,
  type StaticJobDefinitionRegistrar,
  type StaticJobDefinitionRegistry,
  WORKERS_JOB_REGISTRY_PATH,
} from '../src/runtime/generated-jobs.ts';
import {
  describeGeneratedJobRegistry,
  type GeneratedWorkersJobRegistry,
  loadGeneratedJobRegistry,
  registerGeneratedJobRegistry,
  registerStaticJobDefinitions,
  type StaticJobDefinitionRegistrar,
  type StaticJobDefinitionRegistry,
} from '../src/runtime/generated-jobs.ts';
import { createWorkersServiceRuntime } from '../services/src/service-runtime.ts';
import { createStreamMutationHook } from '../streams/server.ts';
import { Scheduler, Worker } from '../worker/mod.ts';

/**
 * Register the project's generated jobs into a runtime, failing loudly on a partial load.
 *
 * Called by every background entrypoint. When `definitions` is supplied (generated
 * runtime glue already loaded the module) it is registered as-is; otherwise the
 * registry is resolved and loaded from the project root. Skipping this step is what
 * left `bin/worker.ts` and `bin/scheduler.ts` running with plugin jobs only.
 */
async function registerProjectJobs(
  runtime: Readonly<{ jobRegistry: StaticJobDefinitionRegistrar }>,
  definitions?: StaticJobDefinitionRegistry,
): Promise<GeneratedWorkersJobRegistry | undefined> {
  if (definitions) {
    await registerStaticJobDefinitions(runtime.jobRegistry, definitions);
    return undefined;
  }

  const loaded = await registerGeneratedJobRegistry(
    runtime.jobRegistry,
    await loadGeneratedJobRegistry(),
  );
  console.log(`[Workers Runtime] ${describeGeneratedJobRegistry(loaded)}`);
  return loaded;
}

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
  runtime.executionState.setMutationHook(createStreamMutationHook());
  const generated = await registerProjectJobs(runtime, options.definitions);
  const poolRegistry = options.registry ?? generated?.registry;
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
    workerPoolOptions: poolRegistry ? { registry: poolRegistry } : undefined,
  });
  await worker.start();
  return worker;
}

/** Start the plugin scheduler process. */
export async function startSchedulerProcess(
  options: StartSchedulerProcessOptions = {},
): Promise<Scheduler> {
  const runtime = await createWorkersServiceRuntime();
  await registerProjectJobs(runtime, options.definitions);
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
  runtime.executionState.setMutationHook(createStreamMutationHook());
  const generated = await registerProjectJobs(runtime, options.definitions);
  const poolRegistry = options.registry ?? generated?.registry;
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
    workerPoolOptions: poolRegistry ? { registry: poolRegistry } : undefined,
  });
  await scheduler.start();
  await worker.start();
  return Object.freeze({ scheduler, worker });
}
