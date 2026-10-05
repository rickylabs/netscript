/** Explicit Anthropic model IDs and Messages transport regressions. @module */

import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert';
import { ANTHROPIC_MODELS } from '@tanstack/ai-anthropic';
import { AnthropicModelProvider } from '../anthropic.ts';
import { AiError, getModel, getModelProvider } from '../mod.ts';
import { InvalidModelOptionsError } from '../src/contracts/errors.ts';
import type { ToolDescriptor } from '../src/contracts/tool.ts';
import type {
  ChatClientCallOptions,
  ChatClientEvent,
  ChatClientPort,
  ChatClientRequest,
} from '../src/ports/chat-client.ts';

const FUTURE_MODEL = 'claude-future-test';

Deno.test('anthropic: configured IDs work consistently offline without mutating the catalog', async () => {
  const catalog = [...ANTHROPIC_MODELS];
  const configured = [FUTURE_MODEL, 'claude-opus-5-5', 'claude-fable-5-1', FUTURE_MODEL];
  const config = { apiKey: 'test-key', models: configured };
  const provider = new AnthropicModelProvider(config);
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = () => {
    requests++;
    throw new Error('discovery must stay offline');
  };
  try {
    const ids = (await provider.listModels()).map((model) => model.id);
    assertEquals(ids.length, new Set(ids).size);
    for (const id of [...catalog, 'claude-sonnet-5-5', ...configured]) {
      assert(provider.supports(id), `explicitly configured model ${id} must be supported`);
      assert(ids.includes(id));
      assertEquals((await provider.getModel(id)).descriptor.id, id);
      assertEquals(provider.createChatClient(id).name, 'anthropic');
    }
    assertEquals((await provider.getModel(FUTURE_MODEL)).descriptor.capabilities, undefined);
    assert(!new AnthropicModelProvider().supports(FUTURE_MODEL));
    assert(!provider.supports('unconfigured-model'));
    await assertRejects(() => provider.getModel('unconfigured-model'), AiError);
    assertThrows(() => provider.createChatClient('unconfigured-model'), AiError);
    configured.push('added-after-construction');
    assert(!provider.supports('added-after-construction'));
    assertEquals([...ANTHROPIC_MODELS], catalog);
    assertEquals(requests, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test('anthropic: registered public provider config preserves additive IDs', async () => {
  const config = { models: [FUTURE_MODEL] };
  const provider = getModelProvider('anthropic', config);
  assert(provider.supports(FUTURE_MODEL));
  assertEquals((await getModel(`anthropic:${FUTURE_MODEL}`, config)).descriptor.id, FUTURE_MODEL);
  assert(!getModelProvider('anthropic').supports(FUTURE_MODEL));
});

Deno.test('anthropic: malformed public ID configuration fails without echoing values', () => {
  for (const models of ['test-secret', [null], [42], [''], [' padded'], ['padded ']]) {
    const error = assertThrows(() => getModelProvider('anthropic', { models }), AiError);
    assert(!error.message.includes('test-secret'));
  }
});

interface WireRequest {
  readonly url: string;
  readonly headers: Headers;
  readonly body: Readonly<Record<string, unknown>>;
  readonly signal: AbortSignal;
}

async function collect(
  client: ChatClientPort,
  request: ChatClientRequest = { messages: [{ role: 'user', content: 'hello' }] },
  options?: ChatClientCallOptions,
): Promise<ChatClientEvent[]> {
  const events: ChatClientEvent[] = [];
  for await (const event of client.stream(request, options)) events.push(event);
  return events;
}

function messageStream(
  model: string,
  withTool = false,
  usageFrames: {
    readonly start?: Readonly<Record<string, unknown>> | null;
    readonly interim?: Readonly<Record<string, unknown>>;
    readonly final?: Readonly<Record<string, unknown>> | null;
  } = {},
): Response {
  const frames: Readonly<Record<string, unknown>>[] = [
    {
      type: 'message_start',
      message: {
        id: 'msg_test',
        type: 'message',
        role: 'assistant',
        model,
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: usageFrames.start === undefined
          ? { input_tokens: 3, output_tokens: 1 }
          : usageFrames.start ?? undefined,
      },
    },
    { type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '' } },
    {
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'thinking_delta', thinking: 'consider' },
    },
    {
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'signature_delta', signature: 'test-signature' },
    },
    { type: 'content_block_stop', index: 0 },
    { type: 'content_block_start', index: 1, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: 'answer' } },
    { type: 'content_block_stop', index: 1 },
  ];
  if (withTool) {
    frames.push(
      {
        type: 'content_block_start',
        index: 2,
        content_block: { type: 'tool_use', id: 'tool_test', name: 'lookup', input: {} },
      },
      {
        type: 'content_block_delta',
        index: 2,
        delta: { type: 'input_json_delta', partial_json: '{"q":' },
      },
      {
        type: 'content_block_delta',
        index: 2,
        delta: { type: 'input_json_delta', partial_json: '"test"}' },
      },
      { type: 'content_block_stop', index: 2 },
    );
  }
  if (usageFrames.interim !== undefined) {
    frames.push({
      type: 'message_delta',
      delta: { stop_reason: null, stop_sequence: null },
      usage: usageFrames.interim,
    });
  }
  frames.push(
    {
      type: 'message_delta',
      delta: { stop_reason: withTool ? 'tool_use' : 'end_turn', stop_sequence: null },
      usage: usageFrames.final === undefined
        ? { output_tokens: 8 }
        : usageFrames.final ?? undefined,
    },
    { type: 'message_stop' },
  );
  return new Response(
    frames.map((frame) => `event: ${frame.type}\ndata: ${JSON.stringify(frame)}\n\n`).join(''),
    { headers: { 'content-type': 'text/event-stream' } },
  );
}

async function withMessagesTransport(
  run: (requests: WireRequest[]) => Promise<void>,
  respond: (request: WireRequest) => Response = (request) =>
    messageStream(String(request.body.model)),
): Promise<void> {
  const originalFetch = globalThis.fetch;
  const originalLog = console.log;
  const originalError = console.error;
  const originalDebug = console.debug;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const requests: WireRequest[] = [];
  const logs: unknown[][] = [];
  console.log = (...args) => logs.push(args);
  console.error = (...args) => logs.push(args);
  console.debug = (...args) => logs.push(args);
  console.info = (...args) => logs.push(args);
  console.warn = (...args) => logs.push(args);
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const wire = {
      url: request.url,
      headers: request.headers,
      signal: request.signal,
      body: JSON.parse(await request.text()),
    };
    requests.push(wire);
    return respond(wire);
  };
  try {
    await run(requests);
    for (const key of ['test-static-key', 'test-request-key', 'test-env-key']) {
      assert(!JSON.stringify(logs).includes(key));
    }
  } finally {
    globalThis.fetch = originalFetch;
    console.log = originalLog;
    console.error = originalError;
    console.debug = originalDebug;
    console.info = originalInfo;
    console.warn = originalWarn;
  }
}

Deno.test({
  name:
    'anthropic: selected additive ID, native options and request credentials reach Messages unchanged',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await withMessagesTransport(async (requests) => {
      for (
        const model of ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-fable-5-1', FUTURE_MODEL]
      ) {
        const client = new AnthropicModelProvider({
          apiKey: 'test-static-key',
          baseURL: 'https://static.example.test',
          models: [model],
        }).createChatClient(model);
        const events = await collect(client, {
          messages: [{ role: 'user', content: 'hello' }],
          options: { reasoningEffort: 'medium', maxOutputTokens: 4096 },
        }, {
          connection: { apiKey: 'test-request-key', baseURL: 'https://request.example.test' },
          modelOptions: { output_config: { effort: 'high' }, tool_choice: { type: 'auto' } },
        });
        const wire = requests.at(-1)!;
        const url = new URL(wire.url);
        assertEquals(url.origin, 'https://request.example.test');
        assertEquals(url.pathname, '/v1/messages');
        assertEquals(wire.headers.get('x-api-key'), 'test-request-key');
        assertEquals(wire.body.model, model);
        assertEquals(wire.body.max_tokens, 4096);
        assertEquals(wire.body.output_config, { effort: 'high' });
        assertEquals(wire.body.tool_choice, { type: 'auto' });
        assertEquals(wire.body.thinking, undefined);
        assertEquals(wire.body.stream, true);
        assert(events.some((event) => event.type === 'reasoning' && event.delta === 'consider'));
        assert(events.some((event) => event.type === 'text' && event.delta === 'answer'));
        const finish = events.find((event) => event.type === 'finish');
        assert(finish?.type === 'finish');
        assertEquals(finish.finishReason, 'stop');
        assertEquals(finish.usage?.promptTokens, 3);
        assertEquals(finish.usage?.completionTokens, 8);
      }
      assertEquals(requests.length, 4);
    });
  },
});

Deno.test({
  name: 'anthropic: split cumulative usage preserves caches and remains isolated per turn',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await withMessagesTransport(
      async () => {
        const client = new AnthropicModelProvider({
          apiKey: 'test-static-key',
          models: ['claude-opus-5-5'],
        }).createChatClient('claude-opus-5-5');
        const first = (await collect(client)).find((event) => event.type === 'finish');
        assert(first?.type === 'finish');
        assertEquals(first.usage, {
          promptTokens: 6,
          completionTokens: 8,
          totalTokens: 14,
          promptTokensDetails: { cacheWriteTokens: 4, cachedTokens: 7 },
          providerUsageDetails: {
            serverToolUse: { webSearchRequests: 2, webFetchRequests: 1 },
          },
        });
        const second = (await collect(client)).find((event) => event.type === 'finish');
        assert(second?.type === 'finish');
        assertEquals(second.usage, { promptTokens: 9, completionTokens: 4, totalTokens: 13 });
        const third = (await collect(client)).find((event) => event.type === 'finish');
        assert(third?.type === 'finish');
        assertEquals(third.usage, undefined);
      },
      (() => {
        let turn = 0;
        return (wire) => {
          turn++;
          return messageStream(
            String(wire.body.model),
            false,
            turn === 1
              ? {
                start: {
                  input_tokens: 3,
                  output_tokens: 1,
                  cache_creation_input_tokens: 4,
                  cache_read_input_tokens: 5,
                  server_tool_use: { web_search_requests: 1, web_fetch_requests: 1 },
                  unrelated: 'test-usage-field-must-not-escape',
                },
                interim: {
                  input_tokens: 6,
                  output_tokens: 4,
                  cache_read_input_tokens: 7,
                  server_tool_use: { web_search_requests: 2 },
                },
                final: { output_tokens: 8 },
              }
              : turn === 2
              ? { start: { input_tokens: 9, output_tokens: 1 }, final: { output_tokens: 4 } }
              : { start: null, final: null },
          );
        };
      })(),
    );
  },
});

Deno.test({
  name:
    'anthropic: off follows exact model thinking semantics and native effort levels are retained',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await withMessagesTransport(async (requests) => {
      for (
        const model of ['claude-opus-5-5', 'claude-fable-5-1', 'claude-sonnet-5-5', FUTURE_MODEL]
      ) {
        const client = new AnthropicModelProvider({ apiKey: 'test-static-key', models: [model] })
          .createChatClient(model);
        await collect(client, {
          messages: [{ role: 'user', content: 'hello' }],
          options: { reasoningEffort: 'off' },
        });
        assertEquals(
          requests.at(-1)!.body.thinking,
          model === 'claude-sonnet-5-5'
            ? { type: 'between_tools' }
            : model === FUTURE_MODEL
            ? { type: 'disabled' }
            : undefined,
        );
        if (model !== FUTURE_MODEL) {
          for (const effort of ['low', 'medium', 'high', 'xhigh', 'max']) {
            await collect(client, undefined, {
              modelOptions: {
                thinking: { type: 'adaptive' },
                output_config: { effort },
                tool_choice: 'none',
              },
            });
            assertEquals(requests.at(-1)!.body.output_config, { effort });
            assertEquals(requests.at(-1)!.body.thinking, { type: 'adaptive' });
            assertEquals(requests.at(-1)!.body.tool_choice, { type: 'none' });
          }
        }
      }
    });
  },
});

Deno.test('anthropic: effective options reject incompatible current-model settings before IO', async () => {
  await withMessagesTransport(async (requests) => {
    const invalid = [
      { thinking: { type: 'disabled' } },
      { thinking: { type: 'enabled', budget_tokens: 2048 } },
      { thinking: { type: 'adaptive', budget_tokens: 2048 } },
      { tool_choice: { type: 'any' } },
      { tool_choice: { type: 'tool', name: 'lookup' } },
      { tool_choice: 'any' },
      { output_config: { effort: 'invented' } },
      { temperature: 0.5 },
      { top_p: 0.5 },
      { top_k: 3 },
    ];
    for (const model of ['claude-opus-5-5', 'claude-fable-5-1', 'claude-sonnet-5-5']) {
      const client = new AnthropicModelProvider({ apiKey: 'test-static-key', models: [model] })
        .createChatClient(model);
      for (const modelOptions of invalid) {
        await assertRejects(
          () => collect(client, undefined, { modelOptions }),
          InvalidModelOptionsError,
        );
        await assertRejects(() =>
          collect(client, {
            messages: [{ role: 'user', content: 'hello' }],
            options: { providerOptions: modelOptions },
          }), InvalidModelOptionsError);
      }
    }
    const sonnet = new AnthropicModelProvider({ apiKey: 'test-static-key' })
      .createChatClient('claude-sonnet-5-5');
    for (
      const modelOptions of [
        { thinking: { type: 'between_tools' }, output_config: { effort: 'xhigh' } },
        { thinking: { type: 'between_tools', display: 'summarized' } },
      ]
    ) {
      await assertRejects(
        () => collect(sonnet, undefined, { modelOptions }),
        InvalidModelOptionsError,
      );
    }
    assertEquals(requests.length, 0);
  });
});

Deno.test({
  name:
    'anthropic: valid call override is checked after merge and bundled legacy models remain supported',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await withMessagesTransport(async (requests) => {
      const client = new AnthropicModelProvider({
        apiKey: 'test-static-key',
        models: ['claude-opus-5-5'],
      })
        .createChatClient('claude-opus-5-5');
      await collect(client, {
        messages: [{ role: 'user', content: 'hello' }],
        options: { providerOptions: { thinking: { type: 'disabled' } } },
      }, { modelOptions: { thinking: { type: 'adaptive' } } });
      assertEquals(requests.at(-1)!.body.thinking, { type: 'adaptive' });
      await collect(
        new AnthropicModelProvider({ apiKey: 'test-static-key' })
          .createChatClient('claude-sonnet-4-5'),
        {
          messages: [{ role: 'user', content: 'hello' }],
          options: { reasoningEffort: 'off' },
        },
      );
      assertEquals(requests.at(-1)!.body.model, 'claude-sonnet-4-5');
      assertEquals(requests.at(-1)!.body.thinking, { type: 'disabled' });
    });
  },
});

Deno.test({
  name: 'anthropic: additive clients preserve streamed tools and tool-result messages',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await withMessagesTransport(async (requests) => {
      const client = new AnthropicModelProvider({
        apiKey: 'test-static-key',
        models: [FUTURE_MODEL],
      })
        .createChatClient(FUTURE_MODEL);
      const tools: ToolDescriptor[] = [{
        name: 'lookup',
        description: 'look up a value',
        parameters: { type: 'object', properties: { q: { type: 'string' } } },
      }];
      const first = await collect(client, {
        messages: [{ role: 'user', content: 'hello' }],
        tools,
      });
      const call = first.find((event) => event.type === 'tool-call');
      assert(call?.type === 'tool-call');
      assertEquals(call.toolCall, { id: 'tool_test', name: 'lookup', arguments: '{"q":"test"}' });
      const finish = first.find((event) => event.type === 'finish');
      assert(finish?.type === 'finish');
      assertEquals(finish.finishReason, 'tool-calls');
      await collect(client, {
        tools,
        messages: [
          { role: 'user', content: 'hello' },
          { role: 'assistant', content: '', toolCalls: [call.toolCall] },
          { role: 'tool', toolCallId: call.toolCall.id, content: 'found' },
        ],
      });
      assert(JSON.stringify(requests.at(-1)!.body.messages).includes('tool_result'));
      assert(JSON.stringify(requests.at(-1)!.body.messages).includes('found'));
      assert(JSON.stringify(requests[0]!.body.tools).includes('lookup'));
      assertEquals(requests.length, 2);
    }, (request) => messageStream(String(request.body.model), true));
  },
});

Deno.test({
  name:
    'anthropic: additive clients preserve static/environment credentials and safe provider errors',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const priorKey = Deno.env.get('ANTHROPIC_API_KEY');
    Deno.env.set('ANTHROPIC_API_KEY', 'test-env-key');
    try {
      await withMessagesTransport(
        async (requests) => {
          for (const apiKey of ['test-static-key', undefined]) {
            const client = new AnthropicModelProvider({ apiKey, models: [FUTURE_MODEL] })
              .createChatClient(FUTURE_MODEL);
            const events = await collect(client);
            assert(events.some((event) => event.type === 'error'));
            for (const key of ['test-static-key', 'test-env-key']) {
              assert(!JSON.stringify(events).includes(key));
            }
            assertEquals(requests.at(-1)!.headers.get('x-api-key'), apiKey ?? 'test-env-key');
          }
        },
        () =>
          new Response('{"error":{"type":"authentication_error","message":"test rejection"}}', {
            status: 401,
            headers: { 'content-type': 'application/json' },
          }),
      );
    } finally {
      if (priorKey === undefined) Deno.env.delete('ANTHROPIC_API_KEY');
      else Deno.env.set('ANTHROPIC_API_KEY', priorKey);
    }
  },
});

Deno.test({
  name: 'anthropic: additive client abort cancels the transport and pre-abort makes no request',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await withMessagesTransport(async (requests) => {
      const client = new AnthropicModelProvider({
        apiKey: 'test-static-key',
        models: [FUTURE_MODEL],
      })
        .createChatClient(FUTURE_MODEL);
      const before = new AbortController();
      before.abort();
      assertEquals(await collect(client, undefined, { signal: before.signal }), []);
      assertEquals(requests.length, 0);
      const abort = new AbortController();
      for await (
        const event of client.stream({ messages: [{ role: 'user', content: 'hello' }] }, {
          signal: abort.signal,
        })
      ) {
        if (event.type === 'reasoning') abort.abort();
      }
      assertEquals(requests.length, 1);
      assert(requests[0]!.signal.aborted);
    });
  },
});
