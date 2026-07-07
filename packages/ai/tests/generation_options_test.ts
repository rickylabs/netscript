/**
 * Per-turn generation-options tests (AI-494).
 *
 * Covers the provider-native mappers for each shipped adapter (Anthropic,
 * OpenAI-compatible, OpenRouter, Ollama), the layered `mergeModelOptions`
 * helper, the reasoning-delta chunk flowing through the agent loop, and the
 * eis-chat-shaped per-message effort picker probe expressed with shipped
 * adapters only.
 *
 * @module
 */

import { assertEquals } from '@std/assert';

import type { GenerationOptions, ReasoningEffort } from '../src/contracts/generation.ts';
import type { ChatClientEvent } from '../src/ports/chat-client.ts';
import type { AgentChunk } from '../src/contracts/chunk.ts';
import { anthropicGenerationModelOptions } from '../src/adapters/anthropic.adapter.ts';
import { openAiCompatibleGenerationModelOptions } from '../src/adapters/openai-compatible.adapter.ts';
import {
  openRouterGenerationModelOptions,
  openRouterReasoningModelOptions,
} from '../src/adapters/openrouter.adapter.ts';
import { ollamaGenerationModelOptions } from '../src/adapters/ollama.adapter.ts';
import { mergeModelOptions } from '../src/adapters/tanstack-chat-client.ts';
import { createAgentLoop } from '../agent.ts';
import { createFakeChatModelProvider } from '../src/testing/mod.ts';

const MODEL = 'anthropic:claude-sonnet-4-5';

async function collect(iterable: AsyncIterable<AgentChunk>): Promise<AgentChunk[]> {
  const chunks: AgentChunk[] = [];
  for await (const chunk of iterable) {
    chunks.push(chunk);
  }
  return chunks;
}

// --- Anthropic mapping -------------------------------------------------------

Deno.test('anthropic: effort tier maps to output_config.effort (never deprecated budget_tokens)', () => {
  assertEquals(anthropicGenerationModelOptions({ reasoningEffort: 'high' }), {
    output_config: { effort: 'high' },
  });
  assertEquals(anthropicGenerationModelOptions({ reasoningEffort: 'low' }), {
    output_config: { effort: 'low' },
  });
});

Deno.test('anthropic: off disables extended thinking; max tokens maps to max_tokens', () => {
  assertEquals(anthropicGenerationModelOptions({ reasoningEffort: 'off' }), {
    thinking: { type: 'disabled' },
  });
  assertEquals(
    anthropicGenerationModelOptions({ reasoningEffort: 'medium', maxOutputTokens: 2_048 }),
    { output_config: { effort: 'medium' }, max_tokens: 2_048 },
  );
  assertEquals(anthropicGenerationModelOptions({}), undefined);
});

// --- OpenAI-compatible mapping -----------------------------------------------

Deno.test('openai-compatible: effort tier maps to flat reasoning_effort', () => {
  assertEquals(openAiCompatibleGenerationModelOptions({ reasoningEffort: 'high' }), {
    reasoning_effort: 'high',
  });
  assertEquals(
    openAiCompatibleGenerationModelOptions({ reasoningEffort: 'low', maxOutputTokens: 512 }),
    { reasoning_effort: 'low', max_tokens: 512 },
  );
});

Deno.test('openai-compatible: off omits reasoning_effort (no disable value on the wire)', () => {
  assertEquals(openAiCompatibleGenerationModelOptions({ reasoningEffort: 'off' }), undefined);
  assertEquals(
    openAiCompatibleGenerationModelOptions({ reasoningEffort: 'off', maxOutputTokens: 64 }),
    { max_tokens: 64 },
  );
  assertEquals(openAiCompatibleGenerationModelOptions({}), undefined);
});

// --- OpenRouter mapping ------------------------------------------------------

Deno.test('openrouter: per-turn options map to top-level reasoning + max_tokens', () => {
  assertEquals(openRouterGenerationModelOptions({ reasoningEffort: 'high' }), {
    reasoning: { effort: 'high' },
  });
  assertEquals(openRouterGenerationModelOptions({ reasoningEffort: 'off' }), {
    reasoning: { enabled: false },
  });
  assertEquals(
    openRouterGenerationModelOptions({ reasoningEffort: 'medium', maxOutputTokens: 128 }),
    { reasoning: { effort: 'medium' }, max_tokens: 128 },
  );
  assertEquals(openRouterGenerationModelOptions({}), undefined);
});

Deno.test('openrouter: reasoning normalizer keeps the legacy tier shape and disables on off', () => {
  assertEquals(openRouterReasoningModelOptions('high'), { reasoning: { effort: 'high' } });
  assertEquals(openRouterReasoningModelOptions('off'), { reasoning: { enabled: false } });
  assertEquals(openRouterReasoningModelOptions(undefined), undefined);
});

// --- Ollama mapping ----------------------------------------------------------

Deno.test('ollama: reasoningEffort is a no-op; only max tokens maps through', () => {
  assertEquals(ollamaGenerationModelOptions({ reasoningEffort: 'high' }), undefined);
  assertEquals(ollamaGenerationModelOptions({ reasoningEffort: 'off' }), undefined);
  assertEquals(
    ollamaGenerationModelOptions({ reasoningEffort: 'high', maxOutputTokens: 256 }),
    { max_tokens: 256 },
  );
  assertEquals(ollamaGenerationModelOptions({}), undefined);
});

// --- Layered merge -----------------------------------------------------------

Deno.test('mergeModelOptions: later layers win and an all-empty merge is undefined', () => {
  assertEquals(mergeModelOptions(undefined, undefined), undefined);
  assertEquals(mergeModelOptions({ a: 1 }, { b: 2 }), { a: 1, b: 2 });
  // Static override, then per-turn normalized, then the raw providerOptions hatch (wins).
  assertEquals(
    mergeModelOptions(
      { reasoning: { effort: 'low' } },
      { reasoning: { effort: 'high' }, max_tokens: 10 },
      { reasoning: { enabled: false } },
    ),
    { reasoning: { enabled: false }, max_tokens: 10 },
  );
});

// --- Reasoning chunk through the loop ----------------------------------------

Deno.test('agent loop: a reasoning event surfaces as a distinct reasoning chunk', async () => {
  const turn: ChatClientEvent[] = [
    { type: 'reasoning', delta: 'let me think' },
    { type: 'text', delta: 'answer' },
    { type: 'finish', finishReason: 'stop' },
  ];
  const provider = createFakeChatModelProvider(MODEL, [turn]);
  const loop = createAgentLoop({ modelProvider: provider });
  const chunks = await collect(loop.run({
    model: MODEL,
    messages: [{ role: 'user', content: 'hi' }],
  }));

  assertEquals(chunks.map((c) => c.type), ['reasoning', 'text', 'message', 'done']);
  const reasoning = chunks[0];
  if (reasoning?.type !== 'reasoning') throw new Error('expected reasoning chunk first');
  assertEquals(reasoning.delta, 'let me think');

  // Reasoning deltas are NOT folded into the committed assistant transcript.
  const message = chunks.find((c) => c.type === 'message');
  if (message?.type !== 'message') throw new Error('expected a message chunk');
  assertEquals(message.message.content, 'answer');
});

// --- eis-chat per-message effort picker probe --------------------------------

Deno.test('probe: eis-chat per-message effort picker threads through shipped adapters', async () => {
  // An eis-chat-shaped UI lets the user pick reasoning effort per message. The
  // picker builds owned, provider-neutral GenerationOptions — no provider SDK.
  const pickEffort = (effort: ReasoningEffort): GenerationOptions => ({
    reasoningEffort: effort,
    maxOutputTokens: 1_024,
  });

  // The same neutral options render natively per shipped provider.
  const perMessage = pickEffort('high');
  assertEquals(anthropicGenerationModelOptions(perMessage), {
    output_config: { effort: 'high' },
    max_tokens: 1_024,
  });
  assertEquals(openAiCompatibleGenerationModelOptions(perMessage), {
    reasoning_effort: 'high',
    max_tokens: 1_024,
  });
  assertEquals(openRouterGenerationModelOptions(perMessage), {
    reasoning: { effort: 'high' },
    max_tokens: 1_024,
  });
  assertEquals(ollamaGenerationModelOptions(perMessage), { max_tokens: 1_024 });

  // And the loop threads the picked options into the chat request verbatim.
  const provider = createFakeChatModelProvider(MODEL, [[{ type: 'finish', finishReason: 'stop' }]]);
  const loop = createAgentLoop({ modelProvider: provider });
  await collect(loop.run({
    model: MODEL,
    messages: [{ role: 'user', content: 'explain carefully' }],
    options: pickEffort('low'),
  }));
  assertEquals(provider.requests[0]?.options, { reasoningEffort: 'low', maxOutputTokens: 1_024 });
});
