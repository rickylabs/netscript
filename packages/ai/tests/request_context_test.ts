/**
 * Per-request application-context tests (#1694).
 *
 * `RequestContext` is the provider-invisible channel: request-local app state
 * that reaches middleware and tool handlers but must never reach the model. The
 * suite proves both halves of that claim.
 *
 * **Negative (the load-bearing one).** Two independent boundaries are checked
 * with the same sentinel string:
 * 1. the real provider wire — a stubbed `fetch` captures the outbound HTTP
 *    request for the shipped OpenAI-compatible and Anthropic adapters, and the
 *    sentinel appears in no URL, header, or body;
 * 2. the TanStack seam — a fake text adapter captures the exact options
 *    `chat()` hands the provider adapter, and the sentinel appears in none of
 *    the four keys that reach a provider (`messages`, `systemPrompts`, `tools`,
 *    `modelOptions`).
 *
 * **Positive.** The context arrives on TanStack's `metadata` (documented as
 * never forwarded onto the provider wire request), on every
 * `ChatClientRequest` the loop issues, on `ToolInvocationOptions.context` for a
 * plain handler, and on `AiToolInvocationContext.metadata` for a definition
 * dispatched through the loop.
 *
 * @module
 */

import { assert, assertEquals } from '@std/assert';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { AnyTextAdapter, StreamChunk } from '@tanstack/ai';

import { createAgentLoop } from '../agent.ts';
import type { RequestContext } from '../agent.ts';
import type { AgentChunk } from '../src/contracts/chunk.ts';
import type {
  ChatClientEvent,
  ChatClientRequest,
  ChatModelProviderPort,
} from '../src/ports/chat-client.ts';
import type { ToolInvocationOptions } from '../src/ports/tool-registry.ts';
import type { AiToolInvocationContext } from '../src/tools/domain/definition.ts';
import { toTanstackChatClient } from '../src/adapters/tanstack-chat-client.ts';
import { AnthropicModelProvider } from '../anthropic.ts';
import { OpenAiCompatibleModelProvider } from '../openai-compatible.ts';
import { withRetryingChatClient } from '../mod.ts';
import { createToolRegistry, defineAiTool } from '../tools.ts';
import { createFakeChatModelProvider, createInMemoryToolRegistry } from '../src/testing/mod.ts';

const MODEL = 'anthropic:claude-sonnet-4-5';

/**
 * A string that exists nowhere else in the package. Any occurrence of it in a
 * provider-bound payload is proof of a leak, whatever shape the leak took.
 */
const SENTINEL = 'ns1730-provider-invisibility-7f3b9d2e-context-must-not-leak';

const CONTEXT: RequestContext = {
  documentIds: [`doc-${SENTINEL}`],
  tenantId: `tenant-${SENTINEL}`,
};

async function collect(iterable: AsyncIterable<AgentChunk>): Promise<AgentChunk[]> {
  const chunks: AgentChunk[] = [];
  for await (const chunk of iterable) {
    chunks.push(chunk);
  }
  return chunks;
}

async function drain(iterable: AsyncIterable<ChatClientEvent>): Promise<void> {
  for await (const _event of iterable) {
    // Only the captured request matters; the response is irrelevant here.
  }
}

// --- Negative: the real provider wire ---------------------------------------

/** One outbound HTTP request captured from the stubbed `fetch`. */
interface CapturedHttpRequest {
  readonly url: string;
  readonly headers: readonly (readonly [string, string])[];
  readonly body: string;
}

/**
 * Run `turn` with `globalThis.fetch` stubbed, returning every outbound request.
 * The stub answers 401 so no provider SDK retries or long-polls.
 */
async function captureHttpRequests(
  turn: () => Promise<void>,
): Promise<CapturedHttpRequest[]> {
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;
  const captured: CapturedHttpRequest[] = [];
  // The provider SDK and the TanStack logger both narrate the rejected call.
  console.error = () => {};
  console.log = () => {};
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    captured.push({
      url: request.url,
      headers: [...request.headers.entries()],
      body: await request.text(),
    });
    return new Response('{"error":{"message":"rejected"}}', {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  };
  try {
    await turn();
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  }
  return captured;
}

/**
 * Assert the sentinel appears in no part of any captured wire request.
 *
 * The `hello` guard is what keeps this from passing vacuously: it proves the
 * captured payload really is the chat request carrying the transcript, not an
 * empty preflight the assertions would trivially clear.
 */
function assertNoSentinelOnWire(captured: readonly CapturedHttpRequest[], label: string): void {
  assert(captured.length > 0, `${label}: expected at least one outbound request to inspect`);
  assert(
    captured.some((request) => request.body.includes('hello')),
    `${label}: no captured request carried the transcript — the check would be vacuous`,
  );
  for (const request of captured) {
    assert(!request.url.includes(SENTINEL), `${label}: context leaked into the request URL`);
    for (const [name, value] of request.headers) {
      assert(
        !value.includes(SENTINEL),
        `${label}: context leaked into request header "${name}"`,
      );
    }
    assert(
      !request.body.includes(SENTINEL),
      `${label}: context leaked into the request body: ${request.body}`,
    );
  }
}

Deno.test({
  name: 'request context: never reaches the OpenAI-compatible provider wire request',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const client = new OpenAiCompatibleModelProvider({
      apiKey: 'test-key',
      baseURL: 'https://provider.example/v1',
    }).createChatClient('some-model');

    const captured = await captureHttpRequests(() =>
      drain(client.stream({
        messages: [{ role: 'user', content: 'hello' }],
        system: 'be brief',
        tools: [{ name: 'echo', description: 'echo', parameters: { type: 'object' } }],
        context: CONTEXT,
      }))
    );

    assertNoSentinelOnWire(captured, 'openai-compatible');
  },
});

Deno.test({
  // This covers direct Anthropic adapter serialization only. The TanStack seam
  // test below owns bridge/modelOptions leakage because this adapter drops
  // model options it does not support.
  name: 'request context: Anthropic adapter omits context from direct wire serialization',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const client = new AnthropicModelProvider({
      apiKey: 'sk-ant-test-key',
      baseURL: 'https://anthropic.example',
    }).createChatClient('claude-sonnet-4-5');

    const captured = await captureHttpRequests(() =>
      drain(client.stream({
        messages: [{ role: 'user', content: 'hello' }],
        system: 'be brief',
        context: CONTEXT,
      }))
    );

    assertNoSentinelOnWire(captured, 'anthropic');
  },
});

// --- The TanStack seam: what `chat()` hands the provider adapter -------------

/** The provider-bound slice of the options a text adapter receives. */
interface CapturedAdapterOptions {
  readonly messages?: unknown;
  readonly systemPrompts?: unknown;
  readonly tools?: unknown;
  readonly modelOptions?: unknown;
  readonly metadata?: unknown;
}

/**
 * A minimal TanStack text adapter that records the options `chat()` hands it and
 * streams nothing. The bridge surfaces whatever `chat()` does with an empty
 * stream; only the captured options are asserted.
 */
function createCapturingTextAdapter(
  sink: CapturedAdapterOptions[],
): AnyTextAdapter {
  return {
    kind: 'text',
    name: 'capturing',
    model: 'capturing-model',
    '~types': {
      providerOptions: {},
      inputModalities: [],
      messageMetadataByModality: {},
      toolCapabilities: [],
      toolCallMetadata: {},
      systemPromptMetadata: {},
    },
    chatStream(options: CapturedAdapterOptions): AsyncIterable<StreamChunk> {
      sink.push({
        messages: options.messages,
        systemPrompts: options.systemPrompts,
        tools: options.tools,
        modelOptions: options.modelOptions,
        metadata: options.metadata,
      });
      return (async function* (): AsyncGenerator<StreamChunk> {})();
    },
    structuredOutput(): Promise<never> {
      return Promise.reject(new Error('structuredOutput is not exercised by this test'));
    },
  };
}

/** Everything in the captured options that a provider actually receives. */
function providerBoundPayload(captured: CapturedAdapterOptions): string {
  return JSON.stringify({
    messages: captured.messages,
    systemPrompts: captured.systemPrompts,
    tools: captured.tools,
    modelOptions: captured.modelOptions,
  });
}

Deno.test('request context: reaches TanStack metadata and none of the provider-bound keys', async () => {
  const captured: CapturedAdapterOptions[] = [];
  const client = toTanstackChatClient(createCapturingTextAdapter(captured), {
    name: 'capturing',
    kind: 'text',
  });

  await drain(client.stream({
    messages: [{ role: 'user', content: 'hello' }],
    system: 'be brief',
    tools: [{ name: 'echo', description: 'echo', parameters: { type: 'object' } }],
    options: { reasoningEffort: 'low' },
    context: CONTEXT,
  }));

  const seen = captured[0];
  assert(seen, 'the adapter should have been called exactly once');

  // Positive: TanStack received the context on its documented non-wire seam.
  assertEquals(seen.metadata, CONTEXT);

  // Negative: nothing provider-bound carries a trace of it.
  const payload = providerBoundPayload(seen);
  assert(
    !payload.includes(SENTINEL),
    `context leaked into a provider-bound option: ${payload}`,
  );
});

Deno.test('request context: omitting it sends no metadata at all', async () => {
  const captured: CapturedAdapterOptions[] = [];
  const client = toTanstackChatClient(createCapturingTextAdapter(captured), {
    name: 'capturing',
    kind: 'text',
  });

  await drain(client.stream({ messages: [{ role: 'user', content: 'hello' }] }));

  assertEquals(captured[0]?.metadata, undefined);
});

// --- Positive: the agent loop threads it to both consumers -------------------

interface RecordingRetryProvider extends ChatModelProviderPort {
  readonly requests: readonly ChatClientRequest[];
}

/** Fail once before output, then answer a tool turn and its continuation. */
function retryThenToolThenTextProvider(): RecordingRetryProvider {
  const requests: ChatClientRequest[] = [];
  let attempt = 0;
  return {
    id: MODEL,
    requests,
    createChatClient() {
      return withRetryingChatClient({
        kind: 'text',
        name: 'recording',
        async *stream(request) {
          requests.push({ ...request, messages: [...request.messages] });
          attempt++;
          if (attempt === 1) throw { status: 429 };
          if (attempt === 2) {
            yield {
              type: 'tool-call',
              toolCall: { id: 'call-1', name: 'echo', arguments: '{"text":"hi"}' },
            };
            yield { type: 'finish', finishReason: 'tool-calls' };
            return;
          }
          yield { type: 'text', delta: 'done' };
          yield { type: 'finish', finishReason: 'stop' };
        },
      }, { maxAttempts: 2, sleep: () => Promise.resolve() });
    },
  };
}

/** Every loop request field that can reach a provider, excluding `context`. */
function loopProviderBoundPayload(request: ChatClientRequest): string {
  return JSON.stringify({
    messages: request.messages,
    system: request.system,
    tools: request.tools,
    options: request.options,
  });
}

/** A scripted two-turn provider: one tool call, then a plain text turn. */
function toolThenTextProvider() {
  return createFakeChatModelProvider(MODEL, [
    [
      { type: 'tool-call', toolCall: { id: 'call-1', name: 'echo', arguments: '{"text":"hi"}' } },
      { type: 'finish', finishReason: 'tool-calls' },
    ],
    [
      { type: 'text', delta: 'done' },
      { type: 'finish', finishReason: 'stop' },
    ],
  ]);
}

Deno.test('agent loop: keeps context out of every provider-bound retry and continuation request', async () => {
  const provider = retryThenToolThenTextProvider();
  const tools = createInMemoryToolRegistry();
  tools.register(
    { name: 'echo', description: 'echo', parameters: { type: 'object' } },
    (call) => ({ toolCallId: call.id, content: 'ok', state: 'complete' }),
  );
  const loop = createAgentLoop({ modelProvider: provider, tools });

  await collect(loop.run({
    model: MODEL,
    messages: [{ role: 'user', content: 'hi' }],
    system: 'be brief',
    tools: [{ name: 'echo', description: 'echo', parameters: { type: 'object' } }],
    options: { reasoningEffort: 'low' },
    context: CONTEXT,
  }));

  assertEquals(provider.requests.length, 3);
  assertEquals(provider.requests[0]?.messages, provider.requests[1]?.messages);
  assert(
    (provider.requests[2]?.messages.length ?? 0) > (provider.requests[1]?.messages.length ?? 0),
    'the third provider call should be the post-tool continuation',
  );
  for (const request of provider.requests) {
    assert(request.context === CONTEXT, 'the provider attempt should retain the run context');
    const payload = loopProviderBoundPayload(request);
    assert(
      !payload.includes(SENTINEL),
      `context leaked into a provider-bound loop request: ${payload}`,
    );
  }
});

Deno.test('agent loop: hands the run context to a plain tool handler', async () => {
  const provider = toolThenTextProvider();
  const tools = createInMemoryToolRegistry();
  let seen: ToolInvocationOptions | undefined;
  tools.register(
    { name: 'echo', description: 'echo', parameters: { type: 'object' } },
    (call, options) => {
      seen = options;
      return { toolCallId: call.id, content: 'ok', state: 'complete' };
    },
  );
  const loop = createAgentLoop({ modelProvider: provider, tools });

  await collect(loop.run({
    model: MODEL,
    messages: [{ role: 'user', content: 'hi' }],
    context: CONTEXT,
  }));

  assertEquals(seen?.context, CONTEXT);
  assert(seen?.signal instanceof AbortSignal, 'the run signal should reach the handler');
});

/** A hand-written Standard Schema validating `{ text: string }`. */
const textSchema: StandardSchemaV1<unknown, { text: string }> = {
  '~standard': {
    version: 1,
    vendor: 'test',
    validate(value: unknown) {
      if (
        typeof value === 'object' && value !== null &&
        typeof (value as { text?: unknown }).text === 'string'
      ) {
        return { value: { text: (value as { text: string }).text } };
      }
      return { issues: [{ message: '"text" must be a string.', path: ['text'] }] };
    },
  },
};

Deno.test('agent loop: lands the run context on AiToolInvocationContext.metadata', async () => {
  let seen: AiToolInvocationContext | undefined;
  const echo = defineAiTool('echo')
    .describe('Echo text back')
    .parameters({ type: 'object', properties: { text: { type: 'string' } }, required: ['text'] })
    .input(textSchema)
    .server((input, context) => {
      seen = context;
      return { echoed: input.text };
    });

  const provider = toolThenTextProvider();
  const loop = createAgentLoop({ modelProvider: provider, tools: createToolRegistry([echo]) });

  await collect(loop.run({
    model: MODEL,
    messages: [{ role: 'user', content: 'hi' }],
    context: CONTEXT,
  }));

  assertEquals(seen?.toolCallId, 'call-1');
  assertEquals(seen?.metadata, CONTEXT);
  assert(seen?.signal instanceof AbortSignal, 'the run signal should reach the definition');
});

Deno.test('agent loop: a run without context leaves the tool invocation context clean', async () => {
  const provider = toolThenTextProvider();
  const tools = createInMemoryToolRegistry();
  let seen: ToolInvocationOptions | undefined;
  tools.register(
    { name: 'echo', description: 'echo', parameters: { type: 'object' } },
    (call, options) => {
      seen = options;
      return { toolCallId: call.id, content: 'ok', state: 'complete' };
    },
  );
  const loop = createAgentLoop({ modelProvider: provider, tools });

  await collect(loop.run({ model: MODEL, messages: [{ role: 'user', content: 'hi' }] }));

  assertEquals(seen?.context, undefined);
  assertEquals(provider.requests[0]?.context, undefined);
});

/**
 * A handler written against the pre-#1694 one-parameter `ToolHandler` shape
 * still satisfies the widened type — the second parameter is additive.
 */
Deno.test('tool registry: single-parameter handlers remain assignable', async () => {
  const provider = toolThenTextProvider();
  const tools = createInMemoryToolRegistry();
  tools.register(
    { name: 'echo', description: 'echo', parameters: { type: 'object' } },
    (call) => ({ toolCallId: call.id, content: 'legacy', state: 'complete' }),
  );
  const loop = createAgentLoop({ modelProvider: provider, tools });

  const chunks = await collect(loop.run({
    model: MODEL,
    messages: [{ role: 'user', content: 'hi' }],
    context: CONTEXT,
  }));

  const result = chunks.find((chunk) => chunk.type === 'tool-result');
  assert(result?.type === 'tool-result');
  assertEquals(result.result.content, 'legacy');
});
