import { assertEquals } from '@std/assert';
import {
  bindStreamEventSourceV1,
  type StreamSourceListenerV1,
  type StreamSseConsumerEventV1,
} from '../../src/sse/mod.ts';

Deno.test('existing v1 binding accepts structural messages with DOM constructors absent', () => {
  const names = ['EventSource', 'MessageEvent', 'Event', 'EventTarget'];
  const saved = names.map((name) =>
    [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const
  );
  for (const name of names) Reflect.deleteProperty(globalThis, name);
  const listeners = new Map<string, StreamSourceListenerV1>();
  const events: StreamSseConsumerEventV1[] = [];
  let closed = false;
  try {
    const binding = bindStreamEventSourceV1({
      source: {
        addEventListener(type, listener) {
          listeners.set(type, listener);
        },
        removeEventListener(type) {
          listeners.delete(type);
        },
        close() {
          closed = true;
        },
      },
      onEvent: (event) => events.push(event),
    });
    listeners.get('control')!({
      type: 'control',
      data: '{"streamNextOffset":"opaque:7","upToDate":true}',
    });
    listeners.get('data')!({ type: 'data', data: { forged: true } });
    assertEquals(events.map((event) => event.event), ['heartbeat', 'error']);
    assertEquals(binding.snapshot().lastCommittedOffset, 'opaque:7');
    binding.dispose();
    assertEquals(listeners.size, 0);
    assertEquals(closed, true);
  } finally {
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    }
  }
});
