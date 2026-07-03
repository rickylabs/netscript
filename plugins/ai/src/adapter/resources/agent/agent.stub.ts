/** Type-checked source stub for a generated AI agent.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Token replaced with the agent's exported symbol / id. */
export type AgentToken = 'AGENT_EXPORT' | 'AGENT_ID';

/**
 * App-owned AI agent. A thin factory over `@netscript/ai/agent` `createAgentLoop`
 * bound to the app runtime, a model, a bounded history window, and a tool
 * registry. The plugin ships no agent logic — this is your composition.
 */
export const agentStub: StubSource<AgentToken> = defineStub({
  source: `/** App-owned AI agent "%%AGENT_ID%%". Thin factory over @netscript/ai/agent. */

import { createAgentLoop, createToolRegistry, slidingWindowHistory } from '@netscript/ai/agent';
import type { AgentLoop } from '@netscript/ai/agent';
import { ai, chatModel } from '../ai.ts';

/** Build the "%%AGENT_ID%%" agent loop bound to this app's AI runtime. */
export function %%AGENT_EXPORT%%(): AgentLoop {
  return createAgentLoop({
    runtime: ai(),
    model: chatModel(),
    history: slidingWindowHistory({ maxMessages: 32 }),
    tools: createToolRegistry([]),
    systemPrompt: 'You are the %%AGENT_ID%% assistant. Be concise and precise.',
  });
}
`,
  tokens: ['AGENT_EXPORT', 'AGENT_ID'],
});
