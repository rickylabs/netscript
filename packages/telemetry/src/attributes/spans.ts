/**
 * Standard span names used by NetScript telemetry instrumentation.
 */
export const SpanNames = {
  SCHEDULER_TICK: 'scheduler.tick',
  SCHEDULER_DISPATCH: 'scheduler.dispatch',
  QUEUE_ENQUEUE: 'queue.enqueue',
  QUEUE_DEQUEUE: 'queue.dequeue',
  QUEUE_CLAIM: 'queue.claim',
  QUEUE_ACK: 'queue.ack',
  QUEUE_NACK: 'queue.nack',
  QUEUE_DLQ: 'queue.dlq',
  WORKER_PROCESS: 'worker.process',
  WORKER_START: 'worker.start',
  WORKER_STOP: 'worker.stop',
  JOB_EXECUTE: 'job.execute',
  JOB_MAIN: 'job.main',
  JOB_SPAWN: 'job.spawn',
  TASK_EXECUTE: 'task.execute',
  SSE_CONNECTION: 'sse.connection',
  SSE_SUBSCRIBE: 'sse.subscribe',
  SSE_EVENT: 'sse.event',
  KV_GET: 'kv.get',
  KV_SET: 'kv.set',
  KV_DELETE: 'kv.delete',
  KV_LIST: 'kv.list',
  KV_WATCH: 'kv.watch',
  TRIGGER_DETECT: 'trigger.detect',
  TRIGGER_INGRESS: 'trigger.ingress',
  TRIGGER_INGRESS_RESPONSE: 'trigger.ingress.response',
  TRIGGER_PROCESS: 'trigger.process',
  TRIGGER_ACTION: 'trigger.action',
  TRIGGER_ACTION_DISPATCH: 'trigger.action.dispatch',
  TRIGGER_DLQ_ENQUEUE: 'trigger.dlq.enqueue',
  TRIGGER_LIFECYCLE: 'trigger.lifecycle',
  SAGA_HANDLE: 'saga.handle',
  SAGA_CASCADE_SEND: 'saga.cascade.send',
  SAGA_CASCADE_SCHEDULE: 'saga.cascade.schedule',
  SAGA_CASCADE_SPAWN: 'saga.cascade.spawn',
  SAGA_CASCADE_COMPENSATE: 'saga.cascade.compensate',
  SAGA_CASCADE_COMPLETE: 'saga.cascade.complete',
  EXECUTION_START: 'execution.start',
  EXECUTION_COMPLETE: 'execution.complete',
  EXECUTION_FAIL: 'execution.fail',
  RPC_CLIENT: 'rpc.client',
  RPC_SERVER: 'rpc.server',
  GENAI_CHAT: 'gen_ai.chat',
  GENAI_EXECUTE_TOOL: 'gen_ai.execute_tool',
} as const;

/**
 * Join a base span name with an optional suffix.
 */
export function spanName(base: string, suffix?: string): string {
  return suffix ? `${base}.${suffix}` : base;
}
