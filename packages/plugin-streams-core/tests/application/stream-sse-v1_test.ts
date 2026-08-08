import { assertEquals, assertFalse } from '@std/assert';
import {
  bindStreamEventSourceV1,
  createStreamSseReplayStateV1,
  parseStreamSseEventV1,
  reduceStreamSseReplayStateV1,
  STREAM_SSE_CONSUMER_EVENT_NAMES_V1,
  STREAM_SSE_CONTRACT_V1,
  STREAM_SSE_WIRE_EVENT_NAMES_V1,
  type StreamEventSourceV1,
  type StreamSseConsumerEventV1,
} from '../../src/sse/mod.ts';

const TRACEPARENT = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';

function change(operation: 'upsert' | 'delete' = 'upsert'): Record<string, unknown> {
  const base: Record<string, unknown> = {
    type: 'todos',
    key: 'todo-1',
    headers: {
      operation,
      correlationId: 'request-42',
      traceparent: TRACEPARENT,
      tracestate: 'vendor=value',
    },
  };
  if (operation !== 'delete') {
    base.value = { title: 'ship' };
  }
  return base;
}

class FakeEventSource extends EventTarget implements StreamEventSourceV1 {
  closed = false;

  close(): void {
    this.closed = true;
  }
}

Deno.test('v1 authority exhaustively separates wire names from consumer outcomes', () => {
  assertEquals(STREAM_SSE_CONTRACT_V1.version, '1');
  assertEquals(STREAM_SSE_WIRE_EVENT_NAMES_V1, ['data', 'control']);
  assertEquals(STREAM_SSE_CONSUMER_EVENT_NAMES_V1, [
    'data',
    'control',
    'heartbeat',
    'error',
  ]);
  assertEquals(STREAM_SSE_CONTRACT_V1.wireEventNames, STREAM_SSE_WIRE_EVENT_NAMES_V1);
});

Deno.test('data schema accepts an ordered batch with W3C identity and deletion semantics', () => {
  const result = STREAM_SSE_CONTRACT_V1.schemas.data['~standard'].validate([
    change(),
    change('delete'),
  ]);
  assertEquals('value' in result, true);

  const objectInsteadOfBatch = STREAM_SSE_CONTRACT_V1.schemas.data['~standard'].validate(change());
  const emptyBatch = STREAM_SSE_CONTRACT_V1.schemas.data['~standard'].validate([]);
  const deleteWithValue = change('delete');
  deleteWithValue.value = { forbidden: true };
  const invalidDelete = STREAM_SSE_CONTRACT_V1.schemas.data['~standard'].validate([
    deleteWithValue,
  ]);
  assertFalse('value' in objectInsteadOfBatch);
  assertFalse('value' in emptyBatch);
  assertFalse('value' in invalidDelete);
});

Deno.test('malformed and unknown frames are non-retryable and never invent an offset', () => {
  assertEquals(parseStreamSseEventV1({ eventName: 'data', data: '{' }), {
    ok: false,
    error: {
      code: 'malformed-frame',
      eventName: 'data',
      message: 'Invalid JSON in data frame',
      retryable: false,
      lastCommittedOffset: undefined,
    },
  });
  assertEquals(
    parseStreamSseEventV1({
      eventName: 'future-v2',
      data: '{}',
      lastCommittedOffset: 'opaque:0007-A',
    }),
    {
      ok: false,
      error: {
        code: 'unsupported-event',
        eventName: 'future-v2',
        message: 'Unsupported SSE event: future-v2',
        retryable: false,
        lastCommittedOffset: 'opaque:0007-A',
      },
    },
  );
});

Deno.test('replay commits opaque offset, cursor, and terminal state only on control', () => {
  const initial = createStreamSseReplayStateV1({ lastCommittedOffset: 'opaque:before' });
  const data = parseStreamSseEventV1({ eventName: 'data', data: JSON.stringify([change()]) });
  if (!data.ok) throw new Error('expected valid data fixture');
  const pending = reduceStreamSseReplayStateV1(initial, data.frame);
  assertEquals(pending.state.lastCommittedOffset, 'opaque:before');
  assertEquals(pending.state.pendingBatches.length, 1);

  const control = parseStreamSseEventV1({
    eventName: 'control',
    data: JSON.stringify({
      streamNextOffset: 'opaque:after/A',
      streamCursor: 'cursor:server-owned',
      upToDate: true,
      streamClosed: true,
    }),
  });
  if (!control.ok) throw new Error('expected valid control fixture');
  const committed = reduceStreamSseReplayStateV1(pending.state, control.frame);
  assertEquals(committed.event.event, 'control');
  assertEquals(committed.state, {
    lastCommittedOffset: 'opaque:after/A',
    lastObservedCursor: 'cursor:server-owned',
    streamClosed: true,
    pendingBatches: [],
  });
});

Deno.test('up-to-date control without pending data is a heartbeat outcome', () => {
  const control = parseStreamSseEventV1({
    eventName: 'control',
    data: JSON.stringify({ streamNextOffset: 'token-Z', upToDate: true }),
  });
  if (!control.ok) throw new Error('expected valid control fixture');
  const result = reduceStreamSseReplayStateV1(createStreamSseReplayStateV1(), control.frame);
  assertEquals(result.event.event, 'heartbeat');
  assertEquals(result.state.lastCommittedOffset, 'token-Z');
});

Deno.test('native binding registers named events and preserves replay state on errors', () => {
  const source = new FakeEventSource();
  const events: StreamSseConsumerEventV1[] = [];
  const binding = bindStreamEventSourceV1({ source, onEvent: (event) => events.push(event) });

  source.dispatchEvent(new MessageEvent('data', { data: JSON.stringify([change()]) }));
  source.dispatchEvent(
    new MessageEvent('control', {
      data: JSON.stringify({ streamNextOffset: 'server-token-9', streamCursor: 'cursor-9' }),
    }),
  );
  source.dispatchEvent(new MessageEvent('data', { data: '{}' }));
  source.dispatchEvent(new Event('error'));

  assertEquals(events.map((event) => event.event), ['data', 'control', 'error', 'error']);
  assertEquals(binding.snapshot().lastCommittedOffset, 'server-token-9');
  assertEquals(binding.snapshot().lastObservedCursor, 'cursor-9');
  binding.dispose();
  assertEquals(source.closed, true);
});
