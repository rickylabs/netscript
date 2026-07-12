/**
 * CLI commands and local project adapters for sagas plugin operations.
 *
 * @module
 */

import { LocalSagasRuntimeBackend } from './local-runtime-backend.ts';
import { SagasCli } from './sagas-cli.ts';

export { LocalProjectFiles } from '@netscript/plugin/cli';
export type {
  PluginCli,
  PluginCliArgs,
  PluginCliCommand,
  PluginCliResult,
} from '@netscript/plugin/cli';
export type { ProjectFileEntry, ProjectFiles } from '@netscript/plugin/cli';
export { codemodSagaImports } from './codemod.ts';
export type {
  CodemodSagaImportsChange,
  CodemodSagaImportsOptions,
  CodemodSagaImportsResult,
} from './codemod.ts';
export {
  AddSagaCommand,
  CodemodCommand,
  GenerateRegistryCommand,
  InspectCommand,
  ListSagasCommand,
  PublishCommand,
  RemoveSagaCommand,
  SagasCliCommand,
  StaticSagasCliBackend,
  UpdateSagaCommand,
} from './commands.ts';
export { SAGAS_CLI_COMMANDS } from './command-types.ts';
export type {
  SagasCliBackend,
  SagasCliCategory,
  SagasCliCommandDefinition,
  SagasCliCommandName,
  SagasCliFlagDefinition,
} from './command-types.ts';
export { generateSagaRegistry } from './registry-generator.ts';
export type {
  GenerateSagaRegistryOptions,
  GenerateSagaRegistryResult,
} from './registry-generator.ts';
export { SagasCli } from './sagas-cli.ts';
export { LocalSagasRuntimeBackend } from './local-runtime-backend.ts';
export type { LocalSagasRuntimeBackendOptions } from './local-runtime-backend.ts';
export { FetchSagasRuntimeApiClient } from './adapters/runtime-api-client.ts';
export type {
  FetchSagasRuntimeApiClientOptions,
  SagasRuntimeApiClient,
  SagasRuntimeRequest,
} from './adapters/runtime-api-client.ts';
export { inspectSagasProject } from './saga-inspector.ts';
export type {
  InspectSagasOptions,
  InspectSagasResult,
  SagaInspectionEntry,
} from './saga-inspector.ts';
export { SAGAS_PLUGIN_ID, SAGAS_PLUGIN_VERSION } from '../constants.ts';

/** Default CLI instance used by standalone and host-mounted saga commands. */
export const sagasCli: SagasCli = new SagasCli(new LocalSagasRuntimeBackend());

if (import.meta.main) {
  const args = toSagasCliArgs(Deno.args);
  const command = sagasCli.commands().find((item) => item.name === args.command);
  const result = command
    ? await command.run(args)
    : { code: 1, message: `Unknown sagas command: ${args.command}` };
  if (result.message) {
    if (result.code === 0) console.log(result.message);
    else console.error(result.message);
  }
  if (result.data !== undefined) console.log(JSON.stringify(result.data, null, 2));
  Deno.exitCode = result.code;
}

function toSagasCliArgs(
  values: readonly string[],
): { command: string; flags: Record<string, string | boolean>; values: readonly string[] } {
  const [first = 'list', second, ...rest] = values;
  const command = normalizeCommand(first, second);
  const remaining = command === first ? values.slice(1) : rest;
  const parsed = parseFlags(remaining);
  return { command, flags: parsed.flags, values: parsed.values };
}

function normalizeCommand(first: string, second?: string): string {
  if (first === 'add' && second === 'saga') return 'add-saga';
  if (first === 'generate' && second === 'registry') return 'generate-registry';
  if (first === 'update' && second === 'saga') return 'update-saga';
  if (first === 'remove' && second === 'saga') return 'remove-saga';
  return first;
}

function parseFlags(values: readonly string[]): {
  flags: Record<string, string | boolean>;
  values: readonly string[];
} {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];
  const booleans = new Set(['instances', 'json', 'registered', 'write']);
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (!value.startsWith('--')) {
      positional.push(value);
      continue;
    }
    const [name, inline] = value.slice(2).split('=', 2);
    if (inline !== undefined) flags[name] = inline;
    else if (!booleans.has(name) && values[index + 1] && !values[index + 1].startsWith('--')) {
      flags[name] = values[++index];
    } else flags[name] = true;
  }
  return { flags, values: positional };
}
