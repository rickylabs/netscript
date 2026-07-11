/** Fetch-mocked tests for the dedicated OpenAI-compatible vision adapter. */

import { assert, assertEquals, assertRejects, assertStrictEquals } from '@std/assert';
import '../openai-compatible.ts';
import { OPENAI_VISION_PROVIDER_ID, OpenAiVisionProvider } from '../openai-compatible.ts';
import { getVisionProvider, listVisionProviders } from '../mod.ts';
import { AiError, AiNotConfiguredError } from '../src/contracts/mod.ts';
import { createUnconfiguredVisionProvider } from '../src/ports/vision.ts';

interface RecordedRequest {
  readonly url: string;
  readonly init?: RequestInit;
  readonly body: unknown;
}

function createJsonFetch(
  payload: unknown,
  status = 200,
): { readonly fetch: typeof fetch; readonly requests: readonly RecordedRequest[] } {
  const requests: RecordedRequest[] = [];
  const fetchMock: typeof fetch = (input, init) => {
    requests.push({
      url: String(input),
      init,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    });
    return Promise.resolve(new Response(JSON.stringify(payload), { status }));
  };
  return { fetch: fetchMock, requests };
}

function successPayload(): unknown {
  return {
    choices: [{ message: { content: 'a small diagram' } }],
    usage: { prompt_tokens: 12, completion_tokens: 5, total_tokens: 17 },
  };
}

Deno.test('openai-vision: provider-family subpath registers a dedicated vision provider', () => {
  assert(listVisionProviders().includes(OPENAI_VISION_PROVIDER_ID));
  assert(
    getVisionProvider(OPENAI_VISION_PROVIDER_ID, { apiKey: 'test-key' }) instanceof
      OpenAiVisionProvider,
  );
});

Deno.test('openai-vision: URL source request shape and usage propagation', async () => {
  const mock = createJsonFetch(successPayload());
  const provider = new OpenAiVisionProvider({
    apiKey: 'test-key',
    baseURL: 'https://gateway.example/openai/',
    model: 'vision-default',
    fetch: mock.fetch,
  });
  const abort = new AbortController();
  const result = await provider.analyze(
    { type: 'url', value: 'https://cdn.example/image.png' },
    'What is shown?',
    { signal: abort.signal },
  );

  assertEquals(mock.requests[0]?.url, 'https://gateway.example/openai/chat/completions');
  assertEquals(mock.requests[0]?.body, {
    model: 'vision-default',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'What is shown?' },
        { type: 'image_url', image_url: { url: 'https://cdn.example/image.png' } },
      ],
    }],
  });
  assertStrictEquals(mock.requests[0]?.init?.signal, abort.signal);
  assertEquals(result, {
    text: 'a small diagram',
    usage: { promptTokens: 12, completionTokens: 5, totalTokens: 17 },
  });
});

Deno.test('openai-vision: base64 source becomes a MIME data URL', async () => {
  const mock = createJsonFetch(successPayload());
  const provider = new OpenAiVisionProvider({ apiKey: 'test-key', fetch: mock.fetch });
  await provider.analyze(
    { type: 'data', value: 'abc123', mimeType: 'image/png' },
    'Describe',
    { model: 'gpt-4.1-mini' },
  );

  assertEquals(mock.requests[0]?.body, {
    model: 'gpt-4.1-mini',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'Describe' },
        { type: 'image_url', image_url: { url: 'data:image/png;base64,abc123' } },
      ],
    }],
  });
});

Deno.test('openai-vision: provider errors map to AiError', async () => {
  const mock = createJsonFetch({ error: { message: 'unsupported image' } }, 400);
  const provider = new OpenAiVisionProvider({ apiKey: 'test-key', fetch: mock.fetch });
  await assertRejects(
    () => provider.analyze({ type: 'url', value: 'https://example.test/image.png' }, 'Describe'),
    AiError,
    'unsupported image',
  );
});

Deno.test('vision: unconfigured default still throws the typed error', async () => {
  await assertRejects(
    () =>
      createUnconfiguredVisionProvider().analyze(
        { type: 'url', value: 'https://example.test/image.png' },
        'Describe',
      ),
    AiNotConfiguredError,
  );
});
