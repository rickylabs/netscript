import { assertEquals } from '@std/assert';
import { createCockpitStream } from '../../examples/expo-streams/cockpit.ts';
import type { StreamFetchV1 } from '@netscript/sdk/streams/consumer';

Deno.test('Expo reference factory consumes cockpit execution stream using only SDK imports and injected fetch', async () => {
  let reads = 0;
  const injected: StreamFetchV1 = (_url, init) => {
    assertEquals(init.method ?? 'GET', 'GET');
    reads++;
    const value = [{
      type: 'execution',
      key: 'worker-1',
      value: { id: 'worker-1', status: 'succeeded' },
      headers: {
        operation: 'upsert',
        correlationId: 'job-1',
        traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
      },
    }];
    const frame = `event: data\ndata: ${
      JSON.stringify(value)
    }\n\nevent: control\ndata: {"streamNextOffset":"opaque:1","upToDate":true,"streamClosed":true}\n\n`;
    return Promise.resolve(
      new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(frame));
            controller.close();
          },
        }),
        { headers: { 'content-type': 'text/event-stream' } },
      ),
    );
  };
  const binding = createCockpitStream(
    'https://api.example.com/v1/stream/netscript/workers/executions?offset=-1',
    injected,
  );
  try {
    await binding.done;
    assertEquals(binding.collection.get('worker-1')?.status, 'succeeded');
    assertEquals(binding.snapshot().lastCommittedOffset, 'opaque:1');
    assertEquals(reads, 1);
  } finally {
    await binding.dispose();
  }
});
