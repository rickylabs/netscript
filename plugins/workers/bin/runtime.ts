import { createDefaultTaskExecutor } from '@netscript/plugin-workers-core/executor';
import type { RegisterJobInput, StaticJobRegistry } from '@netscript/plugin-workers-core/runtime';
import { createWorkersServiceRuntime } from '../services/src/service-runtime.ts';
import { Scheduler, Worker } from '../worker/mod.ts';

export type StaticJobDefinitionRegistry = ReadonlyMap<string, RegisterJobInput>;

type StaticJobDefinitionRegistrar = Readonly<{
  get(id: string): Promise<unknown>;
  registerJob(input: RegisterJobInput): Promise<unknown>;
}>;

export type StartWorkerProcessOptions = Readonly<{
  concurrency?: number;
  definitions?: StaticJobDefinitionRegistry;
  jobsDir?: string;
  queueName?: string;
  registry?: StaticJobRegistry;
  workerId?: string;
}>;

export type StartSchedulerProcessOptions = Readonly<{
  definitions?: StaticJobDefinitionRegistry;
  queueName?: string;
}>;

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
    jobsDir: options.jobsDir ?? Deno.env.get('NETSCRIPT_JOBS_DIR') ?? './workers/jobs',
    workerPoolOptions: options.registry ? { registry: options.registry } : undefined,
  });
  await scheduler.start();
  await worker.start();
  return Object.freeze({ scheduler, worker });
}

export async function registerStaticJobDefinitions(
  registry: StaticJobDefinitionRegistrar,
  definitions?: StaticJobDefinitionRegistry,
): Promise<void> {
  if (!definitions?.size) return;

  console.log(`[Workers Plugin] Registering ${definitions.size} static job definition(s)...`);
  for (const [id, definition] of definitions) {
    const existing = await registry.get(id);
    if (existing) continue;

    try {
      await registry.registerJob({ ...definition, id });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes(`Job with id '${id}' already exists`)) {
        throw error;
      }
    }
  }
}
