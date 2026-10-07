/** Sonnet 5.5 catalog and native transport regressions. @module */

import { assert, assertEquals } from '@std/assert';
import { ANTHROPIC_MODELS } from '@tanstack/ai-anthropic';
import { AnthropicModelProvider } from '../anthropic.ts';

Deno.test('anthropic: Sonnet 5.5 extends discovery while retaining every upstream model', async () => {
  const provider = new AnthropicModelProvider();
  const models = await provider.listModels();
  const ids = models.map((model) => model.id);
  assertEquals(ids.length, new Set(ids).size);
  for (const id of [...ANTHROPIC_MODELS, 'claude-sonnet-5-5']) {
    assert(provider.supports(id));
    assert(ids.includes(id));
    assertEquals((await provider.getModel(id)).descriptor.id, id);
  }
  assert(!provider.supports('claude-sonnet-unrecognized'));
});

Deno.test({
  name: 'anthropic: Sonnet 5.5 reaches the native request with explicit and environment API keys',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const originalFetch = globalThis.fetch;
    const originalConsoleError = console.error;
    const originalConsoleLog = console.log;
    const originalKey = Deno.env.get('ANTHROPIC_API_KEY');
    const requests: { model: string; messages: unknown }[] = [];
    Deno.env.set('ANTHROPIC_API_KEY', 'test-anthropic-key');
    console.error = () => {};
    console.log = () => {};
    globalThis.fetch = async (input, init) => {
      const request = new Request(input, init);
      requests.push(JSON.parse(await request.text()));
      return new Response('{"error":{"type":"authentication_error","message":"test response"}}', {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    };
    try {
      for (const apiKey of ['test-explicit-key', undefined]) {
        const client = new AnthropicModelProvider({
          apiKey,
          baseURL: 'https://anthropic.example.test',
        }).createChatClient('claude-sonnet-5-5');
        for await (
          const _event of client.stream({ messages: [{ role: 'user', content: 'hello' }] })
        ) {
          // The stubbed rejection ends the turn after capturing the native request.
        }
      }
    } finally {
      globalThis.fetch = originalFetch;
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
      if (originalKey === undefined) Deno.env.delete('ANTHROPIC_API_KEY');
      else Deno.env.set('ANTHROPIC_API_KEY', originalKey);
    }
    assertEquals(requests.length, 2);
    for (const request of requests) {
      assertEquals(request.model, 'claude-sonnet-5-5');
      assert(JSON.stringify(request.messages).includes('hello'));
    }
  },
});
