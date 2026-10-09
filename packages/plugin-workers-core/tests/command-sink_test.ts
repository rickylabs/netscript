import { assert, assertEquals, assertRejects } from '@std/assert';
import { defineJob, defineTask } from '../mod.ts';
import {
  type CommandOutboxDelivery,
  createWorkerCommandOutboxSink,
  type WorkerCommandClientPort,
  type WorkerCommandTarget,
} from '../commands.ts';
import { CommandRelayError } from '@netscript/service/commands/relay';
const job = defineJob('rename-job').entrypoint('job.ts').build();
const task = defineTask('rename-task').entrypoint('task.ts').build();
const targets = new Map<string, WorkerCommandTarget>([['job', { kind: 'job', id: job.id }], [
  'task',
  { kind: 'task', id: task.id },
]]);
const trace = {
  traceparent: '00-' + 'a'.repeat(32) + '-' + 'b'.repeat(16) + '-01',
  tracestate: 'vendor=value',
};
const message: CommandOutboxDelivery = {
  id: 'message',
  destination: 'workers',
  topic: 'job',
  payload: { name: 'safe' },
  dedupeKey: 'stable',
  correlationId: 'correlation',
  trace,
};
Deno.test('worker command sink checks job and task acceptance and forwards stable key correlation and W3C', async () => {
  const requests: unknown[] = [];
  const clients: WorkerCommandClientPort = {
    triggerJob(request) {
      requests.push(request);
      return Promise.resolve({ jobId: request.jobId, runId: 'job-run', acceptedAt: new Date(1) });
    },
    triggerTask(request) {
      requests.push(request);
      return Promise.resolve({
        taskId: request.taskId,
        runId: 'task-run',
        acceptedAt: new Date(2),
      });
    },
  };
  const registry = new Map(targets);
  const sink = createWorkerCommandOutboxSink({
    id: 'workers',
    workers: clients,
    targets: registry,
  });
  registry.clear();
  assertEquals(await sink.publish(message), { identity: 'job-run', acceptedAt: new Date(1) });
  assertEquals(await sink.publish({ ...message, topic: 'task' }), {
    identity: 'task-run',
    acceptedAt: new Date(2),
  });
  assertEquals(requests, [{
    jobId: job.id,
    payload: { name: 'safe' },
    idempotencyKey: 'stable',
    correlationId: 'correlation',
    ...trace,
  }, {
    taskId: task.id,
    payload: { name: 'safe' },
    idempotencyKey: 'stable',
    correlationId: 'correlation',
    ...trace,
  }]);
});
Deno.test('worker command sink refuses absent malformed mismatched or unchecked receipt and aborted delivery', async () => {
  let calls = 0;
  const base = { jobId: job.id, runId: 'run', acceptedAt: new Date(1) };
  for (
    const receipt of [
      undefined,
      { ...base, jobId: task.id },
      { ...base, taskId: task.id },
      { ...base, runId: '' },
      { ...base, acceptedAt: new Date(NaN) },
      { ...base, kind: 'task' },
      true,
    ]
  ) {
    const clients: WorkerCommandClientPort = {
      triggerJob() {
        calls++;
        return Promise.resolve(receipt);
      },
      triggerTask() {
        return Promise.resolve();
      },
    };
    const sink = createWorkerCommandOutboxSink({ id: 'workers', workers: clients, targets });
    const error = await assertRejects(() => sink.publish(message), CommandRelayError);
    assert(error instanceof CommandRelayError);
    assertEquals(error.failure, 'invalid_response');
  }
  const clients: WorkerCommandClientPort = {
    triggerJob() {
      calls++;
      return Promise.resolve(base);
    },
    triggerTask() {
      return Promise.resolve();
    },
  };
  const sink = createWorkerCommandOutboxSink({ id: 'workers', workers: clients, targets });
  const before = calls;
  await assertRejects(() => sink.publish({ ...message, topic: 'unknown' }), CommandRelayError);
  assertEquals(calls, before);
  await assertRejects(() => sink.publish(message, AbortSignal.abort()));
  assertEquals(calls, before);
});
