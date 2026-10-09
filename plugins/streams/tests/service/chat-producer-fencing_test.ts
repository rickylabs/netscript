/**
 * Real-server regression for fenced durable chat appends (#2067).
 *
 * Boots the streams service in-process — its own server factory
 * (`createStreamsServer`, file-backed) fronted by its own proxy handler — and
 * drives `toNetScriptChatResponse` from `@netscript/fresh/ai` against it. Every
 * producer request that crosses the service front is recorded so the tests can
 * prove what was sent, not only what was stored.
 *
 * @module
 */

import { assert, assertEquals, assertInstanceOf, assertRejects } from '@std/assert';
import { Hono } from 'hono';
import { toDurableChatSessionResponse } from 'npm:@durable-streams/tanstack-ai-transport@^0.0.8';
import { createStreamsServer } from '../../services/src/bounded-file-store.ts';
import { createStreamsProxyHandler } from '../../services/src/proxy.ts';
import {
  type NetScriptChatMessage,
  resolveChatSessionUrl,
  toNetScriptChatResponse,
} from '../../../../packages/fresh/src/runtime/ai/create-chat-connection.ts';
import { NetScriptChatProducerError } from '../../../../packages/fresh/src/runtime/ai/chat-producer.ts';

interface RecordedAppend {
  readonly path: string;
  readonly status: number;
  readonly producerId: string | null;
  readonly epoch: string | null;
  readonly seq: string | null;
  readonly items: readonly Record<string, unknown>[];
}

interface StreamsHarness {
  readonly baseUrl: string;
  readonly appends: RecordedAppend[];
  read(path: string): Promise<string>;
  [Symbol.asyncDispose](): Promise<void>;
}

async function startStreamsService(): Promise<StreamsHarness> {
  const dataDir = await Deno.makeTempDir({ prefix: 'chat-producer-fencing-' });
  const upstream = createStreamsServer({ port: 0, host: '127.0.0.1', dataDir });
  const internalPort = Number(new URL(await upstream.start()).port);
  const proxy = createStreamsProxyHandler({ internalPort });
  const appends: RecordedAppend[] = [];

  const app = new Hono();
  app.all('/*', async (c) => {
    const raw = c.req.raw;
    const body = raw.method === 'POST' ? await raw.clone().text() : '';
    const response = await proxy(c);
    if (raw.method === 'POST') {
      appends.push({
        path: new URL(raw.url).pathname,
        status: response.status,
        producerId: raw.headers.get('Producer-Id'),
        epoch: raw.headers.get('Producer-Epoch'),
        seq: raw.headers.get('Producer-Seq'),
        items: parseItems(body),
      });
    }
    return response;
  });
  const front = Deno.serve({ port: 0, hostname: '127.0.0.1', onListen: () => {} }, app.fetch);
  const baseUrl = `http://127.0.0.1:${front.addr.port}`;

  return {
    baseUrl,
    appends,
    async read(path: string): Promise<string> {
      const response = await fetch(`${baseUrl}${path}?offset=-1`);
      assertEquals(response.status, 200);
      return await response.text();
    },
    async [Symbol.asyncDispose](): Promise<void> {
      await front.shutdown();
      await upstream.stop();
      await Deno.remove(dataDir, { recursive: true });
    },
  };
}

function parseItems(body: string): Record<string, unknown>[] {
  if (body.length === 0) return [];
  const parsed: unknown = JSON.parse(body);
  return (Array.isArray(parsed) ? parsed : [parsed]) as Record<string, unknown>[];
}

const USER_TURN: NetScriptChatMessage = { id: 'user-1', role: 'user', content: 'Hello' };

function assistantChunks(messageId: string, text: string): Record<string, unknown>[] {
  return [
    { type: 'TEXT_MESSAGE_START', messageId, role: 'assistant' },
    { type: 'TEXT_MESSAGE_CONTENT', messageId, delta: text, content: text },
    { type: 'TEXT_MESSAGE_END', messageId },
  ];
}

/** Yields synchronously, so one turn's chunks land in one producer batch. */
async function* sourceOf(chunks: readonly unknown[]): AsyncIterable<unknown> {
  for (const chunk of chunks) yield chunk;
}

function target(harness: StreamsHarness, sessionId: string) {
  return { sessionId, baseUrl: harness.baseUrl };
}

function sessionPath(harness: StreamsHarness, sessionId: string): string {
  return new URL(resolveChatSessionUrl(target(harness, sessionId))).pathname;
}

Deno.test('fenced chat: a stale epoch is rejected with a typed error and appends nothing', async () => {
  await using streams = await startStreamsService();
  const path = sessionPath(streams, 'stale');
  const id = 'chat-turn:stale:t1';

  // The newer claim (epoch 2) writes first.
  await toNetScriptChatResponse({
    target: target(streams, 'stale'),
    newMessages: [USER_TURN],
    source: sourceOf(assistantChunks('a-new', 'from epoch 2')),
    mode: 'await',
    producer: { id, epoch: 2 },
  });
  const before = await streams.read(path);
  const appendsBefore = streams.appends.length;

  // The zombie (epoch 1) is rejected while echoing, before the source is touched.
  let zombieSourceStarted = false;
  const error = await assertRejects(
    () =>
      toNetScriptChatResponse({
        target: target(streams, 'stale'),
        newMessages: [{ id: 'user-zombie', role: 'user', content: 'late' }],
        source: (async function* () {
          zombieSourceStarted = true;
          yield* sourceOf(assistantChunks('a-zombie', 'from epoch 1'));
        })(),
        mode: 'await',
        producer: { id, epoch: 1 },
      }),
    NetScriptChatProducerError,
  );
  assertEquals(error.kind, 'stale-epoch');
  assertEquals(error.producerId, id);
  assertEquals(error.epoch, 1);
  assertEquals(error.currentEpoch, 2);
  assertEquals(zombieSourceStarted, false);

  // A zombie with no echo is rejected on its assistant chunks instead.
  const assistantError = await assertRejects(
    () =>
      toNetScriptChatResponse({
        target: target(streams, 'stale'),
        source: sourceOf(assistantChunks('a-zombie-2', 'still epoch 1')),
        mode: 'await',
        producer: { id, epoch: 1 },
      }),
    NetScriptChatProducerError,
    'is stale; a newer writer holds epoch 2',
  );
  assertEquals([assistantError.kind, assistantError.currentEpoch], ['stale-epoch', 2]);

  assertEquals(await streams.read(path), before, 'no zombie chunk may be stored');
  const zombieAppends = streams.appends.slice(appendsBefore);
  assert(zombieAppends.length > 0);
  for (const append of zombieAppends) {
    assertEquals(append.status, 403);
    // autoClaim is never enabled implicitly: the zombie never retries with a newer epoch.
    assertEquals(append.epoch, '1');
  }
});

Deno.test('fenced chat: replaying the same (id, epoch, seq) is deduplicated', async () => {
  await using streams = await startStreamsService();
  const path = sessionPath(streams, 'dedup');
  const turn = () =>
    toNetScriptChatResponse({
      target: target(streams, 'dedup'),
      newMessages: [USER_TURN],
      source: sourceOf(assistantChunks('a-1', 'once')),
      mode: 'await',
      producer: { id: 'chat-turn:dedup:t1', epoch: 0 },
    });

  await turn();
  const first = await streams.read(path);
  const firstAppends = streams.appends.length;
  await turn();

  assertEquals(await streams.read(path), first);
  const replay = streams.appends.slice(firstAppends);
  assertEquals(replay.map((append) => [append.seq, append.status]), [['0', 204], ['1', 204]]);
});

Deno.test('fenced chat: the echo and the assistant chunks share one producer sequence', async () => {
  await using streams = await startStreamsService();
  await toNetScriptChatResponse({
    target: target(streams, 'shared'),
    newMessages: [USER_TURN],
    source: sourceOf(assistantChunks('a-1', 'shared')),
    mode: 'await',
    producer: { id: 'chat-turn:shared:t1', epoch: 7 },
  });

  const appends = streams.appends;
  assertEquals(
    appends.map((append) => [append.producerId, append.epoch, append.seq, append.status]),
    [['chat-turn:shared:t1', '7', '0', 200], ['chat-turn:shared:t1', '7', '1', 200]],
  );
  assertEquals(appends[0].items.map((item) => [item.type, item.model]), [
    ['TEXT_MESSAGE_START', 'client'],
    ['TEXT_MESSAGE_CONTENT', 'client'],
    ['TEXT_MESSAGE_END', 'client'],
  ]);
  assertEquals(appends[1].items.map((item) => item.type), [
    'TEXT_MESSAGE_START',
    'TEXT_MESSAGE_CONTENT',
    'TEXT_MESSAGE_END',
  ]);
  // Sanitized exactly like the unfenced path: stored content deltas drop `content`.
  assertEquals('content' in appends[1].items[1], false);
});

Deno.test('unfenced chat: omitting producer is byte-identical to the upstream transport', async () => {
  await using streams = await startStreamsService();
  const realNow = Date.now;
  Date.now = () => 1_760_000_000_000;
  try {
    await toNetScriptChatResponse({
      target: target(streams, 'netscript'),
      newMessages: [USER_TURN],
      source: sourceOf(assistantChunks('a-1', 'same bytes')),
      mode: 'await',
    });
    await toDurableChatSessionResponse({
      stream: {
        writeUrl: resolveChatSessionUrl(target(streams, 'upstream')),
        headers: { 'accept-encoding': 'identity' },
        createIfMissing: true,
      },
      newMessages: [{ id: 'user-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
      responseStream: sourceOf(assistantChunks('a-1', 'same bytes')),
      mode: 'await',
    });
  } finally {
    Date.now = realNow;
  }

  assertEquals(
    await streams.read(sessionPath(streams, 'netscript')),
    await streams.read(sessionPath(streams, 'upstream')),
  );
  for (const append of streams.appends) {
    assertEquals([append.producerId, append.epoch, append.seq], [null, null, null]);
  }
});

Deno.test('fenced chat: a malformed producer is rejected before any request', async () => {
  await using streams = await startStreamsService();
  for (const producer of [{ id: ' ', epoch: 0 }, { id: 'p', epoch: -1 }, { id: 'p', epoch: 1.5 }]) {
    const error = await assertRejects(() =>
      toNetScriptChatResponse({
        target: target(streams, 'invalid'),
        source: sourceOf([]),
        producer,
      })
    );
    assertInstanceOf(error, TypeError);
  }
  assertEquals(streams.appends.length, 0);
});

Deno.test('fenced chat: a fenced writer stops consuming its source', async () => {
  await using streams = await startStreamsService();
  const id = 'chat-turn:stop:t1';
  await toNetScriptChatResponse({
    target: target(streams, 'stop'),
    source: sourceOf(assistantChunks('a-new', 'epoch 1')),
    mode: 'await',
    producer: { id, epoch: 1 },
  });

  const total = 200;
  let consumed = 0;
  await assertRejects(
    () =>
      toNetScriptChatResponse({
        target: target(streams, 'stop'),
        source: (async function* () {
          for (; consumed < total; consumed += 1) {
            yield { type: 'TEXT_MESSAGE_CONTENT', messageId: 'a-zombie', delta: `${consumed}` };
            await new Promise((resolve) => setTimeout(resolve, 2));
          }
        })(),
        mode: 'await',
        producer: { id, epoch: 0 },
      }),
    NetScriptChatProducerError,
  );
  assert(consumed < total, `source drained ${consumed}/${total} chunks after the fence`);
});
