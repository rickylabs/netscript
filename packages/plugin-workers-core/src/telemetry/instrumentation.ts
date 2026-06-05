import {
  WorkerTelemetryAttributes,
  WorkerTelemetryEvents,
  type WorkerTelemetryStatus,
} from './attributes.ts';
import { TaskInstrumentation } from '../abstracts/task-instrumentation.ts';

/** Attribute value accepted by worker telemetry instrumentation. */
export type TelemetryAttributeValue = boolean | number | string | readonly string[];

/** Attribute map accepted by worker telemetry instrumentation. */
export type TelemetryAttributes = Readonly<Record<string, TelemetryAttributeValue>>;

/** Structural span contract used by workers core without binding to one tracer package. */
export interface WorkerTelemetrySpan {
  setAttribute(name: string, value: TelemetryAttributeValue): void;
  setAttributes(attributes: TelemetryAttributes): void;
  addEvent(name: string, attributes?: TelemetryAttributes): void;
}

/** Context passed to worker instrumentation instances. */
export type InstrumentationContext = Readonly<{
  attempt?: number;
  correlationId?: string;
  durationMs?: number;
  executionId?: string;
  jobId?: string;
  jobName?: string;
  queueName?: string;
  runId?: string;
  status?: WorkerTelemetryStatus;
  taskId?: string;
  trigger?: string;
  workerId?: string;
}>;

/** Base class for workers telemetry instrumentation. */
export abstract class WorkerInstrumentation {
  abstract readonly name: string;
  abstract applyTo(span: WorkerTelemetrySpan, context: InstrumentationContext): void;
}

/** Applies a set of worker instrumentation instances to a span. */
export function applyWorkerInstrumentations(
  span: WorkerTelemetrySpan,
  context: InstrumentationContext,
  instrumentations: readonly WorkerInstrumentation[],
): void {
  for (const instrumentation of instrumentations) {
    instrumentation.applyTo(span, context);
  }
}

/** Adds common job execution attributes and lifecycle events. */
export class JobExecuteInstrumentation extends WorkerInstrumentation {
  readonly name = 'job.execute';

  applyTo(span: WorkerTelemetrySpan, context: InstrumentationContext): void {
    setCommonAttributes(span, context);
    span.addEvent(
      context.status === 'failed'
        ? WorkerTelemetryEvents.jobFailed
        : WorkerTelemetryEvents.jobStarted,
      pickEventAttributes(context),
    );
  }
}

/** Adds job-main attributes used inside a job handler span. */
export class JobMainInstrumentation extends WorkerInstrumentation {
  readonly name = 'job.main';

  applyTo(span: WorkerTelemetrySpan, context: InstrumentationContext): void {
    setCommonAttributes(span, context);
    if (context.status === 'completed') {
      span.addEvent(WorkerTelemetryEvents.jobCompleted, pickEventAttributes(context));
    }
  }
}

/** Adds queue enqueue attributes for producer spans. */
export class QueueEnqueueInstrumentation extends WorkerInstrumentation {
  readonly name = 'queue.enqueue';

  applyTo(span: WorkerTelemetrySpan, context: InstrumentationContext): void {
    setCommonAttributes(span, context);
    if (context.queueName) {
      span.setAttribute(WorkerTelemetryAttributes.queueName, context.queueName);
    }
    span.addEvent(WorkerTelemetryEvents.jobEnqueued, pickEventAttributes(context));
  }
}

/** Adds queue dequeue attributes for consumer spans. */
export class QueueDequeueInstrumentation extends WorkerInstrumentation {
  readonly name = 'queue.dequeue';

  applyTo(span: WorkerTelemetrySpan, context: InstrumentationContext): void {
    setCommonAttributes(span, context);
    if (context.queueName) {
      span.setAttribute(WorkerTelemetryAttributes.queueName, context.queueName);
    }
    span.addEvent(WorkerTelemetryEvents.jobDequeued, pickEventAttributes(context));
  }
}

/** Adds task execution attributes and lifecycle events. */
export class TaskExecuteInstrumentation extends TaskInstrumentation {
  readonly name = 'task.execute';

  applyTo(span: WorkerTelemetrySpan, context: InstrumentationContext): void {
    setCommonAttributes(span, context);
    span.addEvent(
      context.status === 'failed' || context.status === 'timeout'
        ? WorkerTelemetryEvents.taskFailed
        : context.status === 'completed'
        ? WorkerTelemetryEvents.taskCompleted
        : WorkerTelemetryEvents.taskStarted,
      pickEventAttributes(context),
    );
  }
}

function setCommonAttributes(span: WorkerTelemetrySpan, context: InstrumentationContext): void {
  const attributes: Record<string, TelemetryAttributeValue> = {};

  assignIfSet(attributes, WorkerTelemetryAttributes.attempt, context.attempt);
  assignIfSet(attributes, WorkerTelemetryAttributes.correlationId, context.correlationId);
  assignIfSet(attributes, WorkerTelemetryAttributes.durationMs, context.durationMs);
  assignIfSet(attributes, WorkerTelemetryAttributes.executionId, context.executionId);
  assignIfSet(attributes, WorkerTelemetryAttributes.jobId, context.jobId);
  assignIfSet(attributes, WorkerTelemetryAttributes.jobName, context.jobName);
  assignIfSet(attributes, WorkerTelemetryAttributes.runId, context.runId);
  assignIfSet(attributes, WorkerTelemetryAttributes.status, context.status);
  assignIfSet(attributes, WorkerTelemetryAttributes.taskId, context.taskId);
  assignIfSet(attributes, WorkerTelemetryAttributes.trigger, context.trigger);
  assignIfSet(attributes, WorkerTelemetryAttributes.workerId, context.workerId);

  span.setAttributes(attributes);
}

function pickEventAttributes(context: InstrumentationContext): TelemetryAttributes {
  const attributes: Record<string, TelemetryAttributeValue> = {};
  assignIfSet(attributes, WorkerTelemetryAttributes.executionId, context.executionId);
  assignIfSet(attributes, WorkerTelemetryAttributes.jobId, context.jobId);
  assignIfSet(attributes, WorkerTelemetryAttributes.status, context.status);
  assignIfSet(attributes, WorkerTelemetryAttributes.durationMs, context.durationMs);
  return attributes;
}

function assignIfSet(
  target: Record<string, TelemetryAttributeValue>,
  key: string,
  value: TelemetryAttributeValue | undefined,
): void {
  if (value !== undefined) {
    target[key] = value;
  }
}
