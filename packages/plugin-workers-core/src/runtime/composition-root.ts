import type { TaskDefinition as DomainTaskDefinition } from '../domain/mod.ts';
import { createDefaultTaskExecutor } from '../executor/mod.ts';
import type { MultiRuntimeTaskExecutorOptions } from '../executor/mod.ts';
import type { JobStoragePort, WorkerPort } from '../ports/mod.ts';
import { MemoryJobRegistry } from '../registry/mod.ts';
import { ShutdownManager } from '../shutdown/mod.ts';
import type { ShutdownManagerOptions } from '../shutdown/mod.ts';
import { WorkflowExecutor } from '../workflow/mod.ts';
import type { WorkflowExecutorOptions } from '../workflow/mod.ts';
import { InProcessJobRunner } from './in-process-job-runner.ts';
import type { StaticJobRegistry } from './job-dispatcher.ts';
import type {
  RuntimeJobStoragePort,
  RuntimeSchedulerPort,
  RuntimeShutdownManager,
  RuntimeShutdownOptions,
  RuntimeTaskExecutor,
  RuntimeTaskExecutorOptions,
  RuntimeWorkerPort,
  RuntimeWorkflowExecutor,
  RuntimeWorkflowOptions,
  TaskDefinition,
} from './runtime-types.ts';

/** Clock contract used by runtime tests and schedulers. */
export type WorkersClock = Readonly<{
  now(): Date;
}>;

/** Registry contract for task definitions. */
export type TaskRegistryPort = Readonly<{
  readonly id: string;
  saveTask(task: TaskDefinition): Promise<void>;
  findTask(taskId: string): Promise<TaskDefinition | undefined>;
  listTasks(): Promise<readonly TaskDefinition[]>;
}>;

/** Explicit dependencies and overrides for a workers runtime instance. */
export type WorkersRuntimeOptions = Readonly<{
  id?: string;
  clock?: WorkersClock;
  jobRegistry?: RuntimeJobStoragePort;
  taskRegistry?: TaskRegistryPort;
  worker?: RuntimeWorkerPort;
  scheduler?: RuntimeSchedulerPort;
  taskExecutor?: RuntimeTaskExecutor;
  taskExecutorOptions?: RuntimeTaskExecutorOptions;
  workflowExecutor?: RuntimeWorkflowExecutor;
  workflow?: RuntimeWorkflowOptions;
  shutdownManager?: RuntimeShutdownManager;
  shutdown?: RuntimeShutdownOptions;
  staticJobRegistry?: import('./runtime-types.ts').StaticJobRegistry;
  fallbackToDynamicImport?: boolean;
}>;

/** Runtime handle returned by the workers composition root. */
export type WorkersRuntime = Readonly<{
  readonly id: string;
  readonly clock: WorkersClock;
  readonly jobRegistry: RuntimeJobStoragePort;
  readonly taskRegistry: TaskRegistryPort;
  readonly worker: RuntimeWorkerPort;
  readonly scheduler?: RuntimeSchedulerPort;
  readonly taskExecutor: RuntimeTaskExecutor;
  readonly workflowExecutor: RuntimeWorkflowExecutor;
  readonly shutdown: RuntimeShutdownManager;
  start(): Promise<void>;
  stop(reason?: string): Promise<void>;
}>;

const systemClock: WorkersClock = Object.freeze({
  now: () => new Date(),
});

class MemoryTaskRegistry implements TaskRegistryPort {
  readonly id: string;
  readonly #tasks = new Map<string, DomainTaskDefinition>();

  constructor(id = 'memory-task-registry') {
    this.id = id;
  }

  saveTask(task: TaskDefinition): Promise<void> {
    this.#tasks.set(task.id, task as DomainTaskDefinition);
    return Promise.resolve();
  }

  findTask(taskId: string): Promise<TaskDefinition | undefined> {
    return Promise.resolve(this.#tasks.get(taskId));
  }

  listTasks(): Promise<readonly TaskDefinition[]> {
    return Promise.resolve([...this.#tasks.values()]);
  }
}

/** Create a fresh workers runtime from explicit dependencies. */
export function createWorkersRuntime(options: WorkersRuntimeOptions = {}): WorkersRuntime {
  const id = options.id ?? 'workers-runtime';
  const jobRegistry = (options.jobRegistry ?? new MemoryJobRegistry()) as JobStoragePort;
  const taskRegistry = options.taskRegistry ?? new MemoryTaskRegistry();
  const worker = (options.worker ?? new InProcessJobRunner({
    fallbackToDynamicImport: options.fallbackToDynamicImport,
    registry: options.staticJobRegistry as StaticJobRegistry | undefined,
  })) as WorkerPort;
  const workflowExecutor = (options.workflowExecutor ?? new WorkflowExecutor({
    clock: (options.workflow?.clock ?? options.clock) as WorkflowExecutorOptions['clock'],
    runJobStep: options.workflow?.runJobStep as WorkflowExecutorOptions['runJobStep'],
    runTaskStep: options.workflow?.runTaskStep as WorkflowExecutorOptions['runTaskStep'],
    sleep: options.workflow?.sleep as WorkflowExecutorOptions['sleep'],
    stateStore: options.workflow?.stateStore as WorkflowExecutorOptions['stateStore'],
  })) as WorkflowExecutor;
  const taskExecutor = options.taskExecutor ??
    createDefaultTaskExecutor(
      (options.taskExecutorOptions ?? {}) as MultiRuntimeTaskExecutorOptions,
    );
  const shutdown = (options.shutdownManager ?? new ShutdownManager(
    options.shutdown as ShutdownManagerOptions | undefined,
  )) as ShutdownManager;

  shutdown.register({
    id: 'worker',
    priority: 20,
    stop: (reason) => worker.stop(reason),
  });
  if (options.scheduler) {
    shutdown.register({
      id: 'scheduler',
      priority: 30,
      stop: (reason) => options.scheduler!.stop(reason),
    });
  }

  let started = false;

  return Object.freeze({
    id,
    clock: options.clock ?? systemClock,
    jobRegistry: jobRegistry as RuntimeJobStoragePort,
    taskRegistry,
    worker: worker as RuntimeWorkerPort,
    scheduler: options.scheduler,
    shutdown: shutdown as unknown as RuntimeShutdownManager, // quality-allow: The legacy ShutdownManager lacks the runtime port's metadata-only id while implementing the register/shutdown behavior used here.
    taskExecutor: taskExecutor as RuntimeTaskExecutor,
    workflowExecutor: workflowExecutor as unknown as RuntimeWorkflowExecutor, // quality-allow: The legacy WorkflowExecutor lacks the runtime port's metadata-only id while providing the execute behavior used here.
    start(): Promise<void> {
      started = true;
      return Promise.resolve();
    },
    async stop(reason?: string): Promise<void> {
      if (!started) {
        return;
      }
      started = false;
      await shutdown.shutdown(reason);
    },
  });
}
