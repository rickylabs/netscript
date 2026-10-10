/** Typed collaborators for executing the generated route without a provider or stream service. */
import type { AgentLoop } from '@netscript/ai/agent';
import type { AiRuntime } from '@netscript/ai';
import type { NetScriptChatResponseOptions } from '@netscript/fresh/ai';

export const DEFAULT_CHAT_MODEL = 'test:model';

export function chatModelId(ref: string): string {
  return ref.split(':')[1];
}

export function ai(): AiRuntime {
  throw new Error('This fixture only exercises the generated chat handler.');
}

export function createAssistantAgent(): AgentLoop {
  return {
    state: 'idle',
    stop() {},
    async *run(input) {
      const content = input.messages[0]?.content;
      if (typeof content !== 'string') throw new Error('Expected the model text prompt.');
      yield { type: 'text', delta: content };
    },
  };
}

export async function toNetScriptChatResponse(
  input: NetScriptChatResponseOptions,
): Promise<Response> {
  const modelChunks: unknown[] = [];
  for await (const chunk of input.source) modelChunks.push(chunk);
  return Response.json({ newMessages: input.newMessages, modelChunks });
}
