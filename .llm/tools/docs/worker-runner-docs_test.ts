import { assert, assertMatch } from '@std/assert';
const revision = Deno.env.get('DOCS_REVISION');
async function read(path: string): Promise<string> {
  if (!revision) return await Deno.readTextFile(path);
  const output = await new Deno.Command('git', { args: ['show', `${revision}:${path}`] }).output();
  assert(output.success);
  return new TextDecoder().decode(output.stdout);
}
Deno.test('worker pages and diagrams describe implemented jobs and reserved modes', async () => {
  for (
    const path of [
      'docs/site/background-processing/workers.md',
      'docs/site/background-processing/how-to/tune-worker-runtime.md',
      'docs/site/tutorials/erp-sync/04-queue-and-cron.md',
      'docs/site/_diagrams/queue-worker-scheduler.mmd',
      'docs/site/_diagrams/plugin-thread-isolation.mmd',
      'docs/site/assets/diagrams/queue-worker-scheduler.svg',
      'docs/site/assets/diagrams/plugin-thread-isolation.svg',
    ]
  ) {
    const text = await read(path);
    assert(
      !/20[–-]40|20–40|V8 isolates running jobs in parallel|thread-isolated worker|Web Worker pool the runner spins up/
        .test(text),
      path,
    );
    assertMatch(text, /[Ii]n-process/, path);
    if (!path.includes('04-queue')) assertMatch(text, /[Rr]eserved/, path);
  }
  assertMatch(
    await read('packages/plugin-workers-core/src/domain/constants.ts'),
    /Only `in-process` is implemented/,
  );
  assertMatch(
    await read('plugins/workers/worker/job-runner-pool.ts'),
    /Reserved for a future isolate pool/,
  );
});
Deno.test('startup log accurately names in-process runner', async () => {
  const text = await read('plugins/workers/worker/worker.ts');
  assertMatch(text, /Starting in-process job runner \(queue concurrency:/);
  assert(!text.includes('Starting with Web Worker pool'));
});
