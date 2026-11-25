import { assertEquals } from '@std/assert';
import { runFanoutRegression } from './test_utils/sse-fanout.ts';

for (const mode of ['none', 'sliding'] as const) {
  Deno.test(`file-backed Streams SSE fan-out stays under one second (${mode})`, async () => {
    const result = await runFanoutRegression(mode);
    assertEquals(result.result, 'PASS', JSON.stringify(result));
  });
}
