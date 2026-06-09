import {
  DEFAULT_TOPIC,
  ExecutionRecordSchema,
} from '../domain/mod.ts';
import type { RegistryKvStore } from '../registry/mod.ts';

const EXECUTION_PREFIX = ['workers', 'executions'] as const;

/** Execution concept discriminator. */
export type ExecutionConcept = 'job' | 'task';

/** Execution trigger discriminator. */
export type ExecutionTriggerType = 'api' | 'event' | 'manual' | 'schedule' | string;

/** Execution status discriminator. */
export type ExecutionStatus =
  | 'cancelled'
  | 'completed'
  | 'failed'
  | 'pending'
  | 'queued'
  | 'running'
  | 'timeout';

/** Worker execution record stored in KV. */
export type ExecutionRecord = Readonly<Record<string, unknown> & {
  /** Unique execution identifier. */
  readonly id: string;
  /** Runtime concept represented by this execution. */
  readonly concept: ExecutionConcept;
  /** Job or task identifier associated with the execution. */
  readonly jobId: string;
  /** Stream topic associated with the execution. */
  readonly topic: string;
  /** Current execution status. */
  readonly status: ExecutionStatus;
  /** Source that triggered the execution. */
  readonly triggeredBy: ExecutionTriggerType;
  /** ISO timestamp for when the execution was triggered. */
  readonly triggeredAt: string;
  /** ISO timestamp for when the execution started. */
  readonly startedAt?: string | null;
  /** ISO timestamp for when the execution completed. */
  readonly completedAt?: string | null;
  /** Process-style exit code for the execution result. */
  readonly exitCode?: number | null;
  /** Execution duration in milliseconds. */
  readonly duration?: number | null;
  /** Error message recorded for failed executions. */
  readonly error?: string | null;
  /** Structured execution result payload. */
  readonly result?: Record<string, unknown> | null;
  /** Worker identifier that ran the execution. */
  readonly workerId?: string | null;
  /** Current retry attempt number. */
  readonly attempt?: number;
  /** Maximum retry attempts allowed for the execution. */
  readonly maxAttempts?: number;
  /** Correlation identifier used to join related executions. */
  readonly correlationId?: string;
}>;

/** Options for creating a worker execution record. */
export type CreateExecutionOptions = Readonly<{
  /** Runtime concept represented by this execution. */
  concept?: ExecutionConcept;
  /** Job or task identifier associated with the execution. */
  jobId: string;
  /** Stream topic associated with the execution. */
  topic?: string;
  /** Source that triggered the execution. */
  triggeredBy: ExecutionTriggerType;
  /** Structured payload associated with the execution. */
  payload?: Record<string, unknown>;
  /** Correlation identifier used to join related executions. */
  correlationId?: string;
  /** Maximum retry attempts allowed for the execution. */
  maxAttempts?: number;
  /** W3C trace context parent value. */
  traceparent?: string;
  /** W3C trace context state value. */
  tracestate?: string;
}>;

/** Options for listing worker execution records. */
export type ListExecutionOptions = Readonly<{
  /** Optional concept filter. */
  concept?: ExecutionConcept;
  /** Maximum number of records to return. */
  limit?: number;
}>;

/** Options for completing a worker execution record. */
export type CompleteExecutionOptions = Readonly<{
  /** Terminal status assigned to the execution. */
  status: 'cancelled' | 'completed' | 'failed' | 'timeout';
  /** Process-style exit code for the execution result. */
  exitCode?: number;
  /** Error message recorded for failed executions. */
  error?: string;
  /** Structured execution result payload. */
  result?: Record<string, unknown>;
}>;

/** Hook invoked after execution state mutations. */
export type ExecutionMutationHook = (
  event: Readonly<{
    /** Mutation type that occurred. */
    type: 'created' | 'deleted' | 'updated';
    /** Execution record affected by the mutation. */
    execution: ExecutionRecord;
  }>,
) => void;

/** KV-backed execution state store with explicit construction. */
export class KvExecutionState {
  /** Stable execution state store identifier. */
  readonly id: string;
  readonly #kv: RegistryKvStore;
  readonly #workerId: string;
  #onMutation?: ExecutionMutationHook;

  /** Creates a KV-backed execution state store. */
  constructor(options: Readonly<{ id?: string; kv: RegistryKvStore; workerId?: string }>) {
    this.id = options.id ?? 'kv-execution-state';
    this.#kv = options.kv;
    this.#workerId = options.workerId ?? crypto.randomUUID();
  }

  /** Registers a callback for execution state mutations. */
  setMutationHook(hook: ExecutionMutationHook): void {
    this.#onMutation = hook;
  }

  /** Creates and persists a pending execution record. */
  async create(options: CreateExecutionOptions): Promise<ExecutionRecord> {
    const now = new Date().toISOString();
    const record = validateExecution({
      id: crypto.randomUUID(),
      concept: options.concept ?? 'job',
      jobId: options.jobId,
      topic: options.topic ?? DEFAULT_TOPIC,
      status: 'pending',
      triggeredBy: options.triggeredBy,
      triggeredAt: now,
      startedAt: null,
      completedAt: null,
      exitCode: null,
      duration: null,
      error: null,
      result: null,
      workerId: null,
      attempt: 0,
      maxAttempts: options.maxAttempts ?? 3,
      payload: options.payload,
      correlationId: options.correlationId,
      traceparent: options.traceparent,
      tracestate: options.tracestate,
    });
    await this.#save(record, 'created');
    return record;
  }

  /** Marks an execution as queued. */
  queue(executionId: string): Promise<ExecutionRecord | null> {
    return this.#transition(executionId, { status: 'queued' });
  }

  /** Marks an execution as running and assigns the current worker id. */
  start(executionId: string): Promise<ExecutionRecord | null> {
    return this.#transition(executionId, {
      status: 'running',
      startedAt: new Date().toISOString(),
      workerId: this.#workerId,
    });
  }

  /** Marks an execution with a terminal status and completion details. */
  async complete(
    executionId: string,
    options: CompleteExecutionOptions,
  ): Promise<ExecutionRecord | null> {
    const current = await this.get(executionId);
    if (!current) return null;
    const now = new Date();
    const startedAt = current.startedAt ? new Date(current.startedAt) : now;
    return await this.#transition(executionId, {
      status: options.status,
      completedAt: now.toISOString(),
      duration: Math.max(0, now.getTime() - startedAt.getTime()),
      exitCode: options.exitCode ?? (options.status === 'completed' ? 0 : 1),
      error: options.error ?? null,
      result: options.result ?? null,
    });
  }

  /** Reads an execution by id. */
  async get(executionId: string): Promise<ExecutionRecord | null> {
    const entry = await this.#kv.get<ExecutionRecord>([...EXECUTION_PREFIX, executionId]);
    return entry?.value ?? null;
  }

  /** Lists all executions, optionally filtered by concept. */
  listAll(options: ListExecutionOptions = {}): Promise<ExecutionRecord[]> {
    return this.#list((record) => !options.concept || record.concept === options.concept, options);
  }

  /** Lists executions for a specific job or task id. */
  listByJob(jobId: string, options: ListExecutionOptions = {}): Promise<ExecutionRecord[]> {
    return this.#list(
      (record) =>
        record.jobId === jobId && (!options.concept || record.concept === options.concept),
      options,
    );
  }

  /** Lists executions for a specific topic. */
  listByTopic(topic: string, options: ListExecutionOptions = {}): Promise<ExecutionRecord[]> {
    return this.#list(
      (record) =>
        record.topic === topic && (!options.concept || record.concept === options.concept),
      options,
    );
  }

  /** Lists executions with a specific status. */
  listByStatus(
    status: ExecutionStatus,
    options: ListExecutionOptions = {},
  ): Promise<ExecutionRecord[]> {
    return this.#list(
      (record) =>
        record.status === status && (!options.concept || record.concept === options.concept),
      options,
    );
  }

  /** Lists executions with a specific correlation id. */
  listByCorrelation(
    correlationId: string,
    options: ListExecutionOptions = {},
  ): Promise<ExecutionRecord[]> {
    return this.#list((record) => record.correlationId === correlationId, options);
  }

  /** Counts all executions, optionally filtered by concept. */
  async countAll(concept?: ExecutionConcept): Promise<number> {
    return (await this.listAll({ concept })).length;
  }

  /** Counts executions for a specific job or task id. */
  async countByJob(jobId: string, concept?: ExecutionConcept): Promise<number> {
    return (await this.listByJob(jobId, { concept })).length;
  }

  /** Counts executions for a specific topic. */
  async countByTopic(topic: string, concept?: ExecutionConcept): Promise<number> {
    return (await this.listByTopic(topic, { concept })).length;
  }

  /** Counts executions with a specific status. */
  async countByStatus(status: ExecutionStatus, concept?: ExecutionConcept): Promise<number> {
    return (await this.listByStatus(status, { concept })).length;
  }

  /** Deletes an execution by id. */
  async delete(executionId: string): Promise<boolean> {
    const current = await this.get(executionId);
    if (!current) return false;
    await this.#kv.delete([...EXECUTION_PREFIX, executionId]);
    this.#onMutation?.({ type: 'deleted', execution: current });
    return true;
  }

  /** Applies partial execution updates through validation and persistence. */
  async #transition(
    executionId: string,
    updates: Partial<ExecutionRecord>,
  ): Promise<ExecutionRecord | null> {
    const current = await this.get(executionId);
    if (!current) return null;
    const updated = validateExecution({ ...current, ...updates });
    await this.#save(updated, 'updated');
    return updated;
  }

  /** Persists an execution record and emits the mutation hook. */
  async #save(record: ExecutionRecord, type: 'created' | 'updated'): Promise<void> {
    await this.#kv.set([...EXECUTION_PREFIX, record.id], record);
    this.#onMutation?.({ type, execution: record });
  }

  /** Lists persisted executions matching a predicate. */
  async #list(
    predicate: (record: ExecutionRecord) => boolean,
    options: ListExecutionOptions,
  ): Promise<ExecutionRecord[]> {
    const result: ExecutionRecord[] = [];
    for await (const entry of this.#kv.list<ExecutionRecord>({ prefix: EXECUTION_PREFIX })) {
      if (entry.value && predicate(entry.value)) result.push(entry.value);
    }
    result.sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt));
    return options.limit ? result.slice(0, options.limit) : result;
  }
}

/** Validates unknown execution data as a public execution record. */
function validateExecution(input: unknown): ExecutionRecord {
  return ExecutionRecordSchema.parse(input) as ExecutionRecord;
}
