/** Type-checked source stub for the generated in-process AI stream route.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/**
 * App-owned, **in-process** AI stream route. This is NOT a network gateway hop:
 * the handler calls `@netscript/ai` directly inside the app's Fresh server, then
 * hands the token stream to `@netscript/fresh/ai`'s `toNetScriptChatResponse` for
 * durable-session persistence. It propagates the request's `AbortSignal` into the
 * model call and exposes a `stop()` on the connection so a client can cancel a
 * generation mid-stream (F-13).
 */
export const streamProxyStub: StubSource<never> = defineStub({
  source: `/** In-process AI stream route (POST). Runs the agent loop directly; no gateway hop. */

import { createAiRouter, aiContractV1, type AiRouterImplementation } from '@netscript/plugin-ai-core';
import { toNetScriptChatResponse } from '@netscript/fresh/ai';
import { createAssistantAgent } from '../agents/assistant.ts';
import { ai, chatModelId, DEFAULT_CHAT_MODEL } from '../ai.ts';

interface ChatRequestBody {
  readonly sessionId: string;
  readonly message: { readonly role: 'user'; readonly text: string };
}

type AiRequestContext = {
  readonly request: Request;
};

const capabilities = {
  pluginName: '@netscript/plugin-ai',
  contractVersions: ['v1'],
  routeGroups: ['ai'],
  capabilities: ['chat', 'models', 'tools', 'embeddings', 'transcription'],
} as const;

function mutableContent<T>(content: string | readonly T[]): string | T[] {
  return typeof content === 'string' ? content : [...content];
}

async function* streamChat(input: {
  readonly message: string;
  readonly signal?: AbortSignal;
}) {
  const loop = createAssistantAgent();
  const generation = loop.run({
    model: chatModelId(DEFAULT_CHAT_MODEL),
    messages: [{ role: 'user', content: input.message }],
    system: 'You are the assistant. Be concise and precise.',
  }, { signal: input.signal });

  try {
    for await (const chunk of generation) {
      yield chunk;
    }
  } finally {
    if (input.signal?.aborted) {
      loop.stop();
    }
  }
}

const aiRouteImplementation: AiRouterImplementation<AiRequestContext> = {
  describe: () => capabilities,
  chat: async function* ({ input, signal }) {
    const latestUserText = [...input.messages]
      .reverse()
      .find((message) => message.role === 'user')?.content;
    const message = typeof latestUserText === 'string' ? latestUserText : '';

    for await (const chunk of streamChat({ message, signal })) {
      if (chunk.type === 'message') {
        yield {
          ...chunk,
          message: {
            ...chunk.message,
            content: mutableContent(chunk.message.content),
            toolCalls: chunk.message.toolCalls?.map((toolCall) => ({ ...toolCall })),
          },
        };
      } else if (chunk.type === 'tool-result') {
        yield {
          ...chunk,
          result: { ...chunk.result, content: mutableContent(chunk.result.content) },
        };
      } else {
        yield { ...chunk };
      }
    }
  },
  models: async ({ input }) => {
    const providerId = input?.provider ?? ai().defaultModelProvider ?? 'anthropic';
    const models = await ai().getModelProvider(providerId).listModels();
    return { models: [...models] };
  },
  invokeTool: async ({ input }) => {
    const handler = ai().tools.resolveHandler(input.name);
    if (!handler) {
      return { content: \`Tool "\${input.name}" is not registered.\`, state: 'error' };
    }
    const result = await handler({
      id: crypto.randomUUID(),
      name: input.name,
      arguments: JSON.stringify(input.arguments ?? {}),
      state: 'input-complete',
    });
    return { ...result, content: mutableContent(result.content) };
  },
  embed: async ({ input }) => {
    const values = Array.isArray(input.input) ? input.input : [input.input];
    const model = typeof input.model === 'string' ? input.model : input.model.model;
    const response = await ai().embeddings.embed(values, { model });
    return {
      embeddings: response.embeddings.map((embedding) => [...embedding]),
      model: response.model,
      usage: response.usage,
    };
  },
  transcribe: async () => ({
    text: 'Transcription is not configured in this scaffold. Wire a transcription provider here.',
  }),
};

/** Contract handle imported explicitly so this route stays tied to /v1/ai. */
export const aiRouteContract = aiContractV1;

/** Contract-bound /v1/ai router handlers for host integrations and tests. */
export const aiRouter = createAiRouter<AiRequestContext>(aiRouteImplementation);

/**
 * POST handler. Directly invokes the in-process agent loop and streams tokens
 * back through a durable NetScript chat session. \`request.signal\` (AbortSignal)
 * is threaded into the loop so an aborted request stops generation; the returned
 * connection exposes \`stop()\` for explicit cancellation.
 */
export async function handler(request: Request): Promise<Response> {
  const body = (await request.json()) as ChatRequestBody;
  const { sessionId, message } = body;

  const response = toNetScriptChatResponse({
    target: { sessionId },
    source: streamChat({ message: message.text, signal: request.signal }),
    newMessages: [{ id: crypto.randomUUID(), role: 'user', content: message.text }],
    request,
  });

  return response;
}
`,
  tokens: [],
});
