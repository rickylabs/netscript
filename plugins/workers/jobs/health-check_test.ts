import { assertEquals } from '@std/assert';
import healthCheckJob from './health-check.ts';

Deno.test('health-check contribution keeps its id and executes through payload validation', async () => {
  const progress: number[] = [];

  assertEquals(healthCheckJob.id, 'workers-plugin-health-check');
  assertEquals(Object.isExtensible(healthCheckJob), true);
  assertEquals(
    Object.getOwnPropertyDescriptor(healthCheckJob, 'payloadSchema')?.writable,
    false,
  );

  const result = await healthCheckJob({
    id: 'health-check-regression',
    payload: { verbose: false },
    reportProgress: (percent) => {
      progress.push(percent);
    },
  });

  assertEquals(result.success, true);
  assertEquals(progress, [20, 40, 60, 80, 100]);
});
