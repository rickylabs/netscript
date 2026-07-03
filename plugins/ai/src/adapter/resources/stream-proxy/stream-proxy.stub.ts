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

import { createAgentLoop, slidingWindowHistory } from '@netscript/ai/agent';
import { toNetScriptChatResponse } from '@netscript/fresh/ai';
import { ai, chatModel } from '../ai.ts';

interface ChatRequestBody {
  readonly sessionId: string;
  readonly message: { readonly role: 'user'; readonly text: string };
}

/**
 * POST handler. Directly invokes the in-process agent loop and streams tokens
 * back through a durable NetScript chat session. \`request.signal\` (AbortSignal)
 * is threaded into the loop so an aborted request stops generation; the returned
 * connection exposes \`stop()\` for explicit cancellation.
 */
export async function handler(request: Request): Promise<Response> {
  const body = (await request.json()) as ChatRequestBody;
  const { sessionId, message } = body;

  const loop = createAgentLoop({
    model: chatModel(),
    runtime: ai(),
    history: slidingWindowHistory({ maxMessages: 32 }),
  });

  const generation = loop.run({
    input: message.text,
    // Propagate the inbound AbortSignal so aborting the request cancels the model call.
    signal: request.signal,
  });

  const response = toNetScriptChatResponse({
    target: { sessionId },
    source: generation.stream,
    newMessages: [{ role: 'user', text: message.text }],
    request,
  });

  // Cancel in-flight generation when the durable session is closed/stopped.
  request.signal.addEventListener('abort', () => generation.stop(), { once: true });

  return response;
}
`,
  tokens: [],
});
