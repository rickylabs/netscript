/**
 * Registration + port-conformance tests for the OpenAI-compatible provider subpath.
 *
 * @module
 */
import { assert, assertEquals, assertRejects } from '@std/assert';
import '../openai-compatible.ts'; // side effect: self-registers 'openai-compatible'
import {
  OPENAI_COMPATIBLE_PROVIDER_ID,
  OpenAiCompatibleModelProvider,
} from '../openai-compatible.ts';
import { getModelProvider, listModelProviders } from '../mod.ts';
import { AiError } from '../src/contracts/mod.ts';
import type { ChatClientPort } from '../src/ports/chat-client.ts';

const CONFIG = {
  baseURL: 'https://api.deepseek.example/v1',
  apiKey: 'test-key',
  models: ['deepseek-chat', 'deepseek-reasoner'] as const,
};

interface CapturedRequest {
  readonly body: string;
}

async function drain(client: ChatClientPort): Promise<void> {
  const request = {
    messages: [{ role: 'user', content: 'hello' }],
    options: { reasoningEffort: 'high', maxOutputTokens: 321 },
  } as const;
  for await (const _event of client.stream(request)) {
    // Only the captured request body matters; the stub rejects before response parsing.
  }
}

Deno.test('openai-compatible: importing the subpath self-registers the provider', () => {
  assert(listModelProviders().includes(OPENAI_COMPATIBLE_PROVIDER_ID));
  const provider = getModelProvider(OPENAI_COMPATIBLE_PROVIDER_ID, { ...CONFIG });
  assertEquals(provider.id, 'openai-compatible');
});

Deno.test('openai-compatible: listModels/supports/getModel reflect the configured models', async () => {
  const provider = new OpenAiCompatibleModelProvider({ ...CONFIG });
  const models = await provider.listModels();
  assertEquals(models.map((m) => m.id), ['deepseek-chat', 'deepseek-reasoner']);
  assertEquals(models[0]?.provider, 'openai-compatible');
  assert(provider.supports('deepseek-chat'));
  const handle = await provider.getModel('deepseek-reasoner');
  assertEquals(handle.providerId, 'openai-compatible');
  assertEquals(handle.descriptor.id, 'deepseek-reasoner');
});

Deno.test('openai-compatible: getModel rejects an unknown model when models are configured', async () => {
  const provider = new OpenAiCompatibleModelProvider({ ...CONFIG });
  assert(!provider.supports('not-a-model'));
  await assertRejects(() => provider.getModel('not-a-model'), AiError);
});

Deno.test('openai-compatible: unconfigured models list is optimistic (endpoint owns its catalog)', async () => {
  const provider = new OpenAiCompatibleModelProvider({
    baseURL: CONFIG.baseURL,
    apiKey: CONFIG.apiKey,
  });
  assertEquals(await provider.listModels(), []);
  assert(provider.supports('anything'));
  const handle = await provider.getModel('anything');
  assertEquals(handle.descriptor.id, 'anything');
});

Deno.test('openai-compatible: createChatClient wraps the TanStack client (F-13 stop path)', () => {
  const provider = new OpenAiCompatibleModelProvider({ ...CONFIG });
  const client = provider.createChatClient('deepseek-chat');
  // Cancellation is driven by an AbortController passed to chat()/chatStream().
  assertEquals(client.kind, 'text');
});

Deno.test({
  name: 'openai-compatible: createChatClient selects the mapper for the configured API',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const originalFetch = globalThis.fetch;
    const originalConsoleError = console.error;
    const originalConsoleLog = console.log;
    const captured: CapturedRequest[] = [];
    console.error = () => {};
    console.log = () => {};
    globalThis.fetch = async (input, init) => {
      const request = new Request(input, init);
      captured.push({ body: await request.text() });
      return new Response('{"error":{"message":"rejected"}}', {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    };
    try {
      for (const api of ['responses', 'chat-completions', undefined] as const) {
        await drain(
          new OpenAiCompatibleModelProvider({ ...CONFIG, api }).createChatClient('model'),
        );
      }
    } finally {
      globalThis.fetch = originalFetch;
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
    }

    assertEquals(captured.length, 3);
    const [responsesRequest, chatRequest, defaultRequest] = captured;
    assert(responsesRequest !== undefined);
    assert(chatRequest !== undefined);
    assert(defaultRequest !== undefined);

    const responsesBody: unknown = JSON.parse(responsesRequest.body);
    assert(responsesBody !== null && typeof responsesBody === 'object');
    assertEquals(Reflect.get(responsesBody, 'reasoning'), { effort: 'high' });
    assertEquals(Reflect.get(responsesBody, 'max_output_tokens'), 321);
    assert(!Object.hasOwn(responsesBody, 'reasoning_effort'));
    assert(!Object.hasOwn(responsesBody, 'max_tokens'));

    for (const request of [chatRequest, defaultRequest]) {
      const body: unknown = JSON.parse(request.body);
      assert(body !== null && typeof body === 'object');
      assertEquals(Reflect.get(body, 'reasoning_effort'), 'high');
      assertEquals(Reflect.get(body, 'max_tokens'), 321);
      assert(!Object.hasOwn(body, 'reasoning'));
      assert(!Object.hasOwn(body, 'max_output_tokens'));
    }
  },
});

Deno.test('openai-compatible: an unconfigured client can receive connection values per request', () => {
  const provider = new OpenAiCompatibleModelProvider({ models: ['m1'] });
  assertEquals(provider.createChatClient('m1').kind, 'text');
});
