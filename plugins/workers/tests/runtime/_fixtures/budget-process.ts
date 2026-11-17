import { startCombinedProcess, startWorkerProcess } from '../../../bin/runtime.ts';
import { createWorkersServiceRuntime } from '../../../services/src/service-runtime.ts';
import { closeKv, getKv } from '@netscript/kv';
import { createQueue } from '@netscript/queue';
import type { RegisterJobInput } from '@netscript/plugin-workers-core/runtime';

// A real runtime, native queue, state store and dynamically imported user handler.
// The parent owns this isolated executable and its temporary project/KV file.
const [mode, override] = Deno.args;
// Keep the unrelated mutation publisher on an owned HTTP acknowledgement sink.
const streamSink = Deno.serve(
  { hostname: '127.0.0.1', port: 0, onListen: () => {} },
  (request) => new Response(null, { status: request.method === 'PUT' ? 201 : 200 }),
);
Deno.env.set('DURABLE_STREAMS_URL', `http://127.0.0.1:${streamSink.addr.port}`);
const budget = override ? { abortGracePeriodMs: Number(override) } : {};
await getKv({ provider: 'deno-kv', path: Deno.env.get('KV_URL'), skipServiceDiscovery: true });
const definitions = new Map<string, RegisterJobInput>([['cleanup', {
  id: 'cleanup',
  name: 'Cleanup',
  enabled: true,
  topic: 'jobs',
  executionType: 'deno',
  entrypoint: 'job.ts',
  timeout: 80,
  maxRetries: 0,
}]]);
const controller = new AbortController();
const options = {
  definitions,
  jobsDir: Deno.cwd(),
  queueName: 'budget-jobs',
  concurrency: 1,
  ...budget,
};
const running = mode === 'combined'
  ? startCombinedProcess({ ...options, signal: controller.signal })
  : startWorkerProcess(options);
void running.catch((error) => {
  console.error(error);
  Deno.exit(1);
});
const queue = createQueue('budget-jobs');
await queue.enqueue({ jobId: 'cleanup', topic: 'jobs', triggeredBy: 'queue' });
const state = createWorkersServiceRuntime().executionState;
for (let index = 0; index < 1_000; index++) {
  const records = await state.listByJob('cleanup', { limit: 1 });
  const terminal = records.find((record) =>
    ['timeout', 'failed', 'cancelled', 'completed'].includes(record.status)
  );
  if (terminal) {
    let cleaned = false;
    try {
      cleaned = await Deno.readTextFile('cleaned') === 'yes';
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
    if (terminal.status === 'failed') console.error('Execution failed:', terminal.error);
    console.log(JSON.stringify({ probe: 'worker-budget', cleaned, status: terminal.status }));
    if (mode === 'combined') {
      controller.abort();
      await running;
    }
    await queue.stop();
    await closeKv();
    await streamSink.shutdown();
    Deno.exit(0);
  }
  await new Promise((resolve) => setTimeout(resolve, 10));
}
throw new Error('Runtime did not settle the timed-out job.');
