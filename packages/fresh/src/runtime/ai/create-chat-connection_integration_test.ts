import { assertEquals } from '@std/assert';
import {
  createNetScriptChatConnection,
  type NetScriptChatMessage,
  resolveChatSnapshot,
} from './create-chat-connection.ts';

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
  const durableUserTurn = {
    id: 'user-1',
    role: 'user',
    parts: [{ type: 'text', text: 'Explain naïve UTF-8 — briefly…' }],
  };
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
