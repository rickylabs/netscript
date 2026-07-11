/**
 * Fetch-mocked tests for the OpenAI-compatible embeddings subpath.
 *
 * @module
 */

import { assert, assertEquals, assertRejects, assertStrictEquals } from '@std/assert';
import '../openai-embeddings.ts';
import { OPENAI_EMBEDDINGS_PROVIDER_ID, OpenAiEmbeddingsProvider } from '../openai-embeddings.ts';
import { getEmbeddingProvider, listEmbeddingProviders } from '../mod.ts';
import { AiError, AiNotConfiguredError } from '../src/contracts/mod.ts';

interface RecordedRequest {
  readonly url: string;
  readonly init?: RequestInit;
  readonly body: unknown;
}

function createJsonFetch(
  payload: unknown,
  options: { readonly status?: number } = {},
): { readonly fetch: typeof fetch; readonly requests: readonly RecordedRequest[] } {
  const requests: RecordedRequest[] = [];
  const fetchMock: typeof fetch = (input, init) => {
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    requests.push({ url: String(input), init, body });
    return Promise.resolve(
      new Response(JSON.stringify(payload), { status: options.status ?? 200 }),
    );
  };
  return { fetch: fetchMock, requests };
}

function embeddingPayload(): unknown {
  return {
    model: 'text-embedding-3-small',
    data: [
      { index: 1, embedding: [0.3, 0.4] },
      { index: 0, embedding: [0.1, 0.2] },
    ],
    usage: { prompt_tokens: 4, total_tokens: 4 },
  };
}

Deno.test('openai-embeddings: importing the subpath self-registers the provider', () => {
  assert(listEmbeddingProviders().includes(OPENAI_EMBEDDINGS_PROVIDER_ID));

  const embeddingProvider = getEmbeddingProvider(OPENAI_EMBEDDINGS_PROVIDER_ID, {
    apiKey: 'test-key',
  });
  assert(embeddingProvider instanceof OpenAiEmbeddingsProvider);
});

Deno.test('openai-embeddings: embed shapes request and maps response in input order', async () => {
  const mock = createJsonFetch(embeddingPayload());
  const provider = new OpenAiEmbeddingsProvider({
    apiKey: 'test-key',
    baseURL: 'https://openai.example/v1/',
    fetch: mock.fetch,
  });
  const abort = new AbortController();

  const result = await provider.embed(['first', 'second'], {
    model: 'text-embedding-3-small',
    signal: abort.signal,
  });

  assertEquals(mock.requests[0]?.url, 'https://openai.example/v1/embeddings');
  assertEquals(mock.requests[0]?.body, {
    model: 'text-embedding-3-small',
    input: ['first', 'second'],
  });
  assertStrictEquals(mock.requests[0]?.init?.signal, abort.signal);
  assertEquals(result, {
    embeddings: [[0.1, 0.2], [0.3, 0.4]],
    model: 'text-embedding-3-small',
    usage: { promptTokens: 4, completionTokens: 0, totalTokens: 4 },
  });
});

Deno.test('openai-embeddings: provider error maps to AiError', async () => {
  const mock = createJsonFetch(
    { error: { message: 'bad model', type: 'invalid_request_error' } },
    { status: 400 },
  );
  const provider = new OpenAiEmbeddingsProvider({ apiKey: 'test-key', fetch: mock.fetch });

  await assertRejects(
    () => provider.embed('hello'),
    AiError,
    'bad model',
  );
});

Deno.test('openai-embeddings: malformed embedding response rejects', async () => {
  const mock = createJsonFetch({ data: [{ index: 0, embedding: ['not-a-number'] }] });
  const provider = new OpenAiEmbeddingsProvider({ apiKey: 'test-key', fetch: mock.fetch });

  await assertRejects(
    () => provider.embed('hello'),
    AiError,
    'malformed',
  );
});

Deno.test('openai-embeddings: missing api key rejects before fetch', async () => {
  const mock = createJsonFetch(embeddingPayload());
  const provider = new OpenAiEmbeddingsProvider({ fetch: mock.fetch });

  await assertRejects(
    () => provider.embed('hello'),
    AiNotConfiguredError,
  );
  assertEquals(mock.requests.length, 0);
});
