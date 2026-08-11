/** NetScript adapter contract for the AI plugin.
 *
 * @module
 */

import {
  type InstallStarterResource,
  type ItemScaffolder,
  type NetScriptPlugin,
  type ScaffoldArtifact,
  textArtifact,
} from '@netscript/plugin/adapter';
import { PLUGIN_PACKAGE_VERSION } from '../package-metadata.generated.ts';
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
  emitMcpRegistry,
  EMPTY_BARREL_INPUT,
  emptyBarrelScaffolder,
  modelsScaffolder,
  streamProxyScaffolder,
  threadStoreResource,
  toolResource,
} from './resources/mod.ts';
import { aiCommands } from '../cli/ai-commands.ts';
import { diagnoseAiProject } from '../cli/ai-project.ts';

export type { InstallStarterResource, NetScriptPlugin } from '@netscript/plugin/adapter';

const AI_UI_REGISTRY_ITEMS: readonly string[] = ['markdown'];
const AI_NAMESPACE_DENO_JSON: string = JSON.stringify(
  {
    imports: {
      preact: 'npm:preact@^10.27.2',
    },
    compilerOptions: {
      strict: true,
      jsx: 'precompile',
      jsxImportSource: 'preact',
    },
  },
  null,
  2,
) + '\n';

const namespaceConfigScaffolder: ItemScaffolder<Readonly<Record<string, never>>> = {
  name: 'namespace-config',
  emit(): readonly ScaffoldArtifact[] {
    return [
      textArtifact('ai/deno.json', AI_NAMESPACE_DENO_JSON),
    ];
  },
};

const applicationModuleScaffolder: ItemScaffolder<Readonly<Record<string, never>>> = {
  name: 'application-module',
  emit(): readonly ScaffoldArtifact[] {
    return [
      textArtifact(
        'ai/mod.ts',
        `/** Generated AI application module. */\n\nexport * from './models.ts';\n`,
      ),
    ];
  },
};

const controlPlaneModuleScaffolder: ItemScaffolder<Readonly<Record<string, never>>> = {
  name: 'control-plane-module',
  emit(): readonly ScaffoldArtifact[] {
    return [
      textArtifact(
        'ai/plugin.ts',
        `/** Generated AI control-plane module. */\n\nexport { aiPlugin } from '@netscript/plugin-ai';\n`,
      ),
    ];
  },
};

/**
 * Starter resources emitted by the AI install command. Default topology is
 * fully in-process: the barrel wires `@netscript/ai`, the stream route calls it
 * directly (no gateway), and the island streams from that route. Thread
 * persistence is intentionally excluded (opt-in via `--persist-threads`).
 */
export const aiStarterResources: readonly InstallStarterResource[] = [
  { scaffolder: namespaceConfigScaffolder, input: {} },
  { scaffolder: applicationModuleScaffolder, input: {} },
  { scaffolder: controlPlaneModuleScaffolder, input: {} },
  // Structural: model configuration is required independently of sample tools and agents.
  { scaffolder: modelsScaffolder, input: DEFAULT_MODELS_INPUT },
  {
    scaffolder: barrelScaffolder,
    input: DEFAULT_BARREL_INPUT,
    samples: {
      kind: 'alternate',
      scaffolder: emptyBarrelScaffolder,
      input: EMPTY_BARREL_INPUT,
    },
  },
  {
    scaffolder: toolResource.scaffolder,
    input: DEFAULT_TOOL_INPUT,
    samples: { kind: 'omit' },
  },
  {
    scaffolder: agentResource.scaffolder,
    input: DEFAULT_AGENT_INPUT,
    samples: { kind: 'omit' },
  },
  {
    // Structural: the empty MCP registry is imported by full sample installs and supports later adds.
    scaffolder: { name: 'mcp-registry', emit: () => [emitMcpRegistry([])] },
    input: {},
  },
  {
    scaffolder: streamProxyScaffolder,
    input: DEFAULT_STREAM_PROXY_INPUT,
    samples: { kind: 'omit' },
  },
  {
    scaffolder: chatRouteScaffolder,
    input: DEFAULT_CHAT_ROUTE_INPUT,
    samples: { kind: 'omit' },
  },
];

/** Thin connector object consumed by `@netscript/plugin/adapter`. */
export const aiAdapterPlugin: NetScriptPlugin = {
  name: '@netscript/plugin-ai',
  kind: 'ai',
  displayName: 'AI Chat',
  install: {
    dependencySpecifier: `jsr:@netscript/plugin-ai@${PLUGIN_PACKAGE_VERSION}`,
    starterResources: aiStarterResources,
    uiRegistryItems: AI_UI_REGISTRY_ITEMS,
    configParams: ['AI_MODEL', 'ANTHROPIC_API_KEY'],
  },
  doctor: {
    extraChecks: [
      {
        name: 'ai-project',
        async run(context) {
          const result = await diagnoseAiProject(context);
          const failures = [
            ...result.modelRefs.map((ref) => `Dangling model ref ${ref}`),
            ...result.missingProviderKeys.map((key) => `Missing provider key ${key}`),
            ...result.unwiredTools.map((tool) => `Tool ${tool} is not wired`),
          ];
          return {
            name: 'ai-project',
            ok: failures.length === 0,
            message: failures.join('; ') || undefined,
          };
        },
      },
    ],
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
    targetSpecifier: `jsr:@netscript/plugin-ai@${PLUGIN_PACKAGE_VERSION}`,
  },
  remove: {
    strategy: 'manifest-only',
  },
  resources: [toolResource, agentResource, threadStoreResource],
  commands: aiCommands,
};
