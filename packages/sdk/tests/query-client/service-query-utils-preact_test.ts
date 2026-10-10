import { assert, assertEquals, assertStrictEquals } from '@std/assert';
import { oc } from '@orpc/contract';
import { z } from 'npm:zod@^4.4.3';
import { QueryClient } from '@tanstack/query-core';
import { createServiceQueryUtils } from '@netscript/sdk/query-client';
import type { ServiceClient } from '@netscript/sdk/ports';

Deno.test('service query options compile with the supported Preact hook and preserve inference', async () => {
  const result = await new Deno.Command(Deno.execPath(), {
    args: [
      'check',
      '--unstable-kv',
      new URL('../type-fixtures/service-query-utils-preact_type.ts', import.meta.url).pathname,
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
});

Deno.test('service query functions forward cancellation and required client context', async () => {
  const contract = {
    list: oc.input(z.object({ offset: z.number(), limit: z.number() })).output(
      z.array(z.object({ id: z.string() })),
    ),
  };
  const controller = new AbortController();
  const client: ServiceClient<typeof contract, { accessToken: string }> = {
    list: (input, options) => {
      assertEquals(input, { offset: 0, limit: 20 });
      assertEquals(options.context.accessToken, 'fixture-only');
      assert('signal' in options && options.signal instanceof AbortSignal);
      assertStrictEquals(options.signal, controller.signal);
      assertEquals(options.signal.aborted, true);
      return Promise.resolve([{ id: 'order-1' }]);
    },
  };
  const utils = createServiceQueryUtils(client);
  const options = utils.list.queryOptions({
    input: { offset: 0, limit: 20 },
    context: { accessToken: 'fixture-only' },
  });
  controller.abort();
  const queryClient = new QueryClient();
  try {
    assertEquals(
      await options.queryFn({
        client: queryClient,
        queryKey: options.queryKey,
        signal: controller.signal,
        meta: undefined,
      }),
      [{ id: 'order-1' }],
    );
  } finally {
    queryClient.clear();
  }
});
