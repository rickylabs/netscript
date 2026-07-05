/** NetScript adapter contract for the AI plugin.
 *
 * @module
 */

import type { InstallStarterResource, NetScriptPlugin } from '@netscript/plugin/adapter';
import {
  agentResource,
  barrelScaffolder,
  chatRouteScaffolder,
  DEFAULT_AGENT_INPUT,
  DEFAULT_BARREL_INPUT,
  DEFAULT_CHAT_ROUTE_INPUT,
  DEFAULT_MODELS_INPUT,
  DEFAULT_STREAM_PROXY_INPUT,
  DEFAULT_TOOL_INPUT,
  modelsScaffolder,
  streamProxyScaffolder,
  threadStoreResource,
  toolResource,
} from './resources/mod.ts';

export type { InstallStarterResource, NetScriptPlugin } from '@netscript/plugin/adapter';

/**
 * Starter resources emitted by the AI install command. Default topology is
 * fully in-process: the barrel wires `@netscript/ai`, the stream route calls it
 * directly (no gateway), and the island streams from that route. Thread
 * persistence is intentionally excluded (opt-in via `--persist-threads`).
 */
export const aiStarterResources: readonly InstallStarterResource[] = [
  { scaffolder: modelsScaffolder, input: DEFAULT_MODELS_INPUT },
  { scaffolder: barrelScaffolder, input: DEFAULT_BARREL_INPUT },
  { scaffolder: toolResource.scaffolder, input: DEFAULT_TOOL_INPUT },
  { scaffolder: agentResource.scaffolder, input: DEFAULT_AGENT_INPUT },
  { scaffolder: streamProxyScaffolder, input: DEFAULT_STREAM_PROXY_INPUT },
  { scaffolder: chatRouteScaffolder, input: DEFAULT_CHAT_ROUTE_INPUT },
];

/** Thin connector object consumed by `@netscript/plugin/adapter`. */
export const aiAdapterPlugin: NetScriptPlugin = {
  name: '@netscript/plugin-ai',
  kind: 'ai',
  displayName: 'AI Chat',
  install: {
    dependencySpecifier: 'jsr:@netscript/plugin-ai@^0.0.1-beta.1',
    starterResources: aiStarterResources,
    configParams: ['AI_MODEL', 'ANTHROPIC_API_KEY'],
  },
  doctor: {
    requiredConfigKeys: ['ANTHROPIC_API_KEY'],
  },
  info: {
    capabilities: [
      'in-process AI chat route',
      'durable chat sessions',
      'standard-schema AI tools',
      'bounded agent loop',
      'opt-in thread persistence',
    ],
    versionSource: 'package',
  },
  update: {
    strategy: 'dependency',
    targetSpecifier: 'jsr:@netscript/plugin-ai@^0.0.1-beta.1',
  },
  remove: {
    strategy: 'manifest-only',
  },
  resources: [toolResource, agentResource, threadStoreResource],
};
