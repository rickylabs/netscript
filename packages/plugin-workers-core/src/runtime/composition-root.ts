import type { TaskDefinition } from '../domain/mod.ts';
import { createDefaultTaskExecutor } from '../executor/mod.ts';
import type { MultiRuntimeTaskExecutorOptions, TaskExecutor } from '../executor/mod.ts';
import type { JobStoragePort, SchedulerPort, WorkerPort } from '../ports/mod.ts';
import { MemoryJobRegistry } from '../registry/mod.ts';
import { ShutdownManager } from '../shutdown/mod.ts';
import type { ShutdownManagerOptions } from '../shutdown/mod.ts';
import { WorkflowExecutor } from '../workflow/mod.ts';
import type { WorkflowExecutorOptions } from '../workflow/mod.ts';
import { InProcessJobRunner } from './in-process-job-runner.ts';
import type { StaticJobRegistry } from './job-dispatcher.ts';

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
  jobRegistry?: JobStoragePort;
  taskRegistry?: TaskRegistryPort;
  worker?: WorkerPort;
  scheduler?: SchedulerPort;
  taskExecutor?: TaskExecutor;
  taskExecutorOptions?: MultiRuntimeTaskExecutorOptions;
  workflowExecutor?: WorkflowExecutor;
  workflow?: WorkflowExecutorOptions;
  shutdownManager?: ShutdownManager;
  shutdown?: ShutdownManagerOptions;
  staticJobRegistry?: StaticJobRegistry;
  fallbackToDynamicImport?: boolean;
}>;

/** Runtime handle returned by the workers composition root. */
export type WorkersRuntime = Readonly<{
  readonly id: string;
  readonly clock: WorkersClock;
  readonly jobRegistry: JobStoragePort;
  readonly taskRegistry: TaskRegistryPort;
  readonly worker: WorkerPort;
  readonly scheduler?: SchedulerPort;
  readonly taskExecutor: TaskExecutor;
  readonly workflowExecutor: WorkflowExecutor;
  readonly shutdown: ShutdownManager;
  start(): Promise<void>;
  stop(reason?: string): Promise<void>;
}>;

const systemClock: WorkersClock = Object.freeze({
  now: () => new Date(),
});

class MemoryTaskRegistry implements TaskRegistryPort {
  readonly id: string;
  readonly #tasks = new Map<string, TaskDefinition>();

  constructor(id = 'memory-task-registry') {
    this.id = id;
  }

  saveTask(task: TaskDefinition): Promise<void> {
    this.#tasks.set(task.id, task);
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
  const jobRegistry = options.jobRegistry ?? new MemoryJobRegistry();
  const taskRegistry = options.taskRegistry ?? new MemoryTaskRegistry();
  const worker = options.worker ?? new InProcessJobRunner({
    fallbackToDynamicImport: options.fallbackToDynamicImport,
    registry: options.staticJobRegistry,
  });
  const workflowExecutor = options.workflowExecutor ?? new WorkflowExecutor({
    clock: options.workflow?.clock ?? options.clock,
    runJobStep: options.workflow?.runJobStep,
    runTaskStep: options.workflow?.runTaskStep,
    sleep: options.workflow?.sleep,
    stateStore: options.workflow?.stateStore,
  });
  const taskExecutor = options.taskExecutor ??
    createDefaultTaskExecutor(options.taskExecutorOptions ?? {});
  const shutdown = options.shutdownManager ?? new ShutdownManager(options.shutdown);

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
    jobRegistry,
    taskRegistry,
    worker,
    scheduler: options.scheduler,
    shutdown,
    taskExecutor,
    workflowExecutor,
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
