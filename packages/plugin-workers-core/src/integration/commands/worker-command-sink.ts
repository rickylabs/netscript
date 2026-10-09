import {
  type CommandJson,
  type CommandOutboxSink,
  CommandRelayError,
  type CommandTraceContext,
} from '@netscript/service/commands/relay';
import type { JobId, TaskId } from '../../public/root.ts';
/** Configured worker target; payload checking remains worker-definition owned. */
export type WorkerCommandTarget =
  | Readonly<{ kind: 'job'; id: JobId }>
  | Readonly<{ kind: 'task'; id: TaskId }>;
/** Stable metadata forwarded to the existing explicit worker boundary. */
export type WorkerCommandMetadata = Readonly<{
  /** Stable downstream applied/deduplication key. */ idempotencyKey: string;
  /** Existing correlation identity. */ correlationId: string;
  /** W3C producer parent. */ traceparent?: string;
  /** W3C producer state. */ tracestate?: string;
}>;
/** Job request accepted by an existing supplied workers client. */
export type WorkerJobCommandRequest =
  & WorkerCommandMetadata
  & Readonly<
    {
      /** Branded selected job. */ jobId:
        JobId; /** Decoded payload validated by the worker definition. */
      payload: CommandJson;
    }
  >;
/** Task request accepted by an existing supplied workers client. */
export type WorkerTaskCommandRequest =
  & WorkerCommandMetadata
  & Readonly<
    {
      /** Branded selected task. */ taskId:
        TaskId; /** Decoded payload validated by the worker definition. */
      payload: CommandJson;
    }
  >;
/** Narrow supplied trigger boundary; raw responses are checked by this adapter. */
export interface WorkerCommandClientPort {
  /** Trigger once and return the actual acceptance receipt, never a bare queue/status acknowledgement. */
  triggerJob(request: WorkerJobCommandRequest, signal?: AbortSignal): Promise<unknown>;
  /** Trigger once and return the actual acceptance receipt. */
  triggerTask(request: WorkerTaskCommandRequest, signal?: AbortSignal): Promise<unknown>;
}
/** Registered topic-to-branded-target mapping captured at composition. */
export type WorkerCommandSinkOptions = Readonly<{
  /** Relay registry identity. */ id: string;
  /** Existing explicit workers client, structurally compatible with saga worker trigger ports. */ workers:
    WorkerCommandClientPort;
  /** Copied allowlist; delivery topic selects exactly one job/task definition id. */ targets:
    ReadonlyMap<string, WorkerCommandTarget>;
}>;
/** Validate the bounded acceptance/registration identity, never a worker side effect. */
function boundedIdentity(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.isWellFormed() &&
    new TextEncoder().encode(value).length <= 256;
}
/**
 * Compose a thin checked worker sink; no queue, progress mirror or resource starts.
 *
 * Topic resolves a copied branded target. The existing worker trigger receives the
 * stable dedupe key, correlation and W3C fields. A response must match its job/task
 * target, contain a nonempty run identity and valid acceptedAt, before normalized
 * receipt metadata can cross relay settlement. Bare status/queue responses are refused.
 *
 * @example
 * ```ts
 * import { createWorkerCommandOutboxSink, type WorkerCommandSinkOptions } from '@netscript/plugin-workers-core/integration/commands';
 * declare const options: WorkerCommandSinkOptions;
 * const sink = createWorkerCommandOutboxSink(options);
 * ```
 */
export function createWorkerCommandOutboxSink(
  options: WorkerCommandSinkOptions,
): CommandOutboxSink {
  if (
    !boundedIdentity(options.id) || options.targets.size < 1 || options.targets.size > 1024 ||
    typeof options.workers?.triggerJob !== 'function' ||
    typeof options.workers?.triggerTask !== 'function'
  ) throw new TypeError('[netscript.command.worker] invalid composition');
  const targets = new Map<string, WorkerCommandTarget>();
  for (const [topic, target] of options.targets) {
    if (
      !boundedIdentity(topic) || !boundedIdentity(target.id) ||
      (target.kind !== 'job' && target.kind !== 'task')
    ) throw new TypeError('[netscript.command.worker] invalid target');
    targets.set(
      topic,
      target.kind === 'job'
        ? Object.freeze({ kind: 'job', id: target.id })
        : Object.freeze({ kind: 'task', id: target.id }),
    );
  }
  const triggerJob = options.workers.triggerJob.bind(options.workers),
    triggerTask = options.workers.triggerTask.bind(options.workers);
  return Object.freeze<CommandOutboxSink>({
    id: options.id,
    async publish(message, signal) {
      signal?.throwIfAborted();
      const target = targets.get(message.topic);
      if (!target) throw new CommandRelayError('misconfigured');
      const metadata: WorkerCommandMetadata = {
        idempotencyKey: message.dedupeKey,
        correlationId: message.correlationId,
        ...(message.trace === undefined ? {} : {
          traceparent: message.trace.traceparent,
          ...(message.trace.tracestate === undefined
            ? {}
            : { tracestate: message.trace.tracestate }),
        }),
      };
      const receipt = target.kind === 'job'
        ? await triggerJob(
          Object.freeze({ jobId: target.id, payload: message.payload, ...metadata }),
          signal,
        )
        : await triggerTask(
          Object.freeze({ taskId: target.id, payload: message.payload, ...metadata }),
          signal,
        );
      signal?.throwIfAborted();
      try {
        if (!receipt || typeof receipt !== 'object') {
          throw new CommandRelayError('invalid_response');
        }
        const field = target.kind === 'job' ? 'jobId' : 'taskId',
          other = target.kind === 'job' ? 'taskId' : 'jobId';
        const targetId: unknown = Reflect.get(receipt, field),
          kind: unknown = Reflect.get(receipt, 'kind'),
          run: unknown = Reflect.get(receipt, 'runId'),
          at: unknown = Reflect.get(receipt, 'acceptedAt');
        if (
          targetId !== target.id || Reflect.has(receipt, other) ||
          (kind !== undefined && kind !== target.kind) || !boundedIdentity(run) ||
          !(at instanceof Date) || !Number.isFinite(at.getTime())
        ) throw new CommandRelayError('invalid_response');
        return Object.freeze({ identity: run, acceptedAt: new Date(at.getTime()) });
      } catch {
        throw new CommandRelayError('invalid_response');
      }
    },
  });
}
export type { CommandJson, CommandTraceContext };
