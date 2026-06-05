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
  JOB_SPAWN: 'job.spawn',
  SSE_CONNECTION: 'sse.connection',
  SSE_SUBSCRIBE: 'sse.subscribe',
  SSE_EVENT: 'sse.event',
  KV_GET: 'kv.get',
  KV_SET: 'kv.set',
  KV_DELETE: 'kv.delete',
  KV_LIST: 'kv.list',
  KV_WATCH: 'kv.watch',
  TRIGGER_DETECT: 'trigger.detect',
  TRIGGER_PROCESS: 'trigger.process',
  TRIGGER_ACTION: 'trigger.action',
  TRIGGER_LIFECYCLE: 'trigger.lifecycle',
} as const;

export function spanName(base: string, suffix?: string): string {
  return suffix ? `${base}.${suffix}` : base;
}
