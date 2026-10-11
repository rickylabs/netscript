import { assert, assertEquals } from '@std/assert';
import { StreamProcessor } from '@tanstack/ai/client';
import type { StreamChunk } from '@tanstack/ai';
import {
  createNetScriptChatConnection,
  type NetScriptChatConnection,
  type NetScriptChatSendMessage,
  projectChatSnapshot,
  resolveChatSnapshot,
  toNetScriptChatResponse,
} from './mod.ts';
import {
  nativeActivityMessage,
  nativeModelMessage,
  nativeUiMessage,
} from '../../../tests/type-fixtures/chat-send-consumer_type.ts';

async function bounded<T>(promise: Promise<T>): Promise<T> {
  const timeout = AbortSignal.timeout(4000);
  return await Promise.race([
    promise,
    new Promise<never>((_resolve, reject) =>
      timeout.addEventListener('abort', () => reject(timeout.reason), { once: true })
    ),
  ]);
}

async function until(predicate: () => boolean): Promise<void> {
  await bounded((async () => {
    while (!predicate()) await new Promise<void>((resolve) => setTimeout(resolve, 1));
  })());
}

function fixture() {
  const chunks: unknown[] = [];
  const readers = new Set<ReadableStreamDefaultController<Uint8Array>>();
  const encoder = new TextEncoder();
  const stats = { live: 0, maxLive: 0, opens: 0, cancels: 0, offsets: [] as string[] };
  const server = Deno.serve({ port: 0, onListen() {} }, async (request) => {
    if (request.method === 'PUT') return new Response(null, { status: 201 });
    if (request.method === 'POST') {
      const body: unknown = await request.json();
      chunks.push(...(Array.isArray(body) ? body : [body]));
      return new Response(null, { status: 204 });
    }
    const url = new URL(request.url);
    const offset = url.searchParams.get('offset') ?? '0';
    if (url.searchParams.get('live') !== 'sse') {
      return Response.json(chunks.slice(Number(offset)), {
        headers: { 'Stream-Next-Offset': String(chunks.length), 'Stream-Up-To-Date': 'true' },
      });
    }
    stats.offsets.push(offset);
    stats.opens++;
    stats.live++;
    stats.maxLive = Math.max(stats.maxLive, stats.live);
    let reader: ReadableStreamDefaultController<Uint8Array>;
    return new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          reader = controller;
          readers.add(controller);
        },
        cancel() {
          readers.delete(reader);
          stats.live--;
          stats.cancels++;
        },
      }),
      { headers: { 'content-type': 'text/event-stream' } },
    );
  });
  const target = { sessionId: 'native-reader', baseUrl: `http://127.0.0.1:${server.addr.port}` };
  return {
    target,
    stats,
    chunks,
    async persist(messages: readonly NetScriptChatSendMessage[]) {
      await toNetScriptChatResponse({
        target,
        newMessages: messages,
        source: (async function* () {})(),
        mode: 'await',
      });
    },
    emit(items: readonly unknown[]) {
      chunks.push(...items);
      const event = encoder.encode(
        `event: data\ndata: ${JSON.stringify(items)}\n\nevent: control\ndata: ${
          JSON.stringify({ streamNextOffset: String(chunks.length), upToDate: true })
        }\n\n`,
      );
      for (const reader of readers) reader.enqueue(event);
    },
    async close(connection: NetScriptChatConnection) {
      connection.dispose();
      await until(() => stats.live === 0);
      await bounded(server.shutdown());
    },
  };
}

function snapshotMessages(chunk: unknown): readonly NetScriptChatSendMessage[] | undefined {
  if (!chunk || typeof chunk !== 'object' || !('type' in chunk)) return undefined;
  if (chunk.type !== 'MESSAGES_SNAPSHOT' || !('messages' in chunk)) return undefined;
  return chunk.messages as readonly NetScriptChatSendMessage[];
}

Deno.test('native reader exposes stored parts and replays cold bootstrap through the public connection', async () => {
  const stream = fixture();
  const messages = [nativeUiMessage, nativeModelMessage, nativeActivityMessage, {
    id: 'future',
    role: 'user' as const,
    metadata: { opaque: true },
    parts: [{ type: 'data-app', data: { nested: ['original'] } }, { type: 'future-attachment' }],
  }];
  const connection = createNetScriptChatConnection({ target: stream.target });
  try {
    await stream.persist(messages);
    const seed = await resolveChatSnapshot({ target: stream.target });
    assertEquals(seed.nativeMessages.length, messages.length);
    for (const [index, expected] of messages.entries()) {
      for (const [key, value] of Object.entries(JSON.parse(JSON.stringify(expected)))) {
        assertEquals((seed.nativeMessages[index] as Record<string, unknown>)[key], value);
      }
    }
    const processor = new StreamProcessor();
    let native: readonly NetScriptChatSendMessage[] | undefined;
    await bounded((async () => {
      for await (const chunk of connection.subscribe()) {
        processor.processChunk(chunk as StreamChunk);
        native = snapshotMessages(chunk);
        if (native) break;
      }
    })());
    assertEquals(native, seed.nativeMessages);
    assertEquals(projectChatSnapshot(native!), {
      messages: seed.messages,
      renderParts: seed.renderParts,
    });
    // Exercise the actual TanStack consumer reducer, including opaque future parts.
    assertEquals<unknown>(
      processor.getMessages().find((message) => message.id === 'future'),
      messages[3],
    );
    assertEquals(
      processor.getMessages().find((message) => message.id === nativeUiMessage.id)?.parts,
      nativeUiMessage.parts,
    );
    assertEquals(await resolveChatSnapshot({ target: stream.target }), seed);
  } finally {
    await stream.close(connection);
  }
});

Deno.test('native seed handoff deduplicates echoes and appends with one SSE and independent reader cancellation', async () => {
  const stream = fixture();
  await stream.persist([nativeUiMessage]);
  const seed = await resolveChatSnapshot({ target: stream.target });
  const originalSeed = structuredClone(seed);
  const connection = createNetScriptChatConnection({
    target: stream.target,
    initialOffset: seed.offset!,
    initialMessages: seed.nativeMessages,
  });
  const abortFirst = new AbortController();
  const abortSecond = new AbortController();
  const first = connection.subscribe(abortFirst.signal)[Symbol.asyncIterator]();
  const second = connection.subscribe(abortSecond.signal)[Symbol.asyncIterator]();
  let nextFirst = first.next();
  let nextSecond = second.next();
  const appended = {
    id: 'second',
    role: 'assistant' as const,
    parts: [{ type: 'data-app', data: { result: 42 } }, {
      type: 'tool-call',
      id: 'call-live',
      name: 'inspect',
      state: 'complete',
      arguments: '{}',
      output: { retained: true },
    }],
  };
  const append = { type: 'CUSTOM', name: 'netscript.chat.messages', value: [appended] };
  try {
    await until(() => stream.stats.live === 1);
    assertEquals(stream.stats.offsets, [seed.offset]);
    stream.emit([append]);
    const firstSnapshot = (await bounded(nextFirst)).value;
    assert(snapshotMessages(firstSnapshot), 'native live appends must emit a standard snapshot');
    assertEquals((await bounded(nextSecond)).value, firstSnapshot);
    assertEquals(snapshotMessages(firstSnapshot), [...seed.nativeMessages, appended]);
    const liveProcessor = new StreamProcessor({
      initialMessages: seed.nativeMessages as Parameters<StreamProcessor['setMessages']>[0],
    });
    liveProcessor.processChunk(firstSnapshot as StreamChunk);
    assertEquals<unknown>(
      liveProcessor.getMessages().find((message) => message.id === 'second')?.parts,
      appended.parts,
    );
    assertEquals(projectChatSnapshot(snapshotMessages(firstSnapshot)!).messages.length, 2);
    // Duplicate native append IDs replace rather than multiply messages.
    nextFirst = first.next();
    nextSecond = second.next();
    stream.emit([append]);
    assertEquals(snapshotMessages((await bounded(nextFirst)).value), [
      ...seed.nativeMessages,
      appended,
    ]);
    await bounded(nextSecond);
    // Standard assistant chunks remain native and are incorporated before the next append.
    for (
      const chunk of [
        { type: 'TEXT_MESSAGE_START', messageId: 'reply', role: 'assistant' },
        { type: 'TEXT_MESSAGE_CONTENT', messageId: 'reply', delta: 'Live — naïve…' },
        { type: 'TEXT_MESSAGE_END', messageId: 'reply' },
      ]
    ) {
      nextFirst = first.next();
      nextSecond = second.next();
      stream.emit([chunk]);
      assertEquals((await bounded(nextFirst)).value, chunk);
      assertEquals((await bounded(nextSecond)).value, chunk);
    }
    nextFirst = first.next();
    nextSecond = second.next();
    abortFirst.abort();
    assertEquals((await bounded(nextFirst)).done, true);
    assertEquals(stream.stats.live, 1);
    stream.emit([append]);
    const final = snapshotMessages((await bounded(nextSecond)).value)!;
    assertEquals(final.map((message) => message.id), [nativeUiMessage.id, 'second', 'reply']);
    assertEquals(projectChatSnapshot(final).messages.at(-1)?.content, 'Live — naïve…');
    assertEquals(seed, originalSeed, 'live replay must not mutate the SSR seed');
    nextSecond = second.next();
    abortSecond.abort();
    assertEquals((await bounded(nextSecond)).done, true);
    await until(() => stream.stats.live === 0);
    assertEquals(stream.stats.cancels, 1);
    const third = connection.subscribe()[Symbol.asyncIterator]();
    const pendingThird = third.next();
    await until(() => stream.stats.live === 1);
    assertEquals(stream.stats.offsets.at(-1), String(stream.chunks.length));
    stream.emit([append]);
    assertEquals(snapshotMessages((await bounded(pendingThird)).value), final);
    const stopped = third.next();
    connection.dispose();
    connection.close();
    connection.stop();
    assertEquals((await bounded(stopped)).done, true);
    await until(() => stream.stats.live === 0);
    assertEquals(stream.stats.cancels, 2);
    assertEquals(stream.stats.maxLive, 1);
  } finally {
    await stream.close(connection);
  }
});
