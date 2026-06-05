import type { JobDefinition, JobId } from '@netscript/plugin-workers-core';

/** Trigger action kinds emitted by handler-first trigger DSL functions. */
export const TRIGGER_ACTION_KINDS: readonly ['enqueue-job', 'defer'] = ['enqueue-job', 'defer'];

/** Trigger action kind. */
export type TriggerActionKind = (typeof TRIGGER_ACTION_KINDS)[number];

/** Options for dispatching a worker job from a trigger handler. */
export type EnqueueJobOptions<TPayload = unknown> = Readonly<{
  payload?: TPayload;
  idempotencyKey?: string;
  concurrencyKey?: string;
  priority?: number;
}>;

/** Action emitted when a trigger should enqueue a worker job. */
export type EnqueueJobAction<
  TJobId extends string = string,
  TPayload = unknown,
> = Readonly<{
  kind: 'enqueue-job';
  job: JobDefinition<TJobId>;
  jobId: JobId<TJobId>;
  options: EnqueueJobOptions<TPayload>;
}>;

/** Action emitted when a trigger yields without holding a worker slot. */
export type DeferAction = Readonly<{
  kind: 'defer';
  until: string;
}>;

/** Action result emitted by trigger handlers. */
export type TriggerActionResult = EnqueueJobAction | DeferAction;
