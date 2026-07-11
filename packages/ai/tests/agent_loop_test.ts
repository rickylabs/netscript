/**
 * Tests for the E3 agent loop: `createAgentLoop`, the sliding-window history
 * strategy, and the typestate/terminal semantics.
 *
 * All collaborators are injected fakes (A10) — no provider SDK is imported.
 *
 * @module
 */

import { assert, assertEquals, assertInstanceOf } from '@std/assert';

import {
  AgentMaxStepsExceededError,
  createAgentLoop,
  slidingWindowHistory,
  tokenBudgetHistory,
} from '../agent.ts';
import type { AgentLoopInput } from '../agent.ts';
import type { ChatClientEvent } from '../src/ports/chat-client.ts';
import type { AgentChunk } from '../src/contracts/chunk.ts';
import type { Message } from '../src/contracts/message.ts';
import {
  createFakeChatModelProvider,
  createFakeTelemetryPort,
  createInMemoryToolRegistry,
} from '../src/testing/mod.ts';

const MODEL = 'anthropic:claude-sonnet-4-5';

async function collect(
  iterable: AsyncIterable<AgentChunk>,
): Promise<AgentChunk[]> {
  const chunks: AgentChunk[] = [];
  for await (const chunk of iterable) {
    chunks.push(chunk);
  }
  return chunks;
}

function userInput(text: string): AgentLoopInput {
  return { model: MODEL, messages: [{ role: 'user', content: text }] };
}

Deno.test('agent loop: single text turn transitions idle -> running -> done', async () => {
  const provider = createFakeChatModelProvider(MODEL, [[
    { type: 'text', delta: 'Hello' },
    {
      type: 'finish',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      finishReason: 'stop',
    },
  ]]);
  const loop = createAgentLoop({ modelProvider: provider });
  assertEquals(loop.state, 'idle');

  const chunks = await collect(loop.run(userInput('hi')));

  assertEquals(loop.state, 'done');
  assertEquals(chunks.map((c) => c.type), ['text', 'usage', 'message', 'done']);

  const text = chunks[0];
  assert(text && text.type === 'text');
  assertEquals(text.delta, 'Hello');

  const done = chunks.at(-1);
  assert(done?.type === 'done');
  assertEquals(done.usage, { promptTokens: 10, completionTokens: 5, totalTokens: 15 });

  // resolveModelId strips the provider prefix.
  assertEquals(provider.modelIds, ['claude-sonnet-4-5']);
});

Deno.test('agent loop: records model spans through the injected telemetry port', async () => {
  const provider = createFakeChatModelProvider(MODEL, [[
    { type: 'text', delta: 'Hello' },
    {
      type: 'finish',
      usage: { promptTokens: 2, completionTokens: 3, totalTokens: 5 },
      finishReason: 'stop',
    },
  ]]);
  const telemetry = createFakeTelemetryPort();
  const loop = createAgentLoop({ modelProvider: provider, telemetry });

  await collect(loop.run(userInput('hi')));

  assertEquals(
    telemetry.records.filter((record) => record.kind === 'span').map((record) => record.name),
    ['gen_ai.chat', 'gen_ai.chat.turn'],
  );
  assertEquals(telemetry.records[0]?.attributes?.['gen_ai.provider.name'], MODEL);
  assertEquals(telemetry.records[0]?.attributes?.['gen_ai.operation.name'], 'chat');
});

Deno.test('agent loop: tool call round-trips through the injected registry', async () => {
  const provider = createFakeChatModelProvider(MODEL, [
    [
      { type: 'tool-call', toolCall: { id: 'c1', name: 'echo', arguments: '{"v":1}' } },
      {
        type: 'finish',
        usage: { promptTokens: 8, completionTokens: 2, totalTokens: 10 },
        finishReason: 'tool-calls',
      },
    ],
    [
      { type: 'text', delta: 'final' },
      {
        type: 'finish',
        usage: { promptTokens: 4, completionTokens: 1, totalTokens: 5 },
        finishReason: 'stop',
      },
    ],
  ]);

  const tools = createInMemoryToolRegistry();
  let handledArguments = '';
  tools.register(
    { name: 'echo', description: 'echo', parameters: { type: 'object' } },
    (call) => {
      handledArguments = call.arguments;
      return { toolCallId: call.id, content: 'echoed', state: 'complete' };
    },
  );

  const loop = createAgentLoop({ modelProvider: provider, tools });
  const chunks = await collect(loop.run({
    ...userInput('call echo'),
    tools: [{ name: 'echo', description: 'echo', parameters: { type: 'object' } }],
  }));

  assertEquals(loop.state, 'done');
  assertEquals(handledArguments, '{"v":1}');

  const types = chunks.map((c) => c.type);
  assertEquals(types, [
    'tool-call',
    'usage',
    'message',
    'tool-result',
    'text',
    'usage',
    'message',
    'done',
  ]);

  const toolResult = chunks.find((c) => c.type === 'tool-result');
  assert(toolResult?.type === 'tool-result');
  assertEquals(toolResult.result.content, 'echoed');

  // Real usage is summed across both turns (never estimated).
  const done = chunks.at(-1);
  assert(done?.type === 'done');
  assertEquals(done.usage, { promptTokens: 12, completionTokens: 3, totalTokens: 15 });

  // The second turn's request carries the appended tool-result message.
  assertEquals(provider.requests.length, 2);
  const secondTurn = provider.requests[1];
  assert(secondTurn);
  assert(secondTurn.messages.some((m) => m.role === 'tool' && m.toolCallId === 'c1'));
});

Deno.test('agent loop: a missing tool handler yields an error result but keeps looping', async () => {
  const provider = createFakeChatModelProvider(MODEL, [
    [
      { type: 'tool-call', toolCall: { id: 'x', name: 'nope', arguments: '{}' } },
      { type: 'finish', finishReason: 'tool-calls' },
    ],
    [
      { type: 'text', delta: 'recovered' },
      { type: 'finish', finishReason: 'stop' },
    ],
  ]);
  const loop = createAgentLoop({ modelProvider: provider, tools: createInMemoryToolRegistry() });
  const chunks = await collect(loop.run(userInput('go')));

  assertEquals(loop.state, 'done');
  const result = chunks.find((c) => c.type === 'tool-result');
  assert(result?.type === 'tool-result');
  assertEquals(result.result.state, 'error');
});

Deno.test('agent loop: exceeding maxSteps settles in errored with AgentMaxStepsExceededError', async () => {
  const toolTurn: ChatClientEvent[] = [
    { type: 'tool-call', toolCall: { id: 'c', name: 'echo', arguments: '{}' } },
    { type: 'finish', finishReason: 'tool-calls' },
  ];
  const provider = createFakeChatModelProvider(MODEL, [toolTurn, toolTurn, toolTurn]);
  const tools = createInMemoryToolRegistry();
  tools.register(
    { name: 'echo', description: 'echo', parameters: { type: 'object' } },
    (call) => ({ toolCallId: call.id, content: 'ok', state: 'complete' }),
  );

  const loop = createAgentLoop({ modelProvider: provider, tools });
  const chunks = await collect(loop.run(userInput('loop forever'), { maxSteps: 2 }));

  assertEquals(loop.state, 'errored');
  const error = chunks.find((c) => c.type === 'error');
  assert(error?.type === 'error');
  assertInstanceOf(error.cause, AgentMaxStepsExceededError);
  assertEquals(error.cause.maxSteps, 2);
  assertEquals(chunks.at(-1)?.type, 'done');
});

Deno.test('agent loop: an already-aborted signal settles in aborted immediately', async () => {
  const provider = createFakeChatModelProvider(MODEL, [[
    { type: 'text', delta: 'never' },
    { type: 'finish', finishReason: 'stop' },
  ]]);
  const loop = createAgentLoop({ modelProvider: provider });
  const chunks = await collect(loop.run(userInput('hi'), { signal: AbortSignal.abort() }));

  assertEquals(loop.state, 'aborted');
  assertEquals(chunks.map((c) => c.type), ['done']);
});

Deno.test('agent loop: stop() during a run unwinds to the aborted terminal state', async () => {
  const toolTurn: ChatClientEvent[] = [
    { type: 'tool-call', toolCall: { id: 'c', name: 'echo', arguments: '{}' } },
    { type: 'finish', finishReason: 'tool-calls' },
  ];
  const provider = createFakeChatModelProvider(MODEL, [toolTurn, toolTurn, toolTurn]);
  const tools = createInMemoryToolRegistry();
  tools.register(
    { name: 'echo', description: 'echo', parameters: { type: 'object' } },
    (call) => ({ toolCallId: call.id, content: 'ok', state: 'complete' }),
  );
  const loop = createAgentLoop({ modelProvider: provider, tools });

  const chunks: AgentChunk[] = [];
  for await (const chunk of loop.run(userInput('go'))) {
    chunks.push(chunk);
    if (chunk.type === 'tool-call') {
      loop.stop();
    }
  }

  assertEquals(loop.state, 'aborted');
  assertEquals(chunks.at(-1)?.type, 'done');
});

Deno.test('slidingWindowHistory: keeps leading system messages plus the most recent N', () => {
  const system: Message = { role: 'system', content: 'be helpful' };
  const history: Message[] = [
    system,
    { role: 'user', content: 'm1' },
    { role: 'assistant', content: 'm2' },
    { role: 'user', content: 'm3' },
    { role: 'assistant', content: 'm4' },
  ];
  const windowed = slidingWindowHistory({ maxMessages: 2 }).apply(history);

  assertEquals(windowed.length, 3);
  assertEquals(windowed[0], system);
  assertEquals(windowed.map((m) => m.content), ['be helpful', 'm3', 'm4']);
});

Deno.test('slidingWindowHistory: returns the input unchanged when within the window', () => {
  const history: Message[] = [
    { role: 'user', content: 'a' },
    { role: 'assistant', content: 'b' },
  ];
  assertEquals(slidingWindowHistory({ maxMessages: 5 }).apply(history), history);
});

Deno.test('tokenBudgetHistory: respects the default character budget and keeps newest messages', () => {
  const history: Message[] = [
    { role: 'user', content: '1111' },
    { role: 'assistant', content: '22222222' },
    { role: 'user', content: '3333' },
  ];

  const bounded = tokenBudgetHistory({ budget: 3 }).apply(history);

  assertEquals(bounded.map((message) => message.content), ['22222222', '3333']);
});

Deno.test('tokenBudgetHistory: preserves all leading system messages', () => {
  const history: Message[] = [
    { role: 'system', content: 'first' },
    { role: 'system', content: 'second' },
    { role: 'user', content: 'older' },
    { role: 'assistant', content: 'newer' },
  ];

  const bounded = tokenBudgetHistory({ budget: 6 }).apply(history);

  assertEquals(bounded.map((message) => message.content), ['first', 'second', 'newer']);
});

Deno.test('tokenBudgetHistory: honors a custom estimator', () => {
  const history: Message[] = [
    { role: 'user', content: 'old' },
    { role: 'assistant', content: 'middle' },
    { role: 'user', content: 'new' },
  ];
  const costs = new Map([['old', 4], ['middle', 2], ['new', 1]]);

  const bounded = tokenBudgetHistory({
    budget: 3,
    estimator: (message) => costs.get(String(message.content)) ?? 0,
  }).apply(history);

  assertEquals(bounded.map((message) => message.content), ['middle', 'new']);
});

Deno.test('tokenBudgetHistory: zero budget retains only zero-cost newest messages', () => {
  const history: Message[] = [
    { role: 'user', content: 'costly' },
    { role: 'assistant', content: '' },
  ];

  assertEquals(tokenBudgetHistory({ budget: 0 }).apply(history), [history[1]!]);
});

Deno.test('tokenBudgetHistory: tiny budgets preserve system framing even when it exceeds budget', () => {
  const system: Message = { role: 'system', content: 'long system framing' };
  const history: Message[] = [
    system,
    { role: 'user', content: 'x' },
  ];

  assertEquals(tokenBudgetHistory({ budget: 1 }).apply(history), [system]);
});
