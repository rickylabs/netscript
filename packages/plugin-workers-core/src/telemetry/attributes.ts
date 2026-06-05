/** Worker telemetry attribute names. */
export const WorkerTelemetryAttributes = {
  attempt: 'job.attempt',
  correlationId: 'correlation.id',
  durationMs: 'job.duration_ms',
  executionId: 'execution.id',
  jobId: 'job.id',
  jobName: 'job.name',
  queueName: 'queue.name',
  runId: 'run.id',
  status: 'job.status',
  taskId: 'task.id',
  trigger: 'job.trigger',
  workerId: 'worker.id',
} as const;

/** Worker telemetry span names. */
export const WorkerSpanNames = {
  jobExecute: 'job.execute',
  jobMain: 'job.main',
  queueDequeue: 'queue.dequeue',
  queueEnqueue: 'queue.enqueue',
  taskExecute: 'task.execute',
  workerStart: 'worker.start',
  workerStop: 'worker.stop',
} as const;

/** Worker telemetry event names. */
export const WorkerTelemetryEvents = {
  jobCompleted: 'job.completed',
  jobDequeued: 'job.dequeued',
  jobEnqueued: 'job.enqueued',
  jobFailed: 'job.failed',
  jobStarted: 'job.started',
  taskCompleted: 'task.completed',
  taskFailed: 'task.failed',
  taskStarted: 'task.started',
} as const;

/** Worker execution statuses used in telemetry attributes. */
export const WorkerTelemetryStatuses = [
  'cancelled',
  'completed',
  'failed',
  'pending',
  'running',
  'timeout',
] as const;

/** Worker telemetry attribute name. */
export type WorkerTelemetryAttribute =
  (typeof WorkerTelemetryAttributes)[keyof typeof WorkerTelemetryAttributes];

/** Worker telemetry span name. */
export type WorkerSpanName = (typeof WorkerSpanNames)[keyof typeof WorkerSpanNames];

/** Worker telemetry event name. */
export type WorkerTelemetryEvent =
  (typeof WorkerTelemetryEvents)[keyof typeof WorkerTelemetryEvents];

/** Worker telemetry status. */
export type WorkerTelemetryStatus = (typeof WorkerTelemetryStatuses)[number];
