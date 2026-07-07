import { assert, assertEquals } from '@std/assert';
import type {
  ChatChunk,
  ChatInput,
  EmbedInput,
  EmbedResponse,
  ModelsResponse,
  ReasoningChunk,
  ToolInvokeResponse,
  TranscribeResponse,
} from '../../src/contracts/v1/mod.ts';
import { ChatChunkSchema } from '../../src/contracts/v1/mod.ts';
import { aiContractV1, createAiRouter } from '../../mod.ts';

// Type-level soundness assertions for the precise AI contract.
// Each `@ts-expect-error` must stay an error; otherwise the contract surface has
// been loosened back to `any`/`unknown` in a way the compiler can no longer guard.

const _validChatInput = {
  model: 'anthropic:claude-sonnet-4-5',
  messages: [{ role: 'user', content: 'hello' }],
} satisfies ChatInput;

const _badChatInput: ChatInput = {
  model: 'anthropic:claude-sonnet-4-5',
  messages: [
    {
      // @ts-expect-error - role must be a MessageRole
      role: 'visitor',
      content: 'hello',
    },
  ],
};

const _badModelsResponse: ModelsResponse = {
  models: [{
    id: 'claude',
    // @ts-expect-error - provider must be a string
    provider: 123,
  }],
};

const _badToolResponse: ToolInvokeResponse = {
  content: 'ok',
  // @ts-expect-error - state must be complete/error
  state: 'pending',
};

const _validEmbedInput = {
  model: { provider: 'demo', model: 'embed' },
  input: ['one', 'two'],
} satisfies EmbedInput;

const _badEmbedResponse: EmbedResponse = {
  // @ts-expect-error - embeddings must be arrays of numbers
  embeddings: [['not-a-number']],
};

const _badTranscribeResponse: TranscribeResponse = {
  // @ts-expect-error - text must be a string
  text: 42,
};

const _router = createAiRouter({
  describe: () => ({
    pluginName: '@netscript/plugin-ai',
    contractVersions: ['v1'],
    routeGroups: ['ai'],
    capabilities: ['chat'],
  }),
  async *chat() {
    yield { type: 'done' as const };
  },
  models: () => ({ models: [] }),
  invokeTool: () => ({ content: 'No tools registered.', state: 'error' as const }),
  embed: () => ({ embeddings: [] }),
  transcribe: () => ({ text: '' }),
});

const _validReasoningChunk = {
  type: 'reasoning',
  delta: 'thinking...',
} satisfies ReasoningChunk;

const _reasoningIsChatChunk: ChatChunk = _validReasoningChunk;

Deno.test('chat chunk schema validates the reasoning-delta frame (lockstep with @netscript/ai)', () => {
  const parsed = ChatChunkSchema.parse(_validReasoningChunk);
  assertEquals(parsed, { type: 'reasoning', delta: 'thinking...' });
  assert(!ChatChunkSchema.safeParse({ type: 'reasoning' }).success);
  assertEquals(_reasoningIsChatChunk.type, 'reasoning');
});

Deno.test('ai contract exposes a precise, non-loosened type surface', () => {
  assertEquals(typeof aiContractV1.chat, 'object');
  assertEquals(typeof aiContractV1.models, 'object');
  assertEquals(_validChatInput.model, 'anthropic:claude-sonnet-4-5');
  assertEquals(_badChatInput.messages[0]?.role as unknown, 'visitor');
  assertEquals(_badModelsResponse.models[0]?.provider as unknown, 123);
  assertEquals(_badToolResponse.state as unknown, 'pending');
  assertEquals(_validEmbedInput.input.length, 2);
  assertEquals(_badEmbedResponse.embeddings[0]?.[0] as unknown, 'not-a-number');
  assertEquals(_badTranscribeResponse.text as unknown, 42);
  assertEquals(typeof _router.chat, 'object');
});
