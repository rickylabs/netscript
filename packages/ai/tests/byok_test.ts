/** Per-request provider connection override tests for #461. @module */

import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { AnthropicModelProvider } from '../anthropic.ts';
import { OllamaModelProvider } from '../ollama.ts';
import { OpenAiCompatibleModelProvider } from '../openai-compatible.ts';
import { OpenRouterModelProvider } from '../openrouter.ts';
import type { ChatClientEvent, ChatClientPort } from '../src/ports/chat-client.ts';

interface CapturedRequest {
  readonly url: string;
  readonly headers: Headers;
}

async function runTurn(
  client: ChatClientPort,
  connection?: { readonly apiKey?: string; readonly baseURL?: string; readonly host?: string },
): Promise<ChatClientEvent[]> {
  const events: ChatClientEvent[] = [];
  for await (
    const event of client.stream(
      { messages: [{ role: 'user', content: 'hello' }] },
      { connection },
    )
  ) events.push(event);
  return events;
}

Deno.test({
  name: 'BYOK: each chat adapter resolves per-request connection values and static fallbacks',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const originalFetch = globalThis.fetch;
    const originalConsoleError = console.error;
    const captured: CapturedRequest[] = [];
    const logged: unknown[][] = [];
    console.error = (...args: unknown[]) => logged.push(args);
    globalThis.fetch = (input, init) => {
      const request = new Request(input, init);
      captured.push({ url: request.url, headers: request.headers });
      return Promise.resolve(
        new Response('{"error":{"message":"rejected"}}', {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
      );
    };
    try {
      await runTurn(
        new AnthropicModelProvider({ apiKey: 'static-ant', baseURL: 'https://static-ant.example' })
          .createChatClient('claude-sonnet-4-5'),
        { apiKey: 'request-ant', baseURL: 'https://request-ant.example' },
      );
      await runTurn(
        new OpenAiCompatibleModelProvider({
          apiKey: 'static-oai',
          baseURL: 'https://static-oai.example/v1',
        }).createChatClient('model'),
        { apiKey: 'request-oai', baseURL: 'https://request-oai.example/v1' },
      );
      await runTurn(
        new OpenRouterModelProvider({ apiKey: 'static-router' }).createChatClient('model'),
        { apiKey: 'request-router', baseURL: 'https://request-router.example/v1' },
      );
      await runTurn(
        new OllamaModelProvider({ host: 'http://static-ollama.example' })
          .createChatClient('model'),
        { host: 'http://request-ollama.example/' },
      );
      await runTurn(
        new OpenAiCompatibleModelProvider({
          apiKey: 'fallback-key',
          baseURL: 'https://fallback.example/v1',
        }).createChatClient('model'),
      );
    } finally {
      globalThis.fetch = originalFetch;
      console.error = originalConsoleError;
    }

    assertEquals(captured.length, 5);
    assertStringIncludes(captured[0]!.url, 'request-ant.example');
    assertEquals(captured[0]!.headers.get('x-api-key'), 'request-ant');
    assertStringIncludes(captured[1]!.url, 'request-oai.example');
    assertEquals(captured[1]!.headers.get('authorization'), 'Bearer request-oai');
    assertStringIncludes(captured[2]!.url, 'request-router.example');
    assertEquals(captured[2]!.headers.get('authorization'), 'Bearer request-router');
    assertStringIncludes(captured[3]!.url, 'request-ollama.example/v1');
    assertStringIncludes(captured[4]!.url, 'fallback.example');
    assertEquals(captured[4]!.headers.get('authorization'), 'Bearer fallback-key');
    const logs = JSON.stringify(logged);
    for (const secret of ['request-ant', 'request-oai', 'request-router', 'fallback-key']) {
      assert(!logs.includes(secret));
    }
  },
});

Deno.test('BYOK: missing-configuration errors never echo request secrets', async () => {
  const apiKey = 'sentinel-secret-key';
  const baseURL = 'https://sentinel-secret-host.example/v1';
  const client = new OpenAiCompatibleModelProvider().createChatClient('model');
  const events = await runTurn(client, { apiKey });
  const rendered = events.map((event) =>
    event.type === 'error' ? `${event.message} ${String(event.cause)}` : JSON.stringify(event)
  ).join('\n');

  assert(events.some((event) => event.type === 'error'));
  assert(!rendered.includes(apiKey));
  assert(!rendered.includes(baseURL));
});
