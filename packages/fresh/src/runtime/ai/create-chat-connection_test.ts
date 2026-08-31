import {
  assert,
  assertEquals,
  assertRejects,
  assertStrictEquals,
  assertStringIncludes,
} from '@std/assert';
import {
  createNetScriptChatConnection,
  type NetScriptChatMessage,
  projectChatSnapshot,
  resolveChatSnapshot,
  toNetScriptChatResponse,
} from './create-chat-connection.ts';

const baseTarget = { sessionId: 'chat-42', baseUrl: 'https://streams.example.test' } as const;

async function collect(iterable: AsyncIterable<unknown>): Promise<unknown[]> {
  const out: unknown[] = [];
  for await (const item of iterable) out.push(item);
  return out;
}

async function collectWithTerminal(iterable: AsyncIterable<unknown>): Promise<{
  readonly values: unknown[];
  readonly terminal: IteratorResult<unknown>;
}> {
  const values: unknown[] = [];
  const iterator = iterable[Symbol.asyncIterator]();
  while (true) {
    const result = await iterator.next();
    if (result.done) return { values, terminal: result };
    values.push(result.value);
  }
}

async function waitFor(predicate: () => boolean, message: string): Promise<void> {
  const deadline = Date.now() + 1_000;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error(message);
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
}

function createHeldSubscriptionProbe(): {
  readonly connection: {
    readonly subscribe: (signal?: AbortSignal) => AsyncIterable<unknown>;
    readonly send: () => Promise<void>;
  };
  readonly stats: {
    subscribeCalls: number;
    openRequests: number;
    maxOpenRequests: number;
    abortedRequests: number;
  };
} {
  const stats = {
    subscribeCalls: 0,
    openRequests: 0,
    maxOpenRequests: 0,
    abortedRequests: 0,
  };

  return {
    stats,
    connection: {
      subscribe(signal) {
        return (async function* () {
          stats.subscribeCalls += 1;
          stats.openRequests += 1;
          stats.maxOpenRequests = Math.max(stats.maxOpenRequests, stats.openRequests);
          try {
            await new Promise<void>((resolve) => {
              if (signal?.aborted) {
                stats.abortedRequests += 1;
                resolve();
                return;
              }
              signal?.addEventListener('abort', () => {
                stats.abortedRequests += 1;
                resolve();
              }, { once: true });
            });
          } finally {
            stats.openRequests -= 1;
          }
          if (!signal?.aborted) yield undefined;
        })();
      },
      send: () => Promise.resolve(),
    },
  };
}

function createEmittingSubscriptionProbe(): {
  readonly connection: {
    readonly subscribe: (signal?: AbortSignal) => AsyncIterable<unknown>;
    readonly send: () => Promise<void>;
  };
  readonly stats: { subscribeCalls: number };
  readonly emit: (...values: readonly unknown[]) => void;
  readonly finish: () => void;
  readonly fail: (error: unknown) => void;
} {
  type Event =
    | { readonly kind: 'value'; readonly value: unknown }
    | { readonly kind: 'done' }
    | { readonly kind: 'error'; readonly error: unknown };
  interface Stream {
    readonly events: Event[];
    wake?: () => void;
  }

  const stats = { subscribeCalls: 0 };
  const streams = new Set<Stream>();
  const publish = (event: Event): void => {
    for (const stream of streams) {
      stream.events.push(event);
      stream.wake?.();
    }
  };

  return {
    stats,
    emit: (...values) => values.forEach((value) => publish({ kind: 'value', value })),
    finish: () => publish({ kind: 'done' }),
    fail: (error) => publish({ kind: 'error', error }),
    connection: {
      subscribe(signal) {
        return (async function* () {
          stats.subscribeCalls += 1;
          const stream: Stream = { events: [] };
          const wake = (): void => stream.wake?.();
          streams.add(stream);
          signal?.addEventListener('abort', wake, { once: true });
          try {
            while (!signal?.aborted) {
              const event = stream.events.shift();
              if (!event) {
                await new Promise<void>((resolve) => {
                  stream.wake = resolve;
                  if (stream.events.length > 0 || signal?.aborted) resolve();
                });
                stream.wake = undefined;
                continue;
              }
              if (event.kind === 'value') {
                yield event.value;
                continue;
              }
              if (event.kind === 'error') throw event.error;
              return;
            }
          } finally {
            signal?.removeEventListener('abort', wake);
            streams.delete(stream);
          }
        })();
      },
      send: () => Promise.resolve(),
    },
  };
}

Deno.test('resolveChatSnapshot wires session URL + auth and reduces via projectChatSnapshot', async () => {
  let capturedUrl: string | undefined;
  let capturedHeaders: Record<string, string> | undefined;

  const snapshot = await resolveChatSnapshot({
    target: { ...baseTarget, headers: { 'X-Trace': 't1' } },
    offset: '10',
    materialize(input) {
      capturedUrl = input.readUrl;
      capturedHeaders = input.headers;
      assertEquals(input.offset, '10');
      return Promise.resolve({
        messages: [
          { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'hello' }] },
          {
            id: 'm2',
            role: 'assistant',
            parts: [
              { type: 'text', text: 'hi' },
              {
                type: 'tool-call',
                toolCallId: 'tc1',
                toolName: 'search',
                state: 'complete',
                input: { q: 'x' },
                output: 42,
              },
            ],
          },
        ],
        offset: '11',
      });
    },
  });

  assertEquals(
    capturedUrl,
    'https://streams.example.test/v1/stream/netscript/ai/chat/chat-42',
  );
  assertEquals(capturedHeaders?.['X-Trace'], 't1');
  assertEquals(snapshot.offset, '11');
  assertEquals(snapshot.messages.length, 2);
  assertEquals(snapshot.messages[1].content, 'hi');

  // ONE-PROJECTION LAW: the seed path must produce the same reduction the live
  // path (projectChatSnapshot) would produce for the same messages.
  const toolPart = snapshot.renderParts.find((p) => p.kind === 'tool');
  assert(toolPart, 'expected a reduced tool card');
  assertEquals(toolPart?.toolName, 'search');
  assertEquals(toolPart?.toolState, 'complete');
});

Deno.test('streamPath override supports per-session durable paths', async () => {
  const target = { sessionId: 'session/a b', baseUrl: 'https://streams.example.test' } as const;
  let connectionReadUrl: string | undefined;
  let responseWriteUrl: string | undefined;
  let snapshotReadUrl: string | undefined;

  const streamPath = ({ sessionId }: { readonly sessionId: string }) =>
    `/eischat/sessions/${encodeURIComponent(sessionId)}/messages`;

  const connection = createNetScriptChatConnection({
    target,
    streamPath,
    createConnection(input) {
      connectionReadUrl = input.readUrl;
      return {
        subscribe: () => (async function* () {})(),
        send: () => Promise.resolve(),
      };
    },
  });
  connection.dispose();

  await toNetScriptChatResponse({
    target,
    streamPath,
    source: (async function* () {})(),
    toResponse(input) {
      responseWriteUrl = input.writeUrl;
      return Promise.resolve(new Response(null, { status: 204 }));
    },
  });

  await resolveChatSnapshot({
    target,
    streamPath,
    materialize(input) {
      snapshotReadUrl = input.readUrl;
      return Promise.resolve({ messages: [] });
    },
  });

  const expected =
    'https://streams.example.test/v1/stream/netscript/eischat/sessions/session%2Fa%20b/messages';
  assertEquals(connectionReadUrl, expected);
  assertEquals(responseWriteUrl, expected);
  assertEquals(snapshotReadUrl, expected);
});

Deno.test('resolveChatSnapshot requests identity encoding for gzip-mislabeled seed reads', async () => {
  const controller = new AbortController();
  let acceptEncoding: string | null = null;
  const server = Deno.serve(
    { port: 0, signal: controller.signal, onListen() {} },
    (request) => {
      acceptEncoding = request.headers.get('accept-encoding');
      return new Response(
        '[{"id":"seed-1","role":"assistant","parts":[{"type":"text","text":"seed ok"}]}]',
        {
          headers: {
            'content-type': 'application/json',
            'content-encoding': 'gzip',
          },
        },
      );
    },
  );

  try {
    const { port } = server.addr as Deno.NetAddr;
    const snapshot = await resolveChatSnapshot({
      target: {
        sessionId: 'eis-ssr',
        baseUrl: `http://127.0.0.1:${port}`,
        headers: { 'Accept-Encoding': 'gzip, br' },
      },
      streamPath: ({ sessionId }) => `/eischat/sessions/${sessionId}/messages`,
      materialize: async (input) => {
        const response = await fetch(new Request(input.readUrl, { headers: input.headers }));
        return {
          messages: await response.json() as readonly unknown[],
          offset: 'seed-offset',
        };
      },
    });

    assertEquals(acceptEncoding, 'identity');
    assertEquals(snapshot.messages[0].content, 'seed ok');
    assertEquals(snapshot.offset, 'seed-offset');
  } finally {
    controller.abort();
    await server.finished.catch(() => undefined);
  }
});

Deno.test('createNetScriptChatConnection requests identity encoding for live gzip-mislabeled reads', async () => {
  const controller = new AbortController();
  let acceptEncoding: string | null = null;
  const server = Deno.serve(
    { port: 0, signal: controller.signal, onListen() {} },
    (request) => {
      acceptEncoding = request.headers.get('accept-encoding');
      return new Response('[{"type":"text","delta":"live ok"}]', {
        headers: {
          'content-type': 'application/json',
          'content-encoding': 'gzip',
        },
      });
    },
  );

  try {
    const { port } = server.addr as Deno.NetAddr;
    const connection = createNetScriptChatConnection({
      target: {
        sessionId: 'eis-live',
        baseUrl: `http://127.0.0.1:${port}`,
        headers: { 'accept-encoding': 'gzip, br' },
      },
      initialOffset: 'seed-offset',
      streamPath: ({ sessionId }) => `/eischat/sessions/${sessionId}/messages`,
      createConnection(input) {
        assertEquals(input.initialOffset, 'seed-offset');
        return {
          subscribe() {
            return (async function* () {
              const response = await fetch(new Request(input.readUrl, { headers: input.headers }));
              const chunks = await response.json() as readonly unknown[];
              for (const chunk of chunks) yield chunk;
            })();
          },
          send() {
            return Promise.resolve();
          },
        };
      },
    });

    const chunks = await collect(connection.subscribe());
    connection.dispose();

    assertEquals(acceptEncoding, 'identity');
    assertEquals(chunks, [{ type: 'text', delta: 'live ok' }]);
  } finally {
    controller.abort();
    await server.finished.catch(() => undefined);
  }
});

Deno.test('projectChatSnapshot is the shared reducer (deterministic seed == live)', () => {
  const messages = [
    { id: 'm1', role: 'assistant', parts: [{ type: 'text', text: 'a' }] },
  ];
  const a = projectChatSnapshot(messages);
  const b = projectChatSnapshot(messages);
  assertEquals(a, b);
  assertEquals(a.messages[0].role, 'assistant');
  assertEquals(a.renderParts[0].kind, 'text');
});

Deno.test('createNetScriptChatConnection exposes idempotent close/stop/dispose (F-13)', async () => {
  let aborted = false;
  const connection = createNetScriptChatConnection({
    target: baseTarget,
    createConnection() {
      return {
        subscribe(signal) {
          return (async function* () {
            signal?.addEventListener('abort', () => (aborted = true), { once: true });
            yield { type: 'text', delta: 'x' };
          })();
        },
        send() {
          return Promise.resolve();
        },
      };
    },
  });

  assertEquals(connection.sessionId, 'chat-42');
  const chunks = await collect(connection.subscribe());
  assertEquals(chunks.length, 1);

  connection.dispose();
  connection.dispose(); // idempotent
  connection.stop();
  connection.close();
  assert(aborted, 'internal abort signal should fire on dispose');

  await assertRejects(
    () => connection.send([{ id: 'u1', role: 'user', content: 'hi' }]),
    Error,
    'disposed',
  );
});

Deno.test('one mounted chat connection shares one live request across repeated subscribe attempts', async () => {
  const probe = createHeldSubscriptionProbe();
  const connection = createNetScriptChatConnection({
    target: baseTarget,
    createConnection: () => probe.connection,
  });
  const first = connection.subscribe()[Symbol.asyncIterator]();
  const second = connection.subscribe()[Symbol.asyncIterator]();
  const pendingFirst = first.next();
  const pendingSecond = second.next();

  try {
    await waitFor(
      () => probe.stats.openRequests > 0,
      'the physical live request did not open',
    );
    await new Promise((resolve) => setTimeout(resolve, 5));
    assertEquals(probe.stats.subscribeCalls, 1);
    assertEquals(probe.stats.openRequests, 1);
    assertEquals(probe.stats.maxOpenRequests, 1);
  } finally {
    connection.dispose();
    await Promise.all([pendingFirst, pendingSecond]);
  }
});

Deno.test('concurrent subscribers receive identical values and terminal from one physical subscription', async () => {
  const probe = createEmittingSubscriptionProbe();
  const connection = createNetScriptChatConnection({
    target: baseTarget,
    createConnection: () => probe.connection,
  });
  const first = collectWithTerminal(connection.subscribe());
  const second = collectWithTerminal(connection.subscribe());

  await waitFor(
    () => probe.stats.subscribeCalls > 0,
    'the physical emitting subscription did not open',
  );
  await Promise.resolve();
  probe.emit('first', { token: 'second' });
  probe.finish();

  const [firstResult, secondResult] = await Promise.all([first, second]);
  assertEquals(firstResult.values, ['first', { token: 'second' }]);
  assertEquals(secondResult.values, firstResult.values);
  assertEquals(firstResult.terminal, { done: true, value: undefined });
  assertEquals(secondResult.terminal, firstResult.terminal);
  assertEquals(probe.stats.subscribeCalls, 1);
});

Deno.test('upstream error reaches both concurrent subscribers from one physical subscription', async () => {
  const probe = createEmittingSubscriptionProbe();
  const connection = createNetScriptChatConnection({
    target: baseTarget,
    createConnection: () => probe.connection,
  });
  const first = collect(connection.subscribe());
  const second = collect(connection.subscribe());

  await waitFor(
    () => probe.stats.subscribeCalls > 0,
    'the physical emitting subscription did not open',
  );
  await Promise.resolve();
  const upstreamError = new Error('fan-out failed');
  probe.fail(upstreamError);

  const [firstResult, secondResult] = await Promise.allSettled([first, second]);
  assertEquals(firstResult.status, 'rejected');
  assertEquals(secondResult.status, 'rejected');
  if (firstResult.status === 'rejected') assertStrictEquals(firstResult.reason, upstreamError);
  if (secondResult.status === 'rejected') assertStrictEquals(secondResult.reason, upstreamError);
  assertEquals(probe.stats.subscribeCalls, 1);
});

Deno.test('stop aborts the one physically in-flight shared live request', async () => {
  const serverController = new AbortController();
  let openedRequests = 0;
  let abortedRequests = 0;
  const server = Deno.serve(
    { port: 0, signal: serverController.signal, onListen() {} },
    (_request, info) => {
      openedRequests += 1;
      void info.completed.then(() => (abortedRequests += 1));
      return new Response(new ReadableStream({ start() {} }));
    },
  );

  try {
    const { port } = server.addr as Deno.NetAddr;
    const connection = createNetScriptChatConnection({
      target: { sessionId: 'physical-abort', baseUrl: `http://127.0.0.1:${port}` },
      createConnection(input) {
        return {
          subscribe(signal) {
            return (async function* () {
              const response = await fetch(input.readUrl, { signal });
              await response.body?.getReader().read();
              if (!signal?.aborted) yield undefined;
            })();
          },
          send: () => Promise.resolve(),
        };
      },
    });
    const first = connection.subscribe()[Symbol.asyncIterator]();
    const second = connection.subscribe()[Symbol.asyncIterator]();
    const pendingFirst = first.next();
    const pendingSecond = second.next();

    await waitFor(() => openedRequests > 0, 'the physical live GET did not open');
    await new Promise((resolve) => setTimeout(resolve, 5));
    connection.stop();
    await Promise.all([pendingFirst, pendingSecond]);
    await waitFor(() => abortedRequests > 0, 'the server did not observe the live GET abort');

    assertEquals(openedRequests, 1);
    assertEquals(abortedRequests, 1);
  } finally {
    serverController.abort();
    await server.finished.catch(() => undefined);
  }
});

Deno.test('re-subscribing after every prior subscriber explicitly stops opens a fresh request', async () => {
  const probe = createHeldSubscriptionProbe();
  const connection = createNetScriptChatConnection({
    target: baseTarget,
    createConnection: () => probe.connection,
  });
  const abortFirst = new AbortController();
  const abortSecond = new AbortController();
  const first = connection.subscribe(abortFirst.signal)[Symbol.asyncIterator]();
  const second = connection.subscribe(abortSecond.signal)[Symbol.asyncIterator]();
  const pendingFirst = first.next();
  const pendingSecond = second.next();

  await waitFor(
    () => probe.stats.openRequests > 0,
    'the first physical live request did not open',
  );
  abortFirst.abort();
  abortSecond.abort();
  await Promise.all([pendingFirst, pendingSecond]);
  await waitFor(
    () => probe.stats.openRequests === 0,
    'the first physical live request did not stop',
  );

  const third = connection.subscribe()[Symbol.asyncIterator]();
  const pendingThird = third.next();
  await waitFor(
    () => probe.stats.openRequests > 0,
    'the replacement physical live request did not open',
  );

  assertEquals(probe.stats.subscribeCalls, 2);
  assertEquals(probe.stats.maxOpenRequests, 1);
  connection.dispose();
  await pendingThird;
  assertEquals(probe.stats.abortedRequests, 2);
});

Deno.test('subscribe re-polls a transient empty first-subscribe (SR2)', async () => {
  let calls = 0;
  const connection = createNetScriptChatConnection({
    target: baseTarget,
    subscribeRetry: { maxAttempts: 5, initialDelayMs: 1, maxDelayMs: 2 },
    createConnection() {
      return {
        subscribe() {
          calls += 1;
          const attempt = calls;
          return (async function* () {
            if (attempt < 3) return; // transient empty poll (stream not created yet)
            yield { type: 'text', delta: 'ready' };
          })();
        },
        send() {
          return Promise.resolve();
        },
      };
    },
  });

  const chunks = await collect(connection.subscribe());
  assertEquals(chunks.length, 1);
  assertEquals(calls, 3, 'should have re-polled until the stream produced data');
  connection.dispose();
});

Deno.test('subscribe re-polls a transient error but propagates a hard auth error', async () => {
  // Transient error before any data -> re-polled then succeeds.
  let calls = 0;
  const transient = createNetScriptChatConnection({
    target: baseTarget,
    subscribeRetry: { maxAttempts: 5, initialDelayMs: 1, maxDelayMs: 2 },
    createConnection() {
      return {
        subscribe() {
          calls += 1;
          const attempt = calls;
          return (async function* () {
            if (attempt < 2) throw new Error('stream not found (404)');
            yield { ok: true };
          })();
        },
        send: () => Promise.resolve(),
      };
    },
  });
  assertEquals((await collect(transient.subscribe())).length, 1);
  transient.dispose();

  // Hard 401 -> surfaced as terminal.
  const denied = createNetScriptChatConnection({
    target: baseTarget,
    createConnection() {
      return {
        subscribe() {
          return (async function* () {
            throw new Error('401 unauthorized');
            // deno-lint-ignore no-unreachable
            yield undefined;
          })();
        },
        send: () => Promise.resolve(),
      };
    },
  });
  await assertRejects(() => collect(denied.subscribe()), Error, '401');
  denied.dispose();
});

Deno.test('toNetScriptChatResponse gates on authorize and wires the write URL', async () => {
  const newMessages: readonly NetScriptChatMessage[] = [{ id: 'u1', role: 'user', content: 'hi' }];
  const source = (async function* () {
    yield { type: 'text', delta: 'ok' };
  })();

  // Denied -> 403, session stream never touched.
  const denied = await toNetScriptChatResponse({
    target: baseTarget,
    source,
    request: new Request('https://app.test/chat'),
    authorize: () => false,
    toResponse() {
      throw new Error('must not reach the session stream when denied');
    },
  });
  assertEquals(denied.status, 403);

  // Authorized -> delegates to the response port with the resolved write URL.
  let capturedWriteUrl: string | undefined;
  const ok = await toNetScriptChatResponse({
    target: baseTarget,
    source: (async function* () {})(),
    newMessages,
    request: new Request('https://app.test/chat'),
    authorize: () => true,
    toResponse(input) {
      capturedWriteUrl = input.writeUrl;
      assertEquals(input.newMessages.length, 1);
      return Promise.resolve(new Response('streamed', { status: 200 }));
    },
  });
  assertEquals(ok.status, 200);
  assertEquals(
    capturedWriteUrl,
    'https://streams.example.test/v1/stream/netscript/ai/chat/chat-42',
  );
});

Deno.test('toNetScriptChatResponse forwards completion options without injecting a mode default', async () => {
  const waitUntil = (_task: Promise<unknown>): void => {};

  await toNetScriptChatResponse({
    target: baseTarget,
    source: (async function* () {})(),
    mode: 'await',
    waitUntil,
    toResponse(input) {
      assertEquals(input.mode, 'await');
      assertStrictEquals(input.waitUntil, waitUntil);
      return Promise.resolve(new Response(null, { status: 200 }));
    },
  });

  await toNetScriptChatResponse({
    target: baseTarget,
    source: (async function* () {})(),
    toResponse(input) {
      assertEquals(input.mode, undefined);
      assertEquals(input.waitUntil, undefined);
      return Promise.resolve(new Response(null, { status: 202 }));
    },
  });
});

Deno.test('real chat transport reports status and propagates write failures by completion mode', async () => {
  const controller = new AbortController();
  const methods: string[] = [];
  const server = Deno.serve(
    { port: 0, signal: controller.signal, onListen() {} },
    async (request) => {
      methods.push(request.method);
      await request.body?.cancel();
      return new Response(null, { status: request.method === 'PUT' ? 201 : 204 });
    },
  );

  const writeFailure = new Error('assistant write failed');
  const failingSource = () =>
    (async function* () {
      yield { type: 'TEXT_MESSAGE_CONTENT', delta: 'partial' };
      throw writeFailure;
    })();

  try {
    const { port } = server.addr as Deno.NetAddr;
    const target = { sessionId: 'completion-mode', baseUrl: `http://127.0.0.1:${port}` };

    const awaited = await toNetScriptChatResponse({
      target,
      source: (async function* () {
        yield { type: 'TEXT_MESSAGE_CONTENT', delta: 'complete' };
      })(),
      mode: 'await',
    });
    assertEquals(awaited.status, 200);

    await assertRejects(
      () => toNetScriptChatResponse({ target, source: failingSource(), mode: 'await' }),
      Error,
      writeFailure.message,
    );

    let backgroundTask: Promise<unknown> | undefined;
    const immediate = await toNetScriptChatResponse({
      target,
      source: failingSource(),
      waitUntil(task) {
        backgroundTask = task;
      },
    });
    assertEquals(immediate.status, 202);
    assert(backgroundTask, 'immediate mode should register the background write task');
    await backgroundTask;

    assertEquals(methods, ['PUT', 'POST', 'PUT', 'POST', 'PUT', 'POST']);
  } finally {
    controller.abort();
    await server.finished.catch(() => undefined);
  }
});

Deno.test('toNetScriptChatResponse throws when authorize is given without a request', async () => {
  await assertRejects(
    () =>
      toNetScriptChatResponse({
        target: baseTarget,
        source: (async function* () {})(),
        authorize: () => true,
      }),
    Error,
    'without a `request`',
  );
});

Deno.test('projectChatSnapshot tolerates malformed / partial messages', () => {
  const result = projectChatSnapshot([null, 42, { role: 'weird' }, { content: 'flat' }]);
  assertEquals(result.messages.length, 4);
  assertEquals(result.messages[0].role, 'assistant'); // unknown role defaults
  assertStringIncludes(result.messages[3].content, 'flat');
});
