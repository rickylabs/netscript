import { assert, assertFalse } from '@std/assert';

import { hasWorkersRuntimeStartupEvidence } from '../../../src/application/gates/scaffold/wait-for-workers-runtime.ts';

const schedulerStarted = '[Scheduler] Started with 0 scheduled jobs';
const webWorkerPoolStarted =
  '[Worker worker-1] Starting with Web Worker pool (1 workers)...';
// Keep this fixture aligned with plugins/workers/worker/worker.ts:156.
const inProcessRunnerStarted =
  '[Worker worker-1] Starting in-process job runner (queue concurrency: 1)...';

Deno.test('workers runtime evidence accepts the web-worker-pool mode', () => {
  assert(
    hasWorkersRuntimeStartupEvidence(
      `${schedulerStarted}\n${webWorkerPoolStarted}`,
    ),
  );
});

Deno.test('workers runtime evidence accepts the in-process runner mode', () => {
  assert(
    hasWorkersRuntimeStartupEvidence(
      `${schedulerStarted}\n${inProcessRunnerStarted}`,
    ),
  );
});

Deno.test('workers runtime evidence rejects a runner without the scheduler', () => {
  assertFalse(hasWorkersRuntimeStartupEvidence(inProcessRunnerStarted));
});

Deno.test('workers runtime evidence rejects the scheduler without a runner mode', () => {
  assertFalse(hasWorkersRuntimeStartupEvidence(schedulerStarted));
});
