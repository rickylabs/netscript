/**
 * Compatibility coverage for the TanStack AI anti-corruption boundary.
 *
 * @module
 */

import { assertEquals } from '@std/assert';
import { EventType } from '@tanstack/ai';
import type { AnyTextAdapter, StreamChunk } from '@tanstack/ai';

import { toTanstackChatClient } from '../src/adapters/tanstack-chat-client.ts';
import type { ChatClientEvent } from '../src/ports/chat-client.ts';

/** Build the smallest text adapter that emits the supplied TanStack chunks. */
function streamingAdapter(chunks: readonly StreamChunk[]): AnyTextAdapter {
  return {
    kind: 'text',
    name: 'compatibility-test',
    model: 'compatibility-test-model',
    '~types': {
      providerOptions: {},
      inputModalities: [],
      messageMetadataByModality: {},
      toolCapabilities: [],
      toolCallMetadata: {},
      systemPromptMetadata: {},
    },
    chatStream(): AsyncIterable<StreamChunk> {
      return (async function* () {
        yield* chunks;
      })();
    },
    structuredOutput(): Promise<never> {
      return Promise.reject(new Error('structuredOutput is not exercised by this test'));
    },
  };
}

async function collect(chunks: readonly StreamChunk[]): Promise<ChatClientEvent[]> {
  const client = toTanstackChatClient(streamingAdapter(chunks), {
    kind: 'text',
    name: 'compatibility-test',
  });
  const events: ChatClientEvent[] = [];
  for await (const event of client.stream({ messages: [{ role: 'user', content: 'hello' }] })) {
    events.push(event);
  }
  return events;
}

Deno.test('TanStack bridge retains tool names across 0.52 tool-end events', async () => {
  const events = await collect([
    {
      type: EventType.TOOL_CALL_START,
      toolCallId: 'call-1',
      toolCallName: 'weather',
    },
    {
      type: EventType.TOOL_CALL_ARGS,
      toolCallId: 'call-1',
      delta: '{"city":"Paris"}',
    },
    {
      type: EventType.TOOL_CALL_END,
      toolCallId: 'call-1',
    },
  ]);

  assertEquals(events, [{
    type: 'tool-call',
    toolCall: {
      id: 'call-1',
      name: 'weather',
      arguments: '{"city":"Paris"}',
    },
  }]);
});

Deno.test('TanStack bridge converts 0.52 AG-UI usage arrays', async () => {
  const events = await collect([{
    type: EventType.RUN_FINISHED,
    threadId: 'thread-1',
    runId: 'run-1',
    usage: [{
      provider: 'test-provider',
      model: 'test-model',
      inputTokens: 2,
      outputTokens: 3,
      totalTokens: 6,
    }],
    finishReason: 'stop',
  }]);

  assertEquals(events, [{
    type: 'finish',
    usage: { promptTokens: 2, completionTokens: 3, totalTokens: 6 },
    finishReason: undefined,
  }]);
});
