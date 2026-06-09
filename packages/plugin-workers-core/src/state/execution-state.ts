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
  readonly id: string;
  readonly concept: ExecutionConcept;
  readonly jobId: string;
  readonly topic: string;
  readonly status: ExecutionStatus;
  readonly triggeredBy: ExecutionTriggerType;
  readonly triggeredAt: string;
  readonly startedAt?: string | null;
  readonly completedAt?: string | null;
  readonly exitCode?: number | null;
  readonly duration?: number | null;
  readonly error?: string | null;
  readonly result?: Record<string, unknown> | null;
  readonly workerId?: string | null;
  readonly attempt?: number;
  readonly maxAttempts?: number;
  readonly correlationId?: string;
}>;

/** Options for creating a worker execution record. */
export type CreateExecutionOptions = Readonly<{
  concept?: ExecutionConcept;
  jobId: string;
  topic?: string;
  triggeredBy: ExecutionTriggerType;
  payload?: Record<string, unknown>;
  correlationId?: string;
  maxAttempts?: number;
  traceparent?: string;
  tracestate?: string;
}>;

/** Options for listing worker execution records. */
export type ListExecutionOptions = Readonly<{ concept?: ExecutionConcept; limit?: number }>;

/** Options for completing a worker execution record. */
export type CompleteExecutionOptions = Readonly<{
  status: 'cancelled' | 'completed' | 'failed' | 'timeout';
  exitCode?: number;
  error?: string;
  result?: Record<string, unknown>;
}>;

/** Hook invoked after execution state mutations. */
export type ExecutionMutationHook = (
  event: Readonly<{ type: 'created' | 'deleted' | 'updated'; execution: ExecutionRecord }>,
) => void;

/** KV-backed execution state store with explicit construction. */
export class KvExecutionState {
  readonly id: string;
  readonly #kv: RegistryKvStore;
  readonly #workerId: string;
  #onMutation?: ExecutionMutationHook;

  constructor(options: Readonly<{ id?: string; kv: RegistryKvStore; workerId?: string }>) {
    this.id = options.id ?? 'kv-execution-state';
    this.#kv = options.kv;
    this.#workerId = options.workerId ?? crypto.randomUUID();
  }

  setMutationHook(hook: ExecutionMutationHook): void {
    this.#onMutation = hook;
  }

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

  queue(executionId: string): Promise<ExecutionRecord | null> {
    return this.#transition(executionId, { status: 'queued' });
  }

  start(executionId: string): Promise<ExecutionRecord | null> {
    return this.#transition(executionId, {
      status: 'running',
      startedAt: new Date().toISOString(),
      workerId: this.#workerId,
    });
  }

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

  async get(executionId: string): Promise<ExecutionRecord | null> {
    const entry = await this.#kv.get<ExecutionRecord>([...EXECUTION_PREFIX, executionId]);
    return entry?.value ?? null;
  }

  listAll(options: ListExecutionOptions = {}): Promise<ExecutionRecord[]> {
    return this.#list((record) => !options.concept || record.concept === options.concept, options);
  }

  listByJob(jobId: string, options: ListExecutionOptions = {}): Promise<ExecutionRecord[]> {
    return this.#list(
      (record) =>
        record.jobId === jobId && (!options.concept || record.concept === options.concept),
      options,
    );
  }

  listByTopic(topic: string, options: ListExecutionOptions = {}): Promise<ExecutionRecord[]> {
    return this.#list(
      (record) =>
        record.topic === topic && (!options.concept || record.concept === options.concept),
      options,
    );
  }

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

  listByCorrelation(
    correlationId: string,
    options: ListExecutionOptions = {},
  ): Promise<ExecutionRecord[]> {
    return this.#list((record) => record.correlationId === correlationId, options);
  }

  async countAll(concept?: ExecutionConcept): Promise<number> {
    return (await this.listAll({ concept })).length;
  }

  async countByJob(jobId: string, concept?: ExecutionConcept): Promise<number> {
    return (await this.listByJob(jobId, { concept })).length;
  }

  async countByTopic(topic: string, concept?: ExecutionConcept): Promise<number> {
    return (await this.listByTopic(topic, { concept })).length;
  }

  async countByStatus(status: ExecutionStatus, concept?: ExecutionConcept): Promise<number> {
    return (await this.listByStatus(status, { concept })).length;
  }

  async delete(executionId: string): Promise<boolean> {
    const current = await this.get(executionId);
    if (!current) return false;
    await this.#kv.delete([...EXECUTION_PREFIX, executionId]);
    this.#onMutation?.({ type: 'deleted', execution: current });
    return true;
  }

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

  async #save(record: ExecutionRecord, type: 'created' | 'updated'): Promise<void> {
    await this.#kv.set([...EXECUTION_PREFIX, record.id], record);
    this.#onMutation?.({ type, execution: record });
  }

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

function validateExecution(input: unknown): ExecutionRecord {
  return ExecutionRecordSchema.parse(input) as ExecutionRecord;
}
