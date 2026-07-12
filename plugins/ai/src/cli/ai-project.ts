/** Project-owned AI configuration reads, writes, and diagnostics. */

import { artifactText, type PluginCommandContext } from '@netscript/plugin/adapter';
import { LocalProjectFiles } from '@netscript/plugin/cli';
import { emitMcpRegistry, emitMcpServer, type McpServerInput } from '../adapter/resources/mod.ts';
import { syncAiProject } from './sync-ai-project.ts';

/** Provider ids supported by the AI runtime package. */
export const AI_PROVIDER_IDS = [
  'anthropic',
  'openai-compatible',
  'openrouter',
  'ollama',
] as const;
export type AiProviderId = (typeof AI_PROVIDER_IDS)[number];

const PROVIDER_KEYS: Readonly<Record<AiProviderId, string | undefined>> = {
  anthropic: 'ANTHROPIC_API_KEY',
  'openai-compatible': 'OPENAI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  ollama: undefined,
};

interface ModelsState {
  readonly providers: readonly AiProviderId[];
  readonly models: Readonly<Record<string, string>>;
}

/** Read enumerable AI resources from a project. */
export async function listAiResources(
  context: PluginCommandContext,
  kind: 'tools' | 'agents' | 'models' | 'mcp',
): Promise<unknown> {
  const files = new LocalProjectFiles(context.workspaceRoot);
  if (kind === 'models') return await readModels(files);
  const dir = kind === 'mcp' ? 'ai/mcp' : `ai/${kind}`;
  const entries = await files.listFiles(dir, ['.ts']);
  return entries
    .map((entry) => entry.relativePath.slice(entry.relativePath.lastIndexOf('/') + 1, -3))
    .filter((id) => id !== 'registry')
    .sort();
}

/** Add or replace a provider in the generated app model configuration. */
export async function addProvider(
  context: PluginCommandContext,
  provider: string,
): Promise<ModelsState> {
  if (!isProviderId(provider)) throw new TypeError(`Unsupported AI provider: ${provider}`);
  const files = new LocalProjectFiles(context.workspaceRoot);
  const state = await readModels(files);
  const providers = [...new Set([...state.providers, provider])].sort();
  const next = { ...state, providers };
  await files.writeTextFile('ai/models.ts', renderModels(next));
  return next;
}

/** Add or replace a named model reference. */
export async function addModel(
  context: PluginCommandContext,
  alias: string,
  ref: string,
): Promise<ModelsState> {
  assertId(alias, 'model alias');
  const provider = ref.slice(0, ref.indexOf(':'));
  if (!ref.includes(':') || !isProviderId(provider)) {
    throw new TypeError(`Model ref must be provider:model-id using a supported provider: ${ref}`);
  }
  const files = new LocalProjectFiles(context.workspaceRoot);
  const state = await readModels(files);
  const next = { ...state, models: { ...state.models, [alias]: ref } };
  await files.writeTextFile('ai/models.ts', renderModels(next));
  return next;
}

/** Remove a named model reference. */
export async function removeModel(
  context: PluginCommandContext,
  alias: string,
): Promise<ModelsState> {
  const files = new LocalProjectFiles(context.workspaceRoot);
  const state = await readModels(files);
  const models = { ...state.models };
  delete models[alias];
  if (Object.keys(models).length === 0) throw new TypeError('At least one model must remain.');
  const next = { ...state, models };
  await files.writeTextFile('ai/models.ts', renderModels(next));
  return next;
}

/** Add an MCP server file and rebuild its registry. */
export async function addMcpServer(
  context: PluginCommandContext,
  input: McpServerInput,
): Promise<readonly string[]> {
  assertId(input.id, 'MCP server id');
  const files = new LocalProjectFiles(context.workspaceRoot);
  const artifact = emitMcpServer(input);
  await files.writeTextFile(artifact.path, artifactText(artifact));
  return await rebuildMcpRegistry(files);
}

/** Remove a tool or agent and rebuild all runtime registries. */
export async function removeAiResource(
  context: PluginCommandContext,
  kind: 'tool' | 'agent',
  id: string,
): Promise<void> {
  assertId(id, `${kind} id`);
  const files = new LocalProjectFiles(context.workspaceRoot);
  const path = files.resolve(`ai/${kind}s/${id}.ts`);
  try {
    await Deno.remove(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) throw new TypeError(`Unknown ${kind}: ${id}`);
    throw error;
  }
  await syncAiProject(context);
}

/** Diagnose model references, provider credentials, and generated tool wiring. */
export async function diagnoseAiProject(context: PluginCommandContext): Promise<{
  readonly modelRefs: readonly string[];
  readonly missingProviderKeys: readonly string[];
  readonly unwiredTools: readonly string[];
}> {
  const files = new LocalProjectFiles(context.workspaceRoot);
  const state = await readModels(files);
  const modelRefs = Object.values(state.models).filter((ref) =>
    !state.providers.includes(ref.slice(0, ref.indexOf(':')) as AiProviderId)
  );
  const missingProviderKeys = state.providers.flatMap((provider) => {
    const key = PROVIDER_KEYS[provider];
    return key && context.config[key] === undefined ? [key] : [];
  });
  const tools = await listAiResources(context, 'tools') as readonly string[];
  const registry = await files.readTextFile('.netscript/generated/plugin-ai/tools.registry.ts') ??
    '';
  const unwiredTools = tools.filter((id) => !registry.includes(`/tools/${id}.ts`));
  return { modelRefs, missingProviderKeys, unwiredTools };
}

async function rebuildMcpRegistry(files: LocalProjectFiles): Promise<readonly string[]> {
  const entries = await files.listFiles('ai/mcp', ['.ts']);
  const ids = entries.map((entry) =>
    entry.relativePath.split('/').at(-1)?.replace(/\.ts$/, '') ?? ''
  )
    .filter((id) => id && id !== 'registry').sort();
  const registry = emitMcpRegistry(ids);
  await files.writeTextFile(registry.path, artifactText(registry));
  return ids;
}

async function readModels(files: LocalProjectFiles): Promise<ModelsState> {
  const source = await files.readTextFile('ai/models.ts') ?? '';
  const marker = source.match(/AI_CLI_STATE: (\{.*\})/);
  if (marker) return JSON.parse(marker[1]) as ModelsState;
  const providers = [...source.matchAll(/^\s*([\w-]+):\s*['"]([\w-]+)['"],?$/gm)]
    .map((match) => match[2]).filter(isProviderId);
  const models = Object.fromEntries(
    [...source.matchAll(/^\s*(\w+):\s*['"]([^'"]+:[^'"]+)['"],?$/gm)]
      .map((match) => [match[1], match[2]]),
  );
  return {
    providers: providers.length ? [...new Set(providers)] : ['anthropic'],
    models: Object.keys(models).length ? models : { chat: 'anthropic:claude-sonnet-4-5' },
  };
}

function renderModels(state: ModelsState): string {
  const providers = [...state.providers].sort();
  const models = Object.entries(state.models).sort(([left], [right]) => left.localeCompare(right));
  const imports = providers.map((provider) => `import '@netscript/ai/${provider}';`).join('\n');
  const providerRows = providers.map((provider) =>
    `  ${JSON.stringify(provider)}: ${JSON.stringify(provider)},`
  );
  const modelRows = models.map(([alias, ref]) =>
    `  ${JSON.stringify(alias)}: ${JSON.stringify(ref)},`
  );
  const defaultAlias = state.models.chat ? 'chat' : models[0][0];
  return `/** Provider + model registry generated by the AI plugin CLI. */\n${imports}\n\n` +
    `// AI_CLI_STATE: ${JSON.stringify({ providers, models: Object.fromEntries(models) })}\n` +
    `export const AI_PROVIDERS = {\n${providerRows.join('\n')}\n} as const;\n\n` +
    `export const AI_MODELS = {\n${modelRows.join('\n')}\n} as const;\n\n` +
    `export const DEFAULT_CHAT_MODEL: string = AI_MODELS[${JSON.stringify(defaultAlias)}];\n`;
}

function isProviderId(value: string): value is AiProviderId {
  return AI_PROVIDER_IDS.some((provider) => provider === value);
}

function assertId(value: string, label: string): void {
  if (!/^[a-z][a-z0-9-]*$/.test(value)) {
    throw new TypeError(`Invalid ${label}: ${value}`);
  }
}
