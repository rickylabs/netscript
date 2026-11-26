import { assertEquals, assertFalse, assertThrows } from '@std/assert';
import type {
  StreamEventSourceV1,
  StreamSseConsumerEventV1,
} from '@netscript/plugin-streams-core/sse';
import {
  createNetScriptStreamEventSourceV1,
  type NetScriptStreamEventSourceBindingV1,
} from './create-stream-event-source.ts';

class FakeEventSource extends EventTarget implements StreamEventSourceV1 {
  readyState: number;
  closed = false;
  constructor(readyState = 1) {
    super();
    this.readyState = readyState;
  }
  close(): void {
    this.closed = true;
    this.readyState = 2;
  }
}

function makeChangeBatch(key: string): string {
  return JSON.stringify([{
    type: 'projects',
    key,
    value: { id: key },
    headers: {
      operation: 'upsert',
      correlationId: `corr-${key}`,
      traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
    },
  }]);
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

Deno.test('Gate 5 Fresh proxyUrl mode: single offset authority, no /v1/stream/netscript prepend, no forced live=sse, and strict validation', () => {
  // 1. proxyUrl omitting ?offset= sets options.offset, preserves app query params, does not prepend /v1/stream/netscript or force live=sse
  const source1 = new FakeEventSource();
  let received1 = '';
  const binding1 = createNetScriptStreamEventSourceV1({
    proxyUrl: 'https://app.example.test/api/streams/projects/p1?view=summary&tag=a&tag=b',
    offset: '-1',
    createEventSource: (url) => {
      received1 = url;
      return source1;
    },
    onEvent: () => undefined,
  });
  assertEquals(
    received1,
    'https://app.example.test/api/streams/projects/p1?view=summary&tag=a&tag=b&offset=-1',
  );
  assertFalse(received1.includes('/v1/stream/netscript'));
  assertFalse(received1.includes('live='));
  assertEquals(binding1.url, received1);
  assertEquals(binding1.snapshot().lastCommittedOffset, '-1');
  binding1.dispose();

  // 2. proxyUrl carrying the exact same single ?offset= preserves it cleanly
  const source2 = new FakeEventSource();
  let received2 = '';
  const binding2 = createNetScriptStreamEventSourceV1({
    proxyUrl: 'https://app.example.test/api/streams/projects/p1?offset=0000_0001&view=summary',
    offset: '0000_0001',
    createEventSource: (url) => {
      received2 = url;
      return source2;
    },
    onEvent: () => undefined,
  });
  assertEquals(
    received2,
    'https://app.example.test/api/streams/projects/p1?offset=0000_0001&view=summary',
  );
  assertEquals(binding2.snapshot().lastCommittedOffset, '0000_0001');
  binding2.dispose();

  // 3. Conflicting ?offset= or duplicate ?offset= throws TypeError synchronously
  assertThrows(
    () =>
      createNetScriptStreamEventSourceV1({
        proxyUrl: 'https://app.example.test/api/streams/projects/p1?offset=old',
        offset: 'new',
        createEventSource: () => new FakeEventSource(),
        onEvent: () => undefined,
      }),
    TypeError,
    'conflicting offset between proxyUrl and options.offset',
  );
  for (
    const dupUrl of [
      'https://app.example.test/api/streams/projects/p1?offset=a&offset=b',
      'https://app.example.test/api/streams/projects/p1?offset=-1&offset=-1',
    ]
  ) {
    assertThrows(
      () =>
        createNetScriptStreamEventSourceV1({
          proxyUrl: dupUrl,
          offset: '-1',
          createEventSource: () => new FakeEventSource(),
          onEvent: () => undefined,
        }),
      TypeError,
      'conflicting offset between proxyUrl and options.offset',
    );
  }

  // 4. Mutual exclusion with streamPath / baseUrl, missing mode, and non-http(s) URL throw TypeError
  assertThrows(
    () =>
      createNetScriptStreamEventSourceV1({
        proxyUrl: 'https://app.example.test/api/streams/projects/p1',
        streamPath: '/projects/p1',
        offset: '-1',
        createEventSource: () => new FakeEventSource(),
        onEvent: () => undefined,
      } as never),
    TypeError,
    'proxyUrl cannot be combined with streamPath or baseUrl',
  );
  assertThrows(
    () =>
      createNetScriptStreamEventSourceV1({
        proxyUrl: 'https://app.example.test/api/streams/projects/p1',
        baseUrl: 'https://streams.example.test',
        offset: '-1',
        createEventSource: () => new FakeEventSource(),
        onEvent: () => undefined,
      } as never),
    TypeError,
    'proxyUrl cannot be combined with streamPath or baseUrl',
  );
  assertThrows(
    () =>
      createNetScriptStreamEventSourceV1({
        offset: '-1',
        createEventSource: () => new FakeEventSource(),
        onEvent: () => undefined,
      } as never),
    TypeError,
  );
  assertThrows(
    () =>
      createNetScriptStreamEventSourceV1({
        proxyUrl: 'javascript:alert(1)',
        offset: '-1',
        createEventSource: () => new FakeEventSource(),
        onEvent: () => undefined,
      }),
    TypeError,
  );

  // 5. Canonical isValidStreamOffset validation rejects malformed offsets synchronously
  for (const badOffset of ['', 'has space', 'bad?q', 'bad&x', 'bad#f', 'a\nb', 'x'.repeat(513)]) {
    assertThrows(
      () =>
        createNetScriptStreamEventSourceV1({
          proxyUrl: 'https://app.example.test/api/streams/projects/p1',
          offset: badOffset,
          createEventSource: () => new FakeEventSource(),
          onEvent: () => undefined,
        }),
      TypeError,
      'invalid offset',
    );
  }
});

Deno.test('Gate 5 control-only commit, interrupted-delivery reconnect from lastCommittedOffset, and terminal EventSource.CLOSED stop', () => {
  const openedUrls: string[] = [];
  const sources: FakeEventSource[] = [];
  const committedKeys: string[] = [];
  const terminalErrors: string[] = [];
  let reconnectScheduled = 0;

  let currentOffset = '-1';
  let currentCursor: string | undefined;
  let binding: NetScriptStreamEventSourceBindingV1 | undefined;
  let stopped = false;

  const open = (): void => {
    if (stopped) return;
    let uncommitted: string[] = [];
    binding = createNetScriptStreamEventSourceV1({
      proxyUrl: 'https://app.example.test/api/streams/projects/p1',
      offset: currentOffset,
      lastObservedCursor: currentCursor,
      createEventSource: (url) => {
        openedUrls.push(url);
        const src = new FakeEventSource(1);
        sources.push(src);
        return src;
      },
      onEvent(event: StreamSseConsumerEventV1) {
        if (event.event === 'data') {
          uncommitted.push(...event.payload.map((c) => c.key));
          return;
        }
        if (event.event === 'control' || event.event === 'heartbeat') {
          const snap = binding!.snapshot();
          currentOffset = snap.lastCommittedOffset ?? currentOffset;
          currentCursor = snap.lastObservedCursor;
          if (event.event === 'control' && uncommitted.length > 0) {
            committedKeys.push(...uncommitted);
            uncommitted = [];
          }
          return;
        }
        if (event.event === 'error') {
          const snap = binding!.snapshot();
          currentOffset = snap.lastCommittedOffset ?? currentOffset;
          currentCursor = snap.lastObservedCursor;
          uncommitted = [];
          binding?.dispose();
          binding = undefined;
          if (!event.payload.retryable) {
            stopped = true;
            terminalErrors.push(event.payload.code);
            return;
          }
          reconnectScheduled += 1;
        }
      },
    });
  };

  // Connection 1: commit batch 1 (offset_1)
  open();
  assertEquals(openedUrls, ['https://app.example.test/api/streams/projects/p1?offset=-1']);
  sources[0]!.dispatchEvent(new MessageEvent('data', { data: makeChangeBatch('batch-1') }));
  assertEquals(committedKeys, []); // NOT committed before control!
  sources[0]!.dispatchEvent(
    new MessageEvent('control', {
      data: JSON.stringify({ streamNextOffset: 'offset_1', streamCursor: 'cur_1' }),
    }),
  );
  assertEquals(committedKeys, ['batch-1']);
  assertEquals(binding!.snapshot().lastCommittedOffset, 'offset_1');

  // Deliver batch 2 data WITHOUT committing control, then drop transport (readyState: 0 -> retryable: true)
  sources[0]!.dispatchEvent(new MessageEvent('data', { data: makeChangeBatch('batch-2') }));
  assertEquals(committedKeys, ['batch-1']); // Batch 2 MUST NOT have committed!
  assertEquals(binding!.snapshot().lastCommittedOffset, 'offset_1');
  assertEquals(binding!.snapshot().pendingBatches.length, 1);

  sources[0]!.readyState = 0; // EventSource.CONNECTING (transient drop)
  sources[0]!.dispatchEvent(new Event('error'));
  assertEquals(sources[0]!.closed, true);
  assertEquals(reconnectScheduled, 1);
  assertEquals(terminalErrors, []);
  assertEquals(currentOffset, 'offset_1');

  // Connection 2: rebuild strictly from lastCommittedOffset (offset_1, NOT original -1)
  open();
  assertEquals(openedUrls[1], 'https://app.example.test/api/streams/projects/p1?offset=offset_1');
  sources[1]!.dispatchEvent(new MessageEvent('data', { data: makeChangeBatch('batch-2') }));
  sources[1]!.dispatchEvent(
    new MessageEvent('control', { data: JSON.stringify({ streamNextOffset: 'offset_2' }) }),
  );
  // Batch 2 committed EXACTLY ONCE, zero gap, zero duplicate side effects
  assertEquals(committedKeys, ['batch-1', 'batch-2']);
  assertEquals(binding!.snapshot().lastCommittedOffset, 'offset_2');

  // Connection 2 receives terminal EventSource.CLOSED (readyState === 2, e.g. 401/403 denial)
  sources[1]!.readyState = 2;
  sources[1]!.dispatchEvent(new Event('error'));
  assertEquals(sources[1]!.closed, true);
  assertEquals(terminalErrors, ['transport-error']);
  assertEquals(reconnectScheduled, 1); // ZERO new reconnect attempts scheduled!
  assertEquals(stopped, true);
});
