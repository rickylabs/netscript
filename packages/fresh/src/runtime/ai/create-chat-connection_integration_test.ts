import {
  nativeActivityMessage,
  nativeModelMessage,
  nativeUiMessage,
} from '../../../tests/type-fixtures/chat-send-consumer_type.ts';
import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { materializeSnapshotFromDurableStream } from '@durable-streams/tanstack-ai-transport';
import {
  createNetScriptChatConnection,
  type NetScriptChatMessage,
  type NetScriptChatSendMessage,
  projectChatSnapshot,
  resolveChatSnapshot,
  toNetScriptChatResponse,
} from './create-chat-connection.ts';
import { createChatMessageReplay } from '../../internal/chat-message-replay.ts';

type DurableEntry = unknown;

class FakeDurableChatStream {
  readonly #entries: DurableEntry[] = [];
  readonly #waiters = new Set<() => void>();

  append(...entries: DurableEntry[]): void {
    this.#entries.push(...structuredClone(entries));
    for (const wake of this.#waiters) wake();
    this.#waiters.clear();
  }

  snapshot() {
    return Promise.resolve({
      messages: structuredClone(this.#entries),
      offset: String(this.#entries.length),
    });
  }

  connection(initialOffset?: string) {
    const entries = this.#entries;
    const waiters = this.#waiters;
    const append = this.append.bind(this);
    return {
      subscribe(signal?: AbortSignal): AsyncIterable<unknown> {
        let cursor = Number(initialOffset ?? '0');
        return (async function* () {
          while (!signal?.aborted) {
            const entry = entries[cursor];
            if (entry !== undefined) {
              cursor += 1;
              yield structuredClone(entry);
              continue;
            }
            await new Promise<void>((resolve) => {
              const wake = () => {
                signal?.removeEventListener('abort', wake);
                waiters.delete(wake);
                resolve();
              };
              waiters.add(wake);
              signal?.addEventListener('abort', wake, { once: true });
            });
          }
        })();
      },
      send(messages: readonly unknown[]): Promise<void> {
        append(...messages as DurableEntry[]);
        return Promise.resolve();
      },
    };
  }
}

const TARGET = { sessionId: 'durable-session', baseUrl: 'http://streams.test' } as const;

Deno.test('untyped UI messages without IDs persist and replay exactly once with stable IDs', async () => {
  const chunks: unknown[] = [];
  const server = Deno.serve({ port: 0, onListen() {} }, async (request) => {
    if (request.method === 'PUT') return new Response(null, { status: 201 });
    if (request.method === 'POST') {
      const body: unknown = await request.json();
      chunks.push(...(Array.isArray(body) ? body : [body]));
      return new Response(null, { status: 204 });
    }
    return Response.json(chunks, {
      headers: { 'Stream-Next-Offset': String(chunks.length), 'Stream-Up-To-Date': 'true' },
    });
  });
  const target = { sessionId: 'missing-ui-ids', baseUrl: `http://127.0.0.1:${server.addr.port}` };
  // JSON is the actual untyped runtime boundary; the public UI type requires an ID.
  const messages: readonly NetScriptChatSendMessage[] = await new Request('https://app.test', {
    method: 'POST',
    body: JSON.stringify([
      { role: 'user', parts: [{ type: 'text', text: 'First prompt' }] },
      { role: 'user', parts: [{ type: 'text', text: 'Second prompt' }] },
    ]),
  }).json();
  try {
    await toNetScriptChatResponse({
      target,
      newMessages: messages,
      source: (async function* () {})(),
      mode: 'await',
    });
    const seed = await resolveChatSnapshot({ target });
    const reload = await resolveChatSnapshot({ target });
    assertEquals(seed.messages.map((message) => message.content), [
      'First prompt',
      'Second prompt',
    ]);
    assert(seed.messages.every((message) => message.id.length > 0));
    assertEquals(new Set(seed.messages.map((message) => message.id)).size, 2);
    assertEquals(reload, seed);
    assertEquals(messages.map((message) => message.id), [undefined, undefined]);
  } finally {
    await server.shutdown();
  }
});

Deno.test('native batch public-reader and seed/live limits are explicitly documented', async () => {
  const chunks: unknown[] = [];
  const server = Deno.serve({ port: 0, onListen() {} }, async (request) => {
    if (request.method === 'PUT') return new Response(null, { status: 201 });
    if (request.method === 'POST') {
      const body: unknown = await request.json();
      chunks.push(...(Array.isArray(body) ? body : [body]));
      return new Response(null, { status: 204 });
    }
    return Response.json(chunks, {
      headers: { 'Stream-Next-Offset': String(chunks.length), 'Stream-Up-To-Date': 'true' },
    });
  });
  const target = {
    sessionId: 'native-reader-limits',
    baseUrl: `http://127.0.0.1:${server.addr.port}`,
  };
  try {
    await toNetScriptChatResponse({
      target,
      newMessages: [nativeUiMessage],
      source: (async function* () {})(),
      mode: 'await',
    });
    const seed = await resolveChatSnapshot({ target });
    const upstream = await materializeSnapshotFromDurableStream({
      readUrl: `${target.baseUrl}/v1/stream/netscript/ai/chat/${target.sessionId}`,
    });
    const liveBootstrap = projectChatSnapshot(upstream.messages);
    assert(seed.renderParts.some((part) => part.kind === 'tool'));
    assertEquals(liveBootstrap.renderParts.some((part) => part.kind === 'tool'), false);
    assertEquals(seed.messages.map((message) => Object.keys(message)), [['id', 'role', 'content']]);
    for (const file of ['README.md', '../../../../../docs/site/ai/durable-chat.md']) {
      const docs = await Deno.readTextFile(new URL(file, import.meta.url));
      assertStringIncludes(docs, 'No public API returns persisted native parts.');
      assertStringIncludes(
        docs,
        'Native batch tool cards appear on seed/reload but not on live subscribers.',
      );
    }
  } finally {
    await server.shutdown();
  }
});

Deno.test('native newMessages survive default persistence and seed reload without replacing history', async () => {
  const chunks: unknown[] = [];
  const methods: string[] = [];
  const server = Deno.serve({ port: 0, onListen() {} }, async (request) => {
    methods.push(request.method);
    if (request.method === 'POST') {
      const body: unknown = await request.json();
      chunks.push(...(Array.isArray(body) ? body : [body]));
      return new Response(null, {
        status: 204,
        headers: { 'Stream-Next-Offset': String(chunks.length) },
      });
    }
    if (request.method === 'PUT') return new Response(null, { status: 201 });
    return Response.json(chunks, {
      headers: { 'Stream-Next-Offset': String(chunks.length), 'Stream-Up-To-Date': 'true' },
    });
  });
  const target = {
    sessionId: 'native-persistence',
    baseUrl: `http://127.0.0.1:${server.addr.port}`,
  };
  const legacy = { id: 'legacy', role: 'user' as const, content: 'Existing history —' };
  const messages = [
    { ...nativeUiMessage, futureField: { retained: true } },
    nativeModelMessage,
    nativeActivityMessage,
    { id: 'future', role: 'user' as const, parts: [{ type: 'future-attachment', opaque: true }] },
    { id: 'null-model', role: 'tool' as const, content: null, toolCallId: 'null-call' },
    { role: 'user' as const, content: 'Model without an id' },
  ];
  const expected = JSON.parse(JSON.stringify(messages));
  try {
    const immediate = await toNetScriptChatResponse({
      target,
      newMessages: [legacy],
      source: (async function* () {})(),
    });
    assertEquals(immediate.status, 202);
    assert(chunks.length > 0, 'client messages must persist before an immediate response returns');
    await toNetScriptChatResponse({
      target,
      newMessages: messages,
      source: (async function* () {
        yield { type: 'TEXT_MESSAGE_START', messageId: 'reply', role: 'assistant' };
        yield { type: 'TEXT_MESSAGE_CONTENT', messageId: 'reply', delta: 'Retained reply…' };
        yield { type: 'TEXT_MESSAGE_END', messageId: 'reply' };
      })(),
      mode: 'await',
    });
    // A fresh replay reads serialized durable bytes, not the objects passed to send.
    const replay = createChatMessageReplay();
    const persisted: unknown[] =
      await (await fetch(`${target.baseUrl}/v1/stream/netscript/ai/chat/${target.sessionId}`))
        .json();
    for (const chunk of persisted) replay.apply(chunk);
    const reloaded = replay.messages() as Record<string, unknown>[];
    assertEquals(reloaded[1]?.parts, expected[0].parts);
    assertEquals(reloaded[0], { ...legacy, parts: [{ type: 'text', text: legacy.content }] });
    for (const [index, message] of expected.entries()) {
      const actual = reloaded[index + 1];
      for (const [key, value] of Object.entries(message)) assertEquals(actual[key], value);
    }
    assert(typeof reloaded[6].id === 'string' && reloaded[6].id.length > 0);
    assertEquals(reloaded.at(-1)?.id, 'reply');
    const seed = await resolveChatSnapshot({ target });
    const reload = await resolveChatSnapshot({ target });
    assertEquals(reload, seed);
    assertEquals(seed.messages[0].content, legacy.content);
    assertEquals(seed.messages.at(-1)?.content, 'Retained reply…');
    assert(seed.renderParts.some((part) => part.kind === 'tool' && part.toolName === 'inspect'));
    assertEquals(seed.offset, String(chunks.length));
    assertEquals(methods.filter((method) => method === 'PUT').length, 2);
    assertEquals(methods.filter((method) => method === 'GET').length, 3);
    // Serialization and replay must not mutate the caller's parts or metadata.
    assertEquals(JSON.parse(JSON.stringify(messages)), expected);
  } finally {
    await server.shutdown();
  }
});

function nextValue<T>(iterator: AsyncIterator<T>): Promise<T> {
  return iterator.next().then((result) => {
    if (result.done) throw new Error('subscription ended before the expected durable entry');
    return result.value;
  });
}

Deno.test('durable chat lifecycle provides seed, optimism, live tokens, reload resume, multi-tab convergence, and multibyte fidelity', async () => {
  const durable = new FakeDurableChatStream();
  durable.append({ id: 'seed', role: 'assistant', content: 'Ready — déjà vu…' });

  const seed = await resolveChatSnapshot({
    target: TARGET,
    materialize: () => durable.snapshot(),
  });
  assertEquals(seed.messages, [
    { id: 'seed', role: 'assistant', content: 'Ready — déjà vu…' },
  ]);
  assertEquals(seed.offset, '1');

  const makeTab = (initialOffset: string) =>
    createNetScriptChatConnection({
      target: TARGET,
      initialOffset,
      createConnection: ({ initialOffset }) => durable.connection(initialOffset),
    });

  const tabA = makeTab(seed.offset!);
  const tabB = makeTab(seed.offset!);
  const abortA = new AbortController();
  const abortB = new AbortController();
  const iteratorA = tabA.subscribe(abortA.signal)[Symbol.asyncIterator]();
  const iteratorB = tabB.subscribe(abortB.signal)[Symbol.asyncIterator]();

  const userTurn: NetScriptChatMessage = {
    id: 'user-1',
    role: 'user',
    content: 'Explain naïve UTF-8 — briefly…',
  };
  const optimisticA = [...seed.messages, userTurn];
  const pendingA = nextValue(iteratorA);
  const pendingB = nextValue(iteratorB);
  const send = tabA.send([userTurn]);

  // TanStack AI owns the optimistic reducer: local state includes the turn
  // before the adapter's persistence promise needs to settle.
  assertEquals(optimisticA.at(-1), userTurn);
  await send;
  const durableUserTurn = userTurn;
  assertEquals(await pendingA, durableUserTurn);
  assertEquals(await pendingB, durableUserTurn);

  const token1: NetScriptChatMessage = {
    id: 'assistant-token-1',
    role: 'assistant',
    content: 'It preserves —',
  };
  const token2: NetScriptChatMessage = {
    id: 'assistant-token-2',
    role: 'assistant',
    content: ' multibyte ellipses…',
  };
  const token1A = nextValue(iteratorA);
  const token1B = nextValue(iteratorB);
  durable.append(token1);
  assertEquals(await token1A, token1);
  assertEquals(await token1B, token1);

  // Reload materializes everything through the SSR path, then resumes strictly
  // after its cursor rather than replaying already-rendered entries.
  const reloaded = await resolveChatSnapshot({
    target: TARGET,
    materialize: () => durable.snapshot(),
  });
  assertEquals(reloaded.offset, '3');
  assertEquals(reloaded.messages.map((message) => message.content), [
    'Ready — déjà vu…',
    'Explain naïve UTF-8 — briefly…',
    'It preserves —',
  ]);

  const reloadTab = makeTab(reloaded.offset!);
  const abortReload = new AbortController();
  const reloadIterator = reloadTab.subscribe(abortReload.signal)[Symbol.asyncIterator]();
  const token2A = nextValue(iteratorA);
  const token2B = nextValue(iteratorB);
  const token2Reload = nextValue(reloadIterator);
  durable.append(token2);
  assertEquals(await token2A, token2);
  assertEquals(await token2B, token2);
  assertEquals(await token2Reload, token2);

  const finalSnapshot = await resolveChatSnapshot({
    target: TARGET,
    materialize: () => durable.snapshot(),
  });
  assertEquals(
    finalSnapshot.messages.map((message) => message.content).join(''),
    'Ready — déjà vu…Explain naïve UTF-8 — briefly…It preserves — multibyte ellipses…',
  );

  abortA.abort();
  abortB.abort();
  abortReload.abort();
  tabA.dispose();
  tabB.dispose();
  reloadTab.dispose();
});

async function withinNative<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Native chat fixture did not settle.')), 4000);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
async function waitForNative(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 4000;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error('Native chat fixture condition did not settle.');
    await new Promise<void>((resolve) => setTimeout(resolve, 1));
  }
}

Deno.test('default native chat transport retains rich POST bodies and one live SSE with send aborts', async () => {
  const posts: unknown[] = [];
  let bootstrapRequests = 0;
  let liveRequests = 0;
  let activeLive = 0;
  let maxActiveLive = 0;
  let cancelledLive = 0;
  let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
  let ended = false;
  let holdNext = false;
  let postEntered = Promise.withResolvers<void>();
  let releasePost = Promise.withResolvers<void>();
  const releases: (() => void)[] = [releasePost.resolve];
  const liveReady = Promise.withResolvers<void>();
  const encoder = new TextEncoder();
  const server = Deno.serve({ port: 0, onListen() {} }, async (request) => {
    if (request.method === 'POST') {
      posts.push(await request.json());
      postEntered.resolve();
      if (holdNext) await releasePost.promise;
      return new Response(null, { status: 204 });
    }
    const url = new URL(request.url);
    if (url.searchParams.get('live') !== 'sse') {
      bootstrapRequests++;
      return new Response('[]', {
        headers: {
          'content-type': 'application/json',
          'Stream-Next-Offset': '0',
          'Stream-Up-To-Date': 'true',
        },
      });
    }
    liveRequests++;
    activeLive++;
    maxActiveLive = Math.max(maxActiveLive, activeLive);
    return new Response(
      new ReadableStream<Uint8Array>({
        start(streamController) {
          controller = streamController;
          liveReady.resolve();
        },
        cancel() {
          ended = true;
          activeLive--;
          cancelledLive++;
        },
      }),
      { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' } },
    );
  });
  const baseUrl = `http://${server.addr.hostname}:${server.addr.port}`;
  const connection = createNetScriptChatConnection({
    target: { sessionId: 'native-rich-send', baseUrl },
    initialOffset: '0',
  });
  const first = connection.subscribe()[Symbol.asyncIterator]();
  const second = connection.subscribe()[Symbol.asyncIterator]();
  const pendingFirst = first.next();
  const pendingSecond = second.next();
  const messages = [
    { ...nativeUiMessage, futureMessageField: { preserved: true } },
    nativeModelMessage,
    { ...nativeActivityMessage, futureActivityField: { preserved: true } },
    {
      id: 'future-native',
      role: 'user' as const,
      parts: [{ type: 'future-attachment', opaque: { preserved: true } }],
    },
    {
      role: 'tool' as const,
      content: null,
      toolCallId: 'call-null',
      metadata: { preserved: true },
    },
  ];
  const data = { attachments: { labels: ['original', 'opaque'] }, options: { preserved: true } };
  const emit = (value: unknown, offset: string): void => {
    assert(controller);
    controller.enqueue(
      encoder.encode(
        `event: data\ndata: ${JSON.stringify([value])}\n\nevent: control\ndata: ${
          JSON.stringify({ streamNextOffset: offset, upToDate: true })
        }\n\n`,
      ),
    );
  };
  try {
    await withinNative(liveReady.promise);
    const before = {
      type: 'TEXT_MESSAGE_CONTENT',
      messageId: 'live-before',
      delta: 'Before rich send —',
    };
    emit(before, '1');
    assertEquals((await withinNative(pendingFirst)).value, before);
    assertEquals((await withinNative(pendingSecond)).value, before);
    await withinNative(connection.send(messages, data));
    assertEquals(posts[0], JSON.parse(JSON.stringify({ messages, data })));
    assertEquals(bootstrapRequests, 1);
    assertEquals(liveRequests, 1);
    assertEquals(activeLive, 1);
    assertEquals(maxActiveLive, 1);
    const afterFirst = first.next();
    const afterSecond = second.next();
    const after = {
      type: 'TEXT_MESSAGE_CONTENT',
      messageId: 'live-after',
      delta: 'After rich send…',
    };
    emit(after, '2');
    assertEquals((await withinNative(afterFirst)).value, after);
    assertEquals((await withinNative(afterSecond)).value, after);
    holdNext = true;
    postEntered = Promise.withResolvers<void>();
    releasePost = Promise.withResolvers<void>();
    releases.push(releasePost.resolve);
    const caller = new AbortController();
    const callerSend = connection.send(messages, data, caller.signal);
    void callerSend.catch(() => undefined);
    await withinNative(postEntered.promise);
    caller.abort(new DOMException('Caller aborted native POST.', 'AbortError'));
    await assertRejects(
      () => withinNative(callerSend),
      DOMException,
      'Caller aborted native POST.',
    );
    assertEquals(posts[1], JSON.parse(JSON.stringify({ messages, data })));
    releasePost.resolve();
    assertEquals(activeLive, 1);
    assertEquals(liveRequests, 1);
    postEntered = Promise.withResolvers<void>();
    releasePost = Promise.withResolvers<void>();
    releases.push(releasePost.resolve);
    const disposedSend = connection.send(messages, data);
    void disposedSend.catch(() => undefined);
    await withinNative(postEntered.promise);
    const finalFirst = first.next();
    const finalSecond = second.next();
    connection.dispose();
    connection.stop();
    connection.close();
    await assertRejects(() => withinNative(disposedSend), DOMException);
    assertEquals(posts[2], JSON.parse(JSON.stringify({ messages, data })));
    assertEquals((await withinNative(finalFirst)).done, true);
    assertEquals((await withinNative(finalSecond)).done, true);
    await waitForNative(() => activeLive === 0);
    assertEquals(cancelledLive, 1);
    assertEquals(liveRequests, 1);
    assertEquals(maxActiveLive, 1);
    await assertRejects(() => connection.send(messages, data), Error, 'already disposed');
  } finally {
    connection.dispose();
    for (const release of releases) release();
    if (controller && !ended) {
      ended = true;
      controller.close();
    }
    try {
      await withinNative(Promise.allSettled([
        pendingFirst,
        pendingSecond,
        first.return?.(undefined) ?? Promise.resolve({ done: true, value: undefined }),
        second.return?.(undefined) ?? Promise.resolve({ done: true, value: undefined }),
      ]));
    } finally {
      await withinNative(server.shutdown());
    }
  }
});
