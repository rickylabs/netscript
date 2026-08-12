import { assert, assertEquals, assertNotEquals } from '@std/assert';
import { type ExecutionMutationHook, KvExecutionState } from '@netscript/plugin-workers-core/state';
import { startCombinedProcess } from '../../bin/runtime.ts';
import { Scheduler, Worker } from '../../worker/mod.ts';

Deno.test('startCombinedProcess installs the execution stream mutation hook', async () => {
  const originalSetMutationHook = KvExecutionState.prototype.setMutationHook;
  const originalSchedulerStart = Scheduler.prototype.start;
  const originalWorkerStart = Worker.prototype.start;
  const previousStreamsUrl = Deno.env.get('DURABLE_STREAMS_URL');
  let installedHook: ExecutionMutationHook | undefined;
  let installationCount = 0;

  KvExecutionState.prototype.setMutationHook = function (
    this: KvExecutionState,
    hook: ExecutionMutationHook,
  ): void {
    installationCount++;
    installedHook = hook;
    originalSetMutationHook.call(this, hook);
  };
  Scheduler.prototype.start = function (): Promise<void> {
    return Promise.resolve();
  };
  Worker.prototype.start = function (): Promise<void> {
    return Promise.resolve();
  };
  Deno.env.set('DURABLE_STREAMS_URL', 'http://127.0.0.1:1');

  try {
    await startCombinedProcess({ definitions: new Map() });

    assertEquals(installationCount, 1);
    assertNotEquals(installationCount, 0);
    assert(typeof installedHook === 'function');
  } finally {
    KvExecutionState.prototype.setMutationHook = originalSetMutationHook;
    Scheduler.prototype.start = originalSchedulerStart;
    Worker.prototype.start = originalWorkerStart;
    if (previousStreamsUrl === undefined) {
      Deno.env.delete('DURABLE_STREAMS_URL');
    } else {
      Deno.env.set('DURABLE_STREAMS_URL', previousStreamsUrl);
    }
  }
});
