import { assertEquals } from '@std/assert';
import { deadline } from '@std/async/deadline';
import { createElement } from 'react';
// @deno-types="npm:@types/react-test-renderer@19.1.0"
import { act, create } from 'react-test-renderer';
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

Deno.test('React stream hook exposes a fatal failure before readiness without hanging', async () => {
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
    parse: (): { id: string } => {
      throw new TypeError('Invalid execution');
    },
    getKey: (value) => value.id,
  });
  const done = binding.done.catch((error: unknown) => error);
  const preload = binding.collection.preload().catch((error: unknown) => error);
  function Screen() {
    const result = useStreamLiveQueryV1(binding.collection);
    return createElement(
      'text',
      null,
      `${result.status}:${result.isLoading}:${result.error?.message}`,
    );
  }
  let renderer!: ReturnType<typeof create>;
  try {
    await act(() => {
      renderer = create(createElement(Screen));
    });
    await act(async () => {
      const changes = [{
        type: 'execution',
        key: '1',
        value: { id: '1' },
        headers: {
          operation: 'upsert',
          correlationId: '1',
          traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
        },
      }];
      controller.enqueue(new TextEncoder().encode(
        `event: data\ndata: ${
          JSON.stringify(changes)
        }\n\nevent: control\ndata: {"streamNextOffset":"opaque:1"}\n\n`,
      ));
      await done;
    });
    assertEquals(await done instanceof TypeError, true);
    assertEquals(binding.collection.status, 'cleaned-up');
    assertEquals(renderer.toJSON(), {
      type: 'text',
      props: {},
      children: ['error:false:Invalid execution'],
    });
    assertEquals(await deadline(preload, 1_000) instanceof TypeError, true);
    await act(() => renderer.unmount());
    // A remount renders the stored failure; it cannot restart the closed source.
    await act(() => {
      renderer = create(createElement(Screen));
    });
    assertEquals(renderer.toJSON(), {
      type: 'text',
      props: {},
      children: ['error:false:Invalid execution'],
    });
  } finally {
    await act(() => renderer?.unmount());
    await binding.dispose().catch(() => {});
    Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  }
});
