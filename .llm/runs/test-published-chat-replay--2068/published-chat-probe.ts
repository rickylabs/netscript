/** Non-discoverable source: run-proof.ts copies this into an isolated consumer_test.ts. */
import { assert, assertEquals } from '@std/assert';
import {
  createNetScriptChatConnection,
  type NetScriptChatSendMessage,
  resolveChatSnapshot,
  toNetScriptChatResponse,
} from '@netscript/fresh/ai';
import { bounded, HttpStreamFixture, isRecord } from './http-stream-fixture.ts';

if (!Deno.args.includes('--isolated-published-probe')) {
  throw new Error(
    'Use run-proof.ts; direct workspace execution is not published-consumer evidence.',
  );
}

const rich = {
  id: 'rich-ui',
  role: 'user' as const,
  metadata: { revision: 1, application: { retained: ['nested', 42] } },
  futureField: { intact: true },
  parts: [
    { type: 'text', content: 'Preserve — naïve UTF-8…' },
    { type: 'image', source: { type: 'data', value: 'aW1hZ2U=', mimeType: 'image/png' } },
    { type: 'audio', source: { type: 'data', value: 'YXVkaW8=', mimeType: 'audio/wav' } },
    { type: 'video', source: { type: 'data', value: 'dmlkZW8=', mimeType: 'video/mp4' } },
    { type: 'document', source: { type: 'data', value: 'ZG9j', mimeType: 'application/pdf' } },
    {
      type: 'tool-call',
      id: 'call',
      name: 'inspect',
      arguments: '{}',
      state: 'complete',
      output: { ok: true },
    },
    {
      type: 'tool-result',
      toolCallId: 'call',
      content: [{ type: 'text', content: 'result' }],
      state: 'complete',
    },
    { type: 'thinking', content: 'retained reasoning' },
    { type: 'structured-output', status: 'complete', raw: '{"ok":true}', data: { ok: true } },
    { type: 'future-attachment', data: { opaque: true } },
  ],
};
const model = {
  id: 'rich-model',
  role: 'assistant' as const,
  content: [{ type: 'text' as const, content: 'Model content' }, {
    type: 'image' as const,
    source: { type: 'data' as const, value: 'aW1hZ2U=', mimeType: 'image/png' },
  }],
  metadata: { signature: 'retained' },
  toolCalls: [{
    id: 'model-call',
    type: 'function' as const,
    function: { name: 'inspect', arguments: '{}' },
  }],
  thinking: [{ content: 'model reasoning', signature: 'opaque' }],
};
const activity = {
  id: 'activity',
  role: 'activity' as const,
  parts: [{ type: 'activity', activityType: 'progress', content: { complete: 1, total: 2 } }],
  metadata: { revision: 1 },
};

async function persist(
  fixture: HttpStreamFixture,
  messages: readonly NetScriptChatSendMessage[],
): Promise<void> {
  await bounded(toNetScriptChatResponse({
    target: fixture.target,
    newMessages: messages,
    source: (async function* () {})(),
    mode: 'await',
  }));
}

function json(value: unknown): unknown {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function snapshot(value: unknown): readonly unknown[] | undefined {
  return isRecord(value) && value.type === 'MESSAGES_SNAPSHOT' && Array.isArray(value.messages)
    ? value.messages
    : undefined;
}

async function nextSnapshot(
  reader: AsyncIterator<unknown>,
  predicate: (messages: readonly unknown[]) => boolean,
): Promise<readonly unknown[]> {
  return await bounded((async () => {
    for (let frames = 0; frames < 100; frames++) {
      const event = await reader.next();
      assert(!event.done, 'reader ended before native snapshot');
      const messages = snapshot(event.value);
      if (messages && predicate(messages)) return messages;
    }
    throw new Error('Exceeded finite replay frame budget');
  })());
}

function revision(messages: readonly unknown[], id: string, expected: number): boolean {
  return messages.some((message) =>
    isRecord(message) && message.id === id && isRecord(message.metadata) &&
    message.metadata.revision === expected
  );
}

Deno.test('published native parts survive writer persistence, snapshot reload and cold public replay', async () => {
  const fixture = new HttpStreamFixture(Deno.args.includes('--drop-native'));
  const abort = new AbortController();
  const connection = createNetScriptChatConnection({ target: fixture.target });
  let reader: AsyncIterator<unknown> | undefined;
  try {
    const expected = [rich, model, activity];
    await persist(fixture, expected);
    assert(fixture.posted.length > 0, 'published default writer must POST records');
    assertEquals(
      fixture.records,
      fixture.posted.flat(),
      'fixture stores writer POST bodies verbatim',
    );
    const seed = await resolveChatSnapshot({ target: fixture.target });
    assertEquals(fixture.snapshotOffsets, ['-1'], 'native start cursor reads the complete stream');
    assertEquals(seed.nativeMessages.length, expected.length, 'native history count');
    for (const [index, message] of expected.entries()) {
      const actual = json(seed.nativeMessages[index]);
      assert(isRecord(actual));
      const original = json(message);
      assert(isRecord(original));
      for (const [key, value] of Object.entries(original)) {
        assertEquals(json(actual[key]), value, `native parts/metadata field ${key} must survive`);
      }
    }
    assert(seed.offset !== null);
    assert(
      fixture.records.length > seed.nativeMessages.length,
      'writer echoes and native batches deduplicate',
    );
    assertEquals(
      json((await resolveChatSnapshot({ target: fixture.target })).nativeMessages),
      json(seed.nativeMessages),
    );
    reader = connection.subscribe(abort.signal)[Symbol.asyncIterator]();
    const replay = await nextSnapshot(reader, (messages) => revision(messages, 'rich-ui', 1));
    assertEquals(
      json(replay),
      json(seed.nativeMessages),
      'cold public replay retains complete native state',
    );
  } finally {
    abort.abort();
    connection.dispose();
    await reader?.return?.();
    await fixture.close();
  }
});

Deno.test('published seeded readers share one SSE through native live updates and independent cancellation', async () => {
  const fixture = new HttpStreamFixture();
  let connection: ReturnType<typeof createNetScriptChatConnection> | undefined;
  const firstAbort = new AbortController();
  const secondAbort = new AbortController();
  let first: AsyncIterator<unknown> | undefined;
  let second: AsyncIterator<unknown> | undefined;
  let third: AsyncIterator<unknown> | undefined;
  try {
    await persist(fixture, [rich, activity]);
    const seed = await resolveChatSnapshot({ target: fixture.target });
    const originalSeed = json(seed);
    connection = createNetScriptChatConnection({
      target: fixture.target,
      initialMessages: seed.nativeMessages,
      initialOffset: seed.offset ?? undefined,
    });
    first = connection.subscribe(firstAbort.signal)[Symbol.asyncIterator]();
    second = connection.subscribe(secondAbort.signal)[Symbol.asyncIterator]();
    const hasAppendedUpdate = (messages: readonly unknown[]) =>
      revision(messages, 'rich-ui', 2) && revision(messages, 'appended-ui', 1);
    const firstUpdate = nextSnapshot(first, hasAppendedUpdate);
    const secondUpdate = nextSnapshot(second, hasAppendedUpdate);
    await fixture.until(() => fixture.live === 1);
    assertEquals(fixture.opens, 1);
    assertEquals(fixture.offsets, [seed.offset]);
    const updated = { ...rich, metadata: { ...rich.metadata, revision: 2 } };
    const appended = { ...rich, id: 'appended-ui' };
    await persist(fixture, [updated, appended]);
    const expectedUpdate = json([updated, seed.nativeMessages[1], appended]);
    assertEquals(
      json(await firstUpdate),
      expectedUpdate,
      'first reader retains untouched seeded history',
    );
    assertEquals(
      json(await secondUpdate),
      expectedUpdate,
      'second reader retains untouched seeded history',
    );
    const firstPending = first.next();
    firstAbort.abort();
    assertEquals((await bounded(firstPending)).done, true);
    assertEquals(fixture.live, 1, 'one reader abort must not close its peer transport');
    const lastUpdate = nextSnapshot(second, (messages) => revision(messages, 'rich-ui', 3));
    const finalMessage = { ...rich, metadata: { ...rich.metadata, revision: 3 } };
    await persist(fixture, [finalMessage]);
    const live = await lastUpdate;
    assertEquals(live.length, 3, 'writer echoes and repeated IDs must not duplicate history');
    assertEquals(json(live), json([finalMessage, seed.nativeMessages[1], appended]));
    const secondPending = second.next();
    secondAbort.abort();
    assertEquals((await bounded(secondPending)).done, true);
    await fixture.until(() => fixture.live === 0);
    assertEquals(fixture.opens, 1);
    assertEquals(fixture.maxLive, 1);
    assertEquals(fixture.cancels, 1);
    third = connection.subscribe()[Symbol.asyncIterator]();
    const thirdPending = third.next();
    await fixture.until(() => fixture.live === 1);
    assertEquals(fixture.opens, 2);
    assertEquals(
      fixture.offsets.at(-1),
      String(fixture.records.length),
      'reopen resumes at the current stream end',
    );
    connection.dispose();
    assertEquals((await bounded(thirdPending)).done, true, 'dispose ends the active reader');
    await fixture.until(() => fixture.live === 0);
    assertEquals(fixture.cancels, 2, 'dispose closes the reopened transport');
    assertEquals(fixture.maxLive, 1);
    assertEquals(fixture.records, fixture.posted.flat());
    assertEquals(
      json((await resolveChatSnapshot({ target: fixture.target })).nativeMessages),
      json(live),
    );
    assertEquals(json(seed), originalSeed, 'live updates must not mutate the SSR seed');
  } finally {
    firstAbort.abort();
    secondAbort.abort();
    connection?.dispose();
    await first?.return?.();
    await second?.return?.();
    await third?.return?.();
    await fixture.close();
  }
});
