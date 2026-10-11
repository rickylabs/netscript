import { assertEquals, assertRejects } from '@std/assert';
import { retryPrismaGenerate, stderrTail } from './fixtures/transition-store/provider-process.ts';

Deno.test('Prisma generation retries one failure and stops immediately on success', async () => {
  let calls = 0;
  await retryPrismaGenerate(() => {
    calls++;
    return Promise.resolve({
      success: calls === 2,
      code: calls === 2 ? 0 : 1,
      stderr: new Uint8Array(),
    });
  });
  assertEquals(calls, 2);
});

Deno.test('Prisma generation exhaustion and timeout fail clearly after two attempts', async () => {
  for (const timeout of [false, true]) {
    let calls = 0;
    await assertRejects(
      () =>
        retryPrismaGenerate(() => {
          calls++;
          if (timeout) return Promise.reject(new DOMException('generation timeout', 'AbortError'));
          return Promise.resolve({
            success: false,
            code: 42,
            stderr: new TextEncoder().encode('generator diagnostic'),
          });
        }),
      Error,
      timeout ? 'generation timeout' : 'exit 42: generator diagnostic',
    );
    assertEquals(calls, 2);
  }
});

Deno.test('child stderr is drained and only the final 8192 bytes survive arbitrary chunks', async () => {
  const bytes = new TextEncoder().encode('discarded-prefix' + 'x'.repeat(9000) + 'end-sentinel');
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes.slice(0, 8500));
      controller.enqueue(bytes.slice(8500));
      controller.close();
    },
  });
  assertEquals(await stderrTail(stream), new TextDecoder().decode(bytes.slice(-8192)));
});
