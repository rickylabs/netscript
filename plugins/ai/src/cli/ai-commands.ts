/** Plugin-owned AI CLI command handlers. */

import type {
  PluginCliArgs,
  PluginCliResult,
  PluginCommandContext,
  PluginCommandSpec,
} from '@netscript/plugin/adapter';
import {
  addMcpServer,
  addModel,
  addProvider,
  listAiResources,
  removeAiResource,
  removeModel,
} from './ai-project.ts';

/** Extra command verbs exposed by the AI adapter. */
export const aiCommands: readonly PluginCommandSpec[] = [
  { verb: 'model', description: 'Add, remove, or list configured models.', run: runModel },
  { verb: 'provider', description: 'Add a model provider.', run: runProvider },
  { verb: 'mcp', description: 'Add or list MCP servers.', run: runMcp },
  { verb: 'list', description: 'List AI resources.', run: runList },
  { verb: 'remove', description: 'Remove an AI tool or agent.', run: runRemove },
];

async function runModel(
  args: PluginCliArgs,
  context: PluginCommandContext,
): Promise<PluginCliResult> {
  const [action, alias, ref] = args.values ?? [];
  if (action === 'list') return ok(await listAiResources(context, 'models'));
  if (action === 'add' && alias && ref) return ok(await addModel(context, alias, ref));
  if (action === 'remove' && alias) return ok(await removeModel(context, alias));
  return fail('Usage: model add <alias> <provider:model-id> | remove <alias> | list');
}

async function runProvider(
  args: PluginCliArgs,
  context: PluginCommandContext,
): Promise<PluginCliResult> {
  const [action, provider] = args.values ?? [];
  return action === 'add' && provider
    ? ok(await addProvider(context, provider))
    : fail('Usage: provider add <anthropic|openai-compatible|openrouter|ollama>');
}

async function runMcp(
  args: PluginCliArgs,
  context: PluginCommandContext,
): Promise<PluginCliResult> {
  const [action, id] = args.values ?? [];
  if (action === 'list') return ok(await listAiResources(context, 'mcp'));
  if (action !== 'add' || !id) {
    return fail('Usage: mcp add <serverId> --url=<url>|--stdio=<command> [--auth=<ENV>] | list');
  }
  const url = stringFlag(args, 'url');
  const stdio = stringFlag(args, 'stdio');
  if ((url ? 1 : 0) + (stdio ? 1 : 0) !== 1) {
    return fail('Exactly one of --url or --stdio is required.');
  }
  return ok(
    await addMcpServer(context, {
      id,
      transport: url ? 'streamable-http' : 'stdio',
      target: url ?? stdio!,
      authEnv: stringFlag(args, 'auth'),
    }),
  );
}

async function runList(
  args: PluginCliArgs,
  context: PluginCommandContext,
): Promise<PluginCliResult> {
  const [kind] = args.values ?? [];
  if (kind !== 'tools' && kind !== 'agents' && kind !== 'models') {
    return fail('Usage: list tools|agents|models [--json]');
  }
  return ok(await listAiResources(context, kind));
}

async function runRemove(
  args: PluginCliArgs,
  context: PluginCommandContext,
): Promise<PluginCliResult> {
  const [kind, id] = args.values ?? [];
  if ((kind !== 'tool' && kind !== 'agent') || !id) return fail('Usage: remove tool|agent <id>');
  await removeAiResource(context, kind, id);
  return ok({ removed: id, kind });
}

function stringFlag(args: PluginCliArgs, name: string): string | undefined {
  const value = args.flags?.[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function ok(data: unknown): PluginCliResult {
  return { code: 0, data };
}

function fail(message: string): PluginCliResult {
  return { code: 1, message };
}
