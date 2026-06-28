/**
 * Workers plugin CLI composition entrypoint.
 *
 * @module
 */

import { WorkersCli } from '../workers-cli.ts';
import { LocalWorkersCliBackend } from '../workers-cli-backend.ts';

export { WorkersCli } from '../workers-cli.ts';
export { PluginCli } from '@netscript/plugin/cli';
export type { PluginCliArgs, PluginCliCommand, PluginCliResult } from '@netscript/plugin/cli';
export { CliCommand, WorkersCommand } from '@netscript/plugin-workers-core/abstracts';
export type { WorkersCommandDefinition } from '@netscript/plugin-workers-core/abstracts';
export {
  AddJobCommand,
  AddTaskCommand,
  CompileRegistryCommand,
  ConfigEditCommand,
  ConfigPublishCommand,
  DisableCommand,
  EnableCommand,
  ListJobsCommand,
  ListTasksCommand,
  LogsCommand,
  RunJobCommand,
  WorkersCliCommand,
} from '../commands.ts';
export { WORKERS_CLI_COMMANDS } from '../command-types.ts';
export type {
  WorkersCliBackend,
  WorkersCliCategory,
  WorkersCliCommandDefinition,
  WorkersCliCommandName,
  WorkersCliFlagDefinition,
} from '../command-types.ts';

/** Default CLI instance used by the host CLI walker. */
export const workersCli: WorkersCli = new WorkersCli(new LocalWorkersCliBackend());

if (import.meta.main) {
  const args = toWorkersCliArgs(Deno.args);
  const result = await workersCli.run(args);
  if (result.message) {
    if (result.code === 0) {
      console.log(result.message);
    } else {
      console.error(result.message);
    }
  }
  if (result.data !== undefined) {
    console.log(JSON.stringify(result.data, null, 2));
  }
  Deno.exitCode = result.code;
}

function toWorkersCliArgs(
  values: readonly string[],
): { command: string; flags: Record<string, string | boolean>; values: readonly string[] } {
  const [first = 'list-jobs', second, ...rest] = values;
  const command = normalizeCommand(first, second);
  const remaining = command === first ? values.slice(1) : rest;
  const parsed = parseFlags(remaining);
  return { command, flags: parsed.flags, values: parsed.values };
}

function normalizeCommand(first: string, second?: string): string {
  if (first === 'add' && second === 'job') {
    return 'add-job';
  }
  if (first === 'add' && second === 'task') {
    return 'add-task';
  }
  if (first === 'config' && second === 'edit') {
    return 'config-edit';
  }
  if (first === 'config' && second === 'publish') {
    return 'config-publish';
  }
  return first;
}

function parseFlags(values: readonly string[]): {
  flags: Record<string, string | boolean>;
  values: readonly string[];
} {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];

  for (const value of values) {
    if (!value.startsWith('--')) {
      positional.push(value);
      continue;
    }

    const [name, flagValue] = value.slice(2).split('=', 2);
    flags[name] = flagValue ?? true;
  }

  return { flags, values: positional };
}
