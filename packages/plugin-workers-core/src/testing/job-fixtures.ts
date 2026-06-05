import { defineJob } from '../builders/mod.ts';
import {
  createSuccessResult,
  DEFAULT_TOPIC,
  type ExecutionRecord,
  type JobDefinition,
  type JobHandler,
  type JobResult,
  type TriggerType,
} from '../domain/mod.ts';
import {
  createWorkersRuntime,
  type WorkersRuntime,
  type WorkersRuntimeOptions,
} from '../runtime/mod.ts';
import { MemoryJobStorage } from './memory-job-storage.ts';
import { MemoryWorker } from './memory-worker.ts';

export type JobFixtureOptions<TId extends string> = Readonly<{
  id?: TId;
  topic?: string;
  handler?: JobHandler;
  tags?: readonly string[];
  metadata?: Record<string, unknown>;
}>;

export type ExecutionRecordFixtureOptions = Partial<ExecutionRecord>;

export type TestWorkersRuntimeOptions = Omit<WorkersRuntimeOptions, 'jobRegistry' | 'worker'> & {
  jobStorage?: MemoryJobStorage;
  worker?: MemoryWorker;
  handlers?: ReadonlyMap<string, JobHandler>;
};

export type TestWorkersRuntime =
  & WorkersRuntime
  & Readonly<{
    memory: Readonly<{
      jobStorage: MemoryJobStorage;
      worker: MemoryWorker;
    }>;
  }>;

/** Create a runnable job definition for tests. */
export function createJobFixture<TId extends string = 'test-job'>(
  options: JobFixtureOptions<TId> = {},
): JobDefinition<TId> {
  const id = options.id ?? 'test-job' as TId;
  const handler = options.handler ?? (() => createSuccessResult());
  return defineJob(id)
    .handler(handler)
    .topic(options.topic ?? DEFAULT_TOPIC)
    .tags(...options.tags ?? [])
    .metadata(options.metadata ?? {})
    .build();
}

/** Create an execution record with realistic defaults. */
export function createExecutionRecordFixture(
  options: ExecutionRecordFixtureOptions = {},
): ExecutionRecord {
  const now = new Date(0).toISOString();
  return Object.freeze({
    id: '00000000-0000-4000-8000-000000000001',
    concept: 'job',
    jobId: 'test-job',
    topic: DEFAULT_TOPIC,
    status: 'completed',
    triggeredBy: 'manual' as TriggerType,
    triggeredAt: now,
    startedAt: now,
    completedAt: now,
    exitCode: 0,
    duration: 0,
    error: null,
    result: {},
    workerId: 'memory-worker',
    attempt: 0,
    maxAttempts: 3,
    ...options,
  });
}

/** Create a test runtime with memory-backed storage and worker ports. */
export function createTestWorkersRuntime(
  options: TestWorkersRuntimeOptions = {},
): TestWorkersRuntime {
  const jobStorage = options.jobStorage ?? new MemoryJobStorage();
  const worker = options.worker ?? new MemoryWorker({ handlers: options.handlers });
  const runtime = createWorkersRuntime({
    ...options,
    clock: options.clock ?? Object.freeze({ now: () => new Date(0) }),
    jobRegistry: jobStorage,
    worker,
  });
  return Object.freeze({
    ...runtime,
    memory: Object.freeze({ jobStorage, worker }),
  });
}

/** Create a successful job result for fixture handlers. */
export function createJobResultFixture<TResult = unknown>(data?: TResult): JobResult<TResult> {
  return createSuccessResult(data);
}
