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
import { toDurableChatSessionResponse } from '../../../../packages/fresh/tests/_fixtures/durable-chat-transport.ts';
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

/** Yields synchronously, so without per-chunk batches a turn's chunks would share one batch. */
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

/** A five-chunk assistant turn: enough chunks for source timing to matter. */
const REPLAY_CHUNKS = [
  { type: 'TEXT_MESSAGE_START', messageId: 'a-1', role: 'assistant' },
  { type: 'TEXT_MESSAGE_CONTENT', messageId: 'a-1', delta: 'one ' },
  { type: 'TEXT_MESSAGE_CONTENT', messageId: 'a-1', delta: 'two ' },
  { type: 'TEXT_MESSAGE_CONTENT', messageId: 'a-1', delta: 'three' },
  { type: 'TEXT_MESSAGE_END', messageId: 'a-1' },
];
const ECHO_CHUNK_COUNT = 3;

/** Yields each chunk after `delayMs`, so no two chunks share a producer linger window. */
async function* paced(chunks: readonly unknown[], delayMs: number): AsyncIterable<unknown> {
  for (const chunk of chunks) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    yield chunk;
  }
}

/** An executor that loses its lease after `count` chunks. */
async function* interruptedAfter(
  chunks: readonly unknown[],
  count: number,
): AsyncIterable<unknown> {
  yield* sourceOf(chunks.slice(0, count));
  throw new Error('executor lost its lease');
}

type ReplaySource = () => AsyncIterable<unknown>;

/**
 * Writes the turn under one `(id, epoch)` from `first`, replays it from `second`, and returns
 * the session bytes, the bytes of the same turn written once cleanly, and the replay's acks.
 */
async function replayTurn(first: ReplaySource, second: ReplaySource) {
  await using streams = await startStreamsService();
  const realNow = Date.now;
  Date.now = () => 1_760_000_000_000; // echo chunks carry a timestamp
  try {
    const turn = (sessionId: string, source: AsyncIterable<unknown>) =>
      toNetScriptChatResponse({
        target: target(streams, sessionId),
        newMessages: [USER_TURN],
        source,
        mode: 'await',
        producer: { id: 'chat-turn:replay:t1', epoch: 0 },
      });
    await turn('clean', sourceOf(REPLAY_CHUNKS));
    const firstError = await turn('replayed', first()).then(() => undefined, (error) => error);
    const replayFrom = streams.appends.length;
    await turn('replayed', second());
    return {
      firstError,
      replayed: await streams.read(sessionPath(streams, 'replayed')),
      clean: await streams.read(sessionPath(streams, 'clean')),
      acks: streams.appends.slice(replayFrom).map((append) => [append.seq, append.status]),
    };
  } finally {
    Date.now = realNow;
  }
}

/** The replay's acknowledgements: `duplicates` chunks already stored (204), the rest appended (200). */
function expectedAcks(duplicates: number): (string | number)[][] {
  const total = ECHO_CHUNK_COUNT + REPLAY_CHUNKS.length;
  return Array.from({ length: total }, (_, seq) => [String(seq), seq < duplicates ? 204 : 200]);
}

Deno.test('fenced chat: a replay under the same (id, epoch) is deduplicated chunk for chunk', async () => {
  const result = await replayTurn(() => sourceOf(REPLAY_CHUNKS), () => sourceOf(REPLAY_CHUNKS));
  assertEquals(result.replayed, result.clean);
  assertEquals(result.acks, expectedAcks(ECHO_CHUNK_COUNT + REPLAY_CHUNKS.length));
});

Deno.test('fenced chat: a slow replay of a fast turn stores nothing twice', async () => {
  const result = await replayTurn(() => sourceOf(REPLAY_CHUNKS), () => paced(REPLAY_CHUNKS, 50));
  assertEquals(result.replayed, result.clean);
  assertEquals(result.acks, expectedAcks(ECHO_CHUNK_COUNT + REPLAY_CHUNKS.length));
});

Deno.test('fenced chat: a fast replay of a slow turn stores nothing twice', async () => {
  const result = await replayTurn(() => paced(REPLAY_CHUNKS, 50), () => sourceOf(REPLAY_CHUNKS));
  assertEquals(result.replayed, result.clean);
  assertEquals(result.acks, expectedAcks(ECHO_CHUNK_COUNT + REPLAY_CHUNKS.length));
});

Deno.test('fenced chat: replaying an interrupted turn appends exactly the missing chunks', async () => {
  const result = await replayTurn(
    () => interruptedAfter(REPLAY_CHUNKS, 2),
    () => paced(REPLAY_CHUNKS, 20),
  );
  assertInstanceOf(result.firstError, Error);
  assertEquals(result.firstError.message, 'executor lost its lease');
  assertEquals(result.replayed, result.clean);
  assertEquals(result.acks, expectedAcks(ECHO_CHUNK_COUNT + 2));
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

  // One chunk per producer batch: seq is the chunk index across echo then assistant.
  const appends = streams.appends;
  assertEquals(
    appends.map((append) => [append.producerId, append.epoch, append.seq, append.status]),
    ['0', '1', '2', '3', '4', '5'].map((seq) => ['chat-turn:shared:t1', '7', seq, 200]),
  );
  assertEquals(
    appends.map((append) => [append.items.length, append.items[0].type, append.items[0].model]),
    [
      [1, 'TEXT_MESSAGE_START', 'client'],
      [1, 'TEXT_MESSAGE_CONTENT', 'client'],
      [1, 'TEXT_MESSAGE_END', 'client'],
      [1, 'TEXT_MESSAGE_START', undefined],
      [1, 'TEXT_MESSAGE_CONTENT', undefined],
      [1, 'TEXT_MESSAGE_END', undefined],
    ],
  );
  // Sanitized exactly like the unfenced path: stored content deltas drop `content`.
  assertEquals('content' in appends[4].items[0], false);
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
