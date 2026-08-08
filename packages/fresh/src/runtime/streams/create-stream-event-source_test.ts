import { assertEquals } from '@std/assert';
import type { StreamEventSourceV1 } from '@netscript/plugin-streams-core/sse';
import { createNetScriptStreamEventSourceV1 } from './create-stream-event-source.ts';

class FakeEventSource extends EventTarget implements StreamEventSourceV1 {
  closed = false;
  close(): void {
    this.closed = true;
  }
}

Deno.test('Fresh SSE helper constructs live named-event URL and exposes replay snapshot', () => {
  const source = new FakeEventSource();
  let received = '';
  const binding = createNetScriptStreamEventSourceV1({
    baseUrl: 'https://streams.example.test',
    streamPath: '/workers/executions',
    offset: 'opaque:start/A',
    createEventSource: (url) => {
      received = url;
      return source;
    },
    onEvent: () => undefined,
  });

  assertEquals(
    received,
    'https://streams.example.test/v1/stream/netscript/workers/executions?offset=opaque%3Astart%2FA&live=sse',
  );
  assertEquals(binding.url, received);
  assertEquals(binding.snapshot().lastCommittedOffset, 'opaque:start/A');
  binding.dispose();
  assertEquals(source.closed, true);
});
