import { assertEquals } from '@std/assert';
import { TASKS } from '../bench.config.ts';
import { DynamicImportSuiteLoader } from '../src/adapters/test-runner/deno-http.ts';

Deno.test('task catalog registers t1+t2 with loadable non-empty matching suites', async () => {
  assertEquals(TASKS.map((task) => task.id), ['t1-storefront-api', 't2-saga-queue-cron']);

  const loader = new DynamicImportSuiteLoader();
  for (const task of TASKS) {
    const suite = await loader.load(task.testSuitePath);
    assertEquals(suite.taskId, task.id);
    assertEquals(suite.probes.length > 0, true);
  }
});
