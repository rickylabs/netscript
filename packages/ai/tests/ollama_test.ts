/**
 * Registration, port-conformance, and reachability-preflight tests for the
 * Ollama provider subpath. The reachability probe is exercised with a mocked
 * `fetch` covering the reachable, non-2xx, and network-failure (degraded) paths.
 *
 * @module
 */
import { assert, assertEquals, assertRejects, assertStrictEquals } from '@std/assert';
import '../ollama.ts'; // side effect: self-registers 'ollama'
import {
  DEFAULT_OLLAMA_HOST,
  HttpReachabilityAdapter,
  OLLAMA_PROVIDER_ID,
  OllamaModelProvider,
} from '../ollama.ts';
import { getModelProvider, listModelProviders } from '../mod.ts';
import { AiError } from '../src/contracts/mod.ts';

interface RecordedRequest {
  readonly url: string;
  readonly init?: RequestInit;
}

function recordingFetch(
  responder: (url: string) => Response | Promise<Response>,
): { readonly fetch: typeof fetch; readonly requests: readonly RecordedRequest[] } {
  const requests: RecordedRequest[] = [];
  const fetchMock: typeof fetch = async (input, init) => {
    requests.push({ url: String(input), init });
    return await responder(String(input));
  };
  return { fetch: fetchMock, requests };
}

function throwingFetch(message: string): typeof fetch {
  return () => Promise.reject(new TypeError(message));
}

Deno.test('ollama: importing the subpath self-registers the provider', () => {
  assert(listModelProviders().includes(OLLAMA_PROVIDER_ID));
  const provider = getModelProvider(OLLAMA_PROVIDER_ID, { models: ['llama3.2'] });
  assertEquals(provider.id, 'ollama');
});

Deno.test('ollama: listModels/supports/getModel reflect the configured models', async () => {
  const provider = new OllamaModelProvider({ models: ['llama3.2', 'qwen2.5'] });
  const models = await provider.listModels();
  assertEquals(models.map((m) => m.id), ['llama3.2', 'qwen2.5']);
  assertEquals(models[0]?.provider, 'ollama');
  assert(provider.supports('qwen2.5'));
  const handle = await provider.getModel('llama3.2');
  assertEquals(handle.providerId, 'ollama');
});

Deno.test('ollama: getModel rejects an unknown model when models are configured', async () => {
  const provider = new OllamaModelProvider({ models: ['llama3.2'] });
  assert(!provider.supports('not-a-model'));
  await assertRejects(() => provider.getModel('not-a-model'), AiError);
});

Deno.test('ollama: default host is the local daemon address', () => {
  const provider = new OllamaModelProvider();
  assertEquals(provider.host, DEFAULT_OLLAMA_HOST);
  assertEquals(DEFAULT_OLLAMA_HOST, 'http://localhost:11434');
});

Deno.test('ollama: createChatClient wraps the TanStack client with no reasoning options', () => {
  const provider = new OllamaModelProvider({ models: ['llama3.2'] });
  const client = provider.createChatClient('llama3.2');
  assertEquals(client.kind, 'text');
  assertEquals(client.name, 'ollama');
});

Deno.test('ollama: checkReachable probes GET {host}/api/tags and reports reachable', async () => {
  const mock = recordingFetch(() => new Response('{}', { status: 200 }));
  const provider = new OllamaModelProvider({ fetch: mock.fetch });
  const abort = new AbortController();

  const result = await provider.checkReachable({ signal: abort.signal });

  assertEquals(result, { reachable: true });
  assertEquals(mock.requests[0]?.url, 'http://localhost:11434/api/tags');
  assertEquals(mock.requests[0]?.init?.method, 'GET');
  assertStrictEquals(mock.requests[0]?.init?.signal, abort.signal);
});

Deno.test('ollama: checkReachable reports a non-2xx status as unreachable with detail', async () => {
  const mock = recordingFetch(() => new Response('nope', { status: 503 }));
  const provider = new OllamaModelProvider({
    host: 'http://ollama.example:11434/',
    fetch: mock.fetch,
  });

  const result = await provider.checkReachable();

  assertEquals(result.reachable, false);
  assert(result.detail?.includes('503'));
  assertEquals(mock.requests[0]?.url, 'http://ollama.example:11434/api/tags');
});

Deno.test('ollama: checkReachable degrades (does not throw) when the host is down', async () => {
  const provider = new OllamaModelProvider({ fetch: throwingFetch('connection refused') });

  const result = await provider.checkReachable();

  assertEquals(result.reachable, false);
  assert(result.detail?.includes('connection refused'));
});

Deno.test('ollama: a custom ReachabilityPort overrides the default probe', async () => {
  let seenHost = '';
  const provider = new OllamaModelProvider({
    host: 'http://custom:1234',
    reachability: {
      checkReachable(host) {
        seenHost = host;
        return Promise.resolve({ reachable: false, detail: 'stubbed' });
      },
    },
  });

  const result = await provider.checkReachable();

  assertEquals(seenHost, 'http://custom:1234');
  assertEquals(result, { reachable: false, detail: 'stubbed' });
});

Deno.test('HttpReachabilityAdapter: probes a custom path', async () => {
  const mock = recordingFetch(() => new Response('{}', { status: 200 }));
  const adapter = new HttpReachabilityAdapter({ path: '/v1/models', fetch: mock.fetch });

  const result = await adapter.checkReachable('http://localhost:11434');

  assertEquals(result, { reachable: true });
  assertEquals(mock.requests[0]?.url, 'http://localhost:11434/v1/models');
});
