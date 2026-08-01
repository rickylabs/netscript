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

import { aiContractV1 } from '@netscript/plugin-ai-core';
import { toNetScriptChatResponse } from '@netscript/fresh/ai';
import { createAssistantAgent } from '../agents/assistant.ts';
import { chatModelId, DEFAULT_CHAT_MODEL } from '../ai.ts';

interface ChatRequestBody {
  readonly sessionId: string;
  readonly message: { readonly role: 'user'; readonly text: string };
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

/** Contract handle imported explicitly so this route stays tied to /v1/ai. */
export const aiRouteContract = aiContractV1;

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
