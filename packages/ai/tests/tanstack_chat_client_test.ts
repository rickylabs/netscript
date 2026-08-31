/**
 * Regression coverage for the TanStack-to-owned chat boundary.
 *
 * @module
 */

import { assert, assertEquals, assertStrictEquals, assertThrows } from '@std/assert';
import { EventType } from '@tanstack/ai';
import type { AnyTextAdapter, StreamChunk, TokenUsage } from '@tanstack/ai';

import type { ChatClientEvent } from '../src/ports/chat-client.ts';
import { toTanstackChatClient } from '../src/adapters/tanstack-chat-client.ts';

const FULL_USAGE = {
  promptTokens: 101,
  completionTokens: 102,
  totalTokens: 103,
  promptTokensDetails: {
    cachedTokens: 201,
    cacheWriteTokens: 202,
    audioTokens: 203,
    videoTokens: 204,
    imageTokens: 205,
    textTokens: 206,
    documentTokens: 207,
  },
  completionTokensDetails: {
    reasoningTokens: 301,
    audioTokens: 302,
    videoTokens: 303,
    imageTokens: 304,
    textTokens: 305,
    documentTokens: 306,
  },
  durationSeconds: 401,
  unitsBilled: 402,
  providerUsageDetails: {
    providerRequestId: 'usage-sentinel-403',
  },
  cost: 501,
  costDetails: {
    upstreamCost: 502,
    upstreamInputCost: 503,
    upstreamOutputCost: 504,
  },
} satisfies TokenUsage;

const EXPECTED_USAGE_LEAF_COUNT = 23;

function createUsageAdapter(usage?: TokenUsage): AnyTextAdapter {
  return {
    kind: 'text',
    name: 'usage-fixture',
    model: 'usage-fixture-model',
    '~types': {
      providerOptions: {},
      inputModalities: [],
      messageMetadataByModality: {},
      toolCapabilities: [],
      toolCallMetadata: {},
      systemPromptMetadata: {},
    },
    chatStream(): AsyncIterable<StreamChunk> {
      return (async function* (): AsyncGenerator<StreamChunk> {
        yield {
          type: EventType.RUN_FINISHED,
          threadId: 'usage-thread',
          runId: 'usage-run',
          finishReason: 'stop',
          usage,
        };
      })();
    },
    structuredOutput(): Promise<never> {
      return Promise.reject(new Error('structuredOutput is not exercised by this test'));
    },
  };
}

async function collectEvents(usage?: TokenUsage): Promise<ChatClientEvent[]> {
  const client = toTanstackChatClient(createUsageAdapter(usage), {
    name: 'usage-fixture',
    kind: 'text',
  });
  const events: ChatClientEvent[] = [];
  for await (
    const event of client.stream({
      messages: [{ role: 'user', content: 'report usage' }],
    })
  ) {
    events.push(event);
  }
  return events;
}

function leafEntries(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) {
    return [`${prefix}=${JSON.stringify(value)}`];
  }
  return Object.entries(value).flatMap(([key, nested]) =>
    leafEntries(nested, prefix.length === 0 ? key : `${prefix}.${key}`)
  ).sort();
}

function assertCompleteUsage(actual: unknown, expected: TokenUsage): void {
  assertEquals(actual, expected, 'the bridge dropped or changed usage detail');
  assertStrictEquals(actual, expected, 'the bridge reconstructed the upstream usage object');
  const expectedLeaves = leafEntries(expected);
  assertEquals(expectedLeaves.length, EXPECTED_USAGE_LEAF_COUNT);
  assertEquals(
    leafEntries(actual),
    expectedLeaves,
    'the bridge changed the recursive usage leaf census',
  );
}

Deno.test('TanStack usage: a fully populated upstream object survives the owned boundary', async () => {
  const events = await collectEvents(FULL_USAGE);
  assertEquals(events.length, 1);
  const finish = events[0];
  assert(finish?.type === 'finish');
  assertEquals(finish.finishReason, 'stop');
  assertCompleteUsage(finish.usage, FULL_USAGE);
});

Deno.test('TanStack usage: the completeness oracle rejects the old core-only projection', () => {
  const oldProjection = {
    promptTokens: FULL_USAGE.promptTokens,
    completionTokens: FULL_USAGE.completionTokens,
    totalTokens: FULL_USAGE.totalTokens,
  };
  assertThrows(() => assertCompleteUsage(oldProjection, FULL_USAGE));
});

Deno.test('TanStack usage: an omitted upstream usage remains omitted', async () => {
  const events = await collectEvents();
  assertEquals(events.length, 1);
  const finish = events[0];
  assert(finish?.type === 'finish');
  assertEquals(finish.usage, undefined);
});
