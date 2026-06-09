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
  /** Sets a single span attribute. */
  setAttribute(name: string, value: TelemetryAttributeValue): void;
  /** Sets a batch of span attributes. */
  setAttributes(attributes: TelemetryAttributes): void;
  /** Adds a named span event with optional attributes. */
  addEvent(name: string, attributes?: TelemetryAttributes): void;
}

/** Context passed to worker instrumentation instances. */
export type InstrumentationContext = Readonly<{
  /** Current retry attempt number. */
  attempt?: number;
  /** Correlation identifier used to join related work. */
  correlationId?: string;
  /** Runtime duration in milliseconds. */
  durationMs?: number;
  /** Execution identifier associated with the span. */
  executionId?: string;
  /** Job identifier associated with the span. */
  jobId?: string;
  /** Human-readable job name associated with the span. */
  jobName?: string;
  /** Queue name associated with the span. */
  queueName?: string;
  /** Run identifier associated with the span. */
  runId?: string;
  /** Runtime status associated with the span. */
  status?: WorkerTelemetryStatus;
  /** Task identifier associated with the span. */
  taskId?: string;
  /** Trigger source associated with the span. */
  trigger?: string;
  /** Worker identifier associated with the span. */
  workerId?: string;
}>;

/** Base class for workers telemetry instrumentation. */
export abstract class WorkerInstrumentation {
  /** Stable instrumentation name. */
  abstract readonly name: string;
  /** Applies instrumentation attributes and events to a span. */
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
  /** Stable instrumentation name. */
  readonly name = 'job.execute';

  /** Applies job execution attributes and lifecycle events. */
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
  /** Stable instrumentation name. */
  readonly name = 'job.main';

  /** Applies job handler attributes and completion events. */
  applyTo(span: WorkerTelemetrySpan, context: InstrumentationContext): void {
    setCommonAttributes(span, context);
    if (context.status === 'completed') {
      span.addEvent(WorkerTelemetryEvents.jobCompleted, pickEventAttributes(context));
    }
  }
}

/** Adds queue enqueue attributes for producer spans. */
export class QueueEnqueueInstrumentation extends WorkerInstrumentation {
  /** Stable instrumentation name. */
  readonly name = 'queue.enqueue';

  /** Applies enqueue attributes and lifecycle events. */
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
  /** Stable instrumentation name. */
  readonly name = 'queue.dequeue';

  /** Applies dequeue attributes and lifecycle events. */
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
  /** Stable instrumentation name. */
  readonly name = 'task.execute';

  /** Applies task execution attributes and lifecycle events. */
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

/** Applies common worker attributes to a span. */
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

/** Selects the subset of context attributes attached to lifecycle events. */
function pickEventAttributes(context: InstrumentationContext): TelemetryAttributes {
  const attributes: Record<string, TelemetryAttributeValue> = {};
  assignIfSet(attributes, WorkerTelemetryAttributes.executionId, context.executionId);
  assignIfSet(attributes, WorkerTelemetryAttributes.jobId, context.jobId);
  assignIfSet(attributes, WorkerTelemetryAttributes.status, context.status);
  assignIfSet(attributes, WorkerTelemetryAttributes.durationMs, context.durationMs);
  return attributes;
}

/** Assigns a telemetry attribute when a value is present. */
function assignIfSet(
  target: Record<string, TelemetryAttributeValue>,
  key: string,
  value: TelemetryAttributeValue | undefined,
): void {
  if (value !== undefined) {
    target[key] = value;
  }
}
