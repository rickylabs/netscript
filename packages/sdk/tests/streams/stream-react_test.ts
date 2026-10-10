import { assertEquals } from '@std/assert';
import { createElement } from 'npm:react@19.2.8';
// @deno-types="npm:@types/react-test-renderer@19.1.0"
import { act, create } from 'npm:react-test-renderer@19.2.8';
import { createStreamCollectionV1 } from '@netscript/sdk/streams/collections';
import { useStreamLiveQueryV1 } from '@netscript/sdk/streams/react';

Deno.test('React stream hook rerenders direct sync writes and unsubscribes on unmount', async () => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const binding = createStreamCollectionV1({
    type: 'execution',
    url: 'https://api.example.com/stream?offset=-1',
    fetch: () =>
      Promise.resolve(
        new Response(
          new ReadableStream<Uint8Array>({
            start(value) {
              controller = value;
            },
          }),
          { headers: { 'content-type': 'text/event-stream' } },
        ),
      ),
    parse: (value): { id: string; status: string } => {
      if (
        !value || typeof value !== 'object' || !('id' in value) || !('status' in value) ||
        typeof value.id !== 'string' || typeof value.status !== 'string'
      ) throw new TypeError('execution');
      return { id: value.id, status: value.status };
    },
    getKey: (value) => value.id,
  });
  function Screen() {
    const result = useStreamLiveQueryV1(binding.collection);
    return createElement('text', null, result.data.map((row) => row.status).join(','));
  }
  let renderer!: ReturnType<typeof create>;
  const send = async (status: string, offset: string) => {
    await act(async () => {
      const changes = [{
        type: 'execution',
        key: '1',
        value: { id: '1', status },
        headers: {
          operation: 'upsert',
          correlationId: '1',
          traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
        },
      }];
      controller.enqueue(
        new TextEncoder().encode(
          `event: data\ndata: ${
            JSON.stringify(changes)
          }\n\nevent: control\ndata: {"streamNextOffset":"${offset}","upToDate":true}\n\n`,
        ),
      );
      for (let i = 0; i < 100; i++) await Promise.resolve();
    });
  };
  try {
    await act(() => {
      renderer = create(createElement(Screen));
    });
    await send('running', 'opaque:1');
    assertEquals(renderer.toJSON(), { type: 'text', props: {}, children: ['running'] });
    await send('succeeded', 'opaque:2');
    assertEquals(renderer.toJSON(), { type: 'text', props: {}, children: ['succeeded'] });
    await act(() => renderer.unmount());
    await new Promise((resolve) => setTimeout(resolve, 50));
    assertEquals(binding.collection.subscriberCount, 0);
  } finally {
    await act(() => renderer?.unmount());
    await binding.dispose();
    Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  }
});
