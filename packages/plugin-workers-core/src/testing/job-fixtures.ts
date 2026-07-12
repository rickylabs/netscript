import {
  defineJob,
  type JobDefinition as BuilderJobDefinition,
  type JobHandler as BuilderJobHandler,
} from '../builders/mod.ts';
import { createSuccessResult, DEFAULT_TOPIC, type TriggerType } from '../domain/mod.ts';
import type { ExecutionRecord } from '../registry/mod.ts';
import {
  createWorkersRuntime,
  type JobHandler,
  type JobResult,
  type WorkersRuntime,
  type WorkersRuntimeOptions,
} from '../runtime/mod.ts';
import { MemoryJobStorage } from './memory-job-storage.ts';
import { MemoryWorker } from './memory-worker.ts';

/** Options for creating a test job definition. */
export type JobFixtureOptions<TId extends string, TPayload = unknown, TResult = unknown> = Readonly<
  {
    /** Optional job identifier. */
    id?: TId;
    /** Optional stream topic. */
    topic?: string;
    /** Optional handler for the job. */
    handler?: BuilderJobHandler<TPayload, TResult>;
    /** Optional job tags. */
    tags?: readonly string[];
    /** Optional job metadata. */
    metadata?: Record<string, unknown>;
  }
>;

/** Partial execution record fields used to override fixture defaults. */
export type ExecutionRecordFixtureOptions = Partial<ExecutionRecord>;

/** Options for creating a memory-backed workers runtime fixture. */
export type TestWorkersRuntimeOptions = Omit<WorkersRuntimeOptions, 'jobRegistry' | 'worker'> & {
  /** Memory job storage used by the runtime fixture. */
  jobStorage?: MemoryJobStorage;
  /** Memory worker used by the runtime fixture. */
  worker?: MemoryWorker;
  /** Static handlers keyed by job id for the default memory worker. */
  handlers?: ReadonlyMap<string, JobHandler>;
};

/** Workers runtime fixture with direct access to memory ports. */
export type TestWorkersRuntime =
  & WorkersRuntime
  & Readonly<{
    /** Memory-backed runtime ports created for the fixture. */
    memory: Readonly<{
      /** Memory job storage used by the runtime. */
      jobStorage: MemoryJobStorage;
      /** Memory worker used by the runtime. */
      worker: MemoryWorker;
    }>;
  }>;

/** Create a runnable job definition for tests. */
export function createJobFixture<
  TId extends string = 'test-job',
  TPayload = unknown,
  TResult = unknown,
>(
  options: JobFixtureOptions<TId, TPayload, TResult> = {},
): BuilderJobDefinition<TId, TPayload, TResult> {
  const id = options.id ?? 'test-job' as TId;
  const handler: BuilderJobHandler<TPayload, TResult> = options.handler ??
    (() => createSuccessResult<TResult>());
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
