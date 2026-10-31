/** Real SDK/bridge regressions for busy-provider retry ownership. */
import { assert, assertEquals, assertInstanceOf, assertThrows } from '@std/assert';
import { AiRateLimitError, getModelProvider, withRetryingChatClient } from '../mod.ts';
import { type OpenAiCompatibleApi, OpenAiCompatibleModelProvider } from '../openai-compatible.ts';
import type { ChatClientEvent, ChatClientPort } from '../src/ports/chat-client.ts';

const CONFIG = { baseURL: 'https://provider.example/v1', apiKey: 'test-secret', models: ['m1'] };

async function collect(client: ChatClientPort): Promise<ChatClientEvent[]> {
  return await Array.fromAsync(client.stream({ messages: [{ role: 'user', content: 'hello' }] }));
}

function success(api: OpenAiCompatibleApi): Response {
  const chunks = api === 'chat-completions'
    ? [{
      id: 'test-chat',
      object: 'chat.completion.chunk',
      created: 1,
      model: 'm1',
      choices: [{ index: 0, delta: { content: 'ok' }, finish_reason: 'stop' }],
    }]
    : [
      { type: 'response.output_text.delta', item_id: 'msg', output_index: 0, delta: 'ok' },
      {
        type: 'response.completed',
        response: { id: 'test-response', model: 'm1', status: 'completed', output: [] },
      },
    ];
  return new Response(
    chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join('') + 'data: [DONE]\n\n',
    { headers: { 'content-type': 'text/event-stream' } },
  );
}

function busy(
  status: number,
  code?: string,
  headers: Readonly<Record<string, string>> = { 'retry-after': '120' },
): Response {
  return new Response(JSON.stringify({ error: { message: 'provider busy', code } }), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

Deno.test('busy SDK responses preserve typed metadata and retry before output for both APIs', async (t) => {
  const original = globalThis.fetch;
  try {
    for (const api of ['chat-completions', 'responses'] as const) {
      for (
        const [status, code] of [[429, undefined], [503, undefined], [
          429,
          'rate_limit_exceeded',
        ]] as const
      ) {
        await t.step(`${api} ${code ?? status}`, async () => {
          let calls = 0;
          globalThis.fetch = () => Promise.resolve(busy(status, code));
          const provider = new OpenAiCompatibleModelProvider({ ...CONFIG, api, maxRetries: 0 });
          const raw = await collect(provider.createChatClient('m1'));
          const error = raw.find((event) => event.type === 'error');
          assert(error?.type === 'error');
          assertInstanceOf(error.cause, AiRateLimitError);
          assertEquals(error.cause.status, status);
          assertEquals(error.cause.retryAfterMs, 120_000);
          assertEquals(error.cause.cause, code ?? String(status));
          assert(!JSON.stringify(raw).includes(CONFIG.apiKey));

          globalThis.fetch = async (input, init) => {
            calls++;
            const body: unknown = await new Request(input, init).json();
            assert(body !== null && typeof body === 'object');
            assert(!Object.hasOwn(body, 'maxRetries'), 'SDK options must not reach the model');
            return calls === 1 ? busy(status, code) : success(api);
          };
          const delays: number[] = [];
          const client = withRetryingChatClient(provider.createChatClient('m1'), {
            maxAttempts: 2,
            maxDelayMs: 120_000,
            sleep: (delay) => {
              delays.push(delay);
              return Promise.resolve();
            },
          });
          const events = await collect(client);
          assertEquals(calls, 2);
          assertEquals(delays, [120_000]);
          assert(events.some((event) => event.type === 'text' && event.delta === 'ok'));
          assert(events.some((event) => event.type === 'finish'));
          assert(!events.some((event) => event.type === 'error'));
        });
      }
    }
  } finally {
    globalThis.fetch = original;
  }
});

Deno.test('SDK maxRetries works for direct and registry clients; quota and nonbusy errors do not retry', async (t) => {
  const original = globalThis.fetch;
  try {
    for (const api of ['chat-completions', 'responses'] as const) {
      for (const registered of [false, true]) {
        await t.step(`${api} registry=${registered}`, async () => {
          for (const maxRetries of [0, 1, undefined]) {
            let calls = 0;
            globalThis.fetch = () => {
              calls++;
              return Promise.resolve(busy(503, undefined, { 'retry-after-ms': '1' }));
            };
            const config = { ...CONFIG, api, maxRetries };
            const provider = registered
              ? getModelProvider('openai-compatible', config)
              : new OpenAiCompatibleModelProvider(config);
            assert(
              'createChatClient' in provider && typeof provider.createChatClient === 'function',
            );
            await collect(provider.createChatClient('m1'));
            assertEquals(calls, (maxRetries ?? 2) + 1);
          }
        });
      }
      for (
        const [status, code] of [[429, 'insufficient_quota'], [401, undefined], [
          400,
          undefined,
        ]] as const
      ) {
        await t.step(`${api} nonbusy ${code ?? status}`, async () => {
          let calls = 0;
          globalThis.fetch = () => {
            calls++;
            return Promise.resolve(busy(status, code));
          };
          const client = withRetryingChatClient(
            new OpenAiCompatibleModelProvider({ ...CONFIG, api, maxRetries: 0 }).createChatClient(
              'm1',
            ),
            { maxAttempts: 3, sleep: () => Promise.reject(new Error('must not sleep')) },
          );
          const events = await collect(client);
          assertEquals(calls, 1);
          assertEquals(events.filter((event) => event.type === 'error').length, 1);
          const error = events.find((event) => event.type === 'error');
          assertEquals(error?.cause, code ?? String(status));
        });
      }
    }
  } finally {
    globalThis.fetch = original;
  }
});

Deno.test('SDK retry configuration rejects invalid numeric counts in direct and registry paths', () => {
  for (const maxRetries of [-1, 1.5, NaN, Infinity]) {
    assertThrows(() => new OpenAiCompatibleModelProvider({ maxRetries }), RangeError);
    assertThrows(() => getModelProvider('openai-compatible', { maxRetries }), RangeError);
  }
});
