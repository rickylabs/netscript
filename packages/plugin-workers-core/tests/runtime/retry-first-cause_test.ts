import { assertStrictEquals } from '@std/assert';
import { executeJobWithRetry, resolveJobRetryPolicy } from '../../src/runtime/mod.ts';

for (
  const cause of [
    new Error('Handler failure.'),
    new DOMException('Deadline first.', 'TimeoutError'),
  ]
) {
  Deno.test(`retry retains ${cause.name} when shutdown races the rejected attempt`, async () => {
    const controller = new AbortController();
    const result = await executeJobWithRetry(
      () => {
        controller.abort(new DOMException('Later shutdown.', 'ShutdownError'));
        return Promise.reject(cause);
      },
      resolveJobRetryPolicy({ id: 'first-cause', maxRetries: 0 }),
      { signal: controller.signal },
    )
      .catch((error: unknown) => error);
    assertStrictEquals(result, cause);
  });
}
