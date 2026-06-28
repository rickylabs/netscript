/**
 * Trigger plugin CLI composition entrypoint.
 *
 * @module
 */

import { TriggersCli } from '../triggers-cli.ts';
import { LocalTriggersCliBackend } from '../triggers-cli-backend.ts';

export { PluginCli } from '@netscript/plugin/cli';
export type { PluginCliArgs, PluginCliCommand, PluginCliResult } from '@netscript/plugin/cli';
export { TriggersCli } from '../triggers-cli.ts';
export {
  AddFileWatchCommand,
  AddScheduledCommand,
  AddWebhookCommand,
  DisableTriggerCommand,
  EnableTriggerCommand,
  FireTriggerCommand,
  ListTriggersCommand,
  PreviewScheduleCommand,
  StaticTriggersCliBackend,
  TestTriggerCommand,
  TriggersCliCommand,
} from '../commands.ts';
export { TRIGGERS_CLI_COMMANDS } from '../command-types.ts';
export type {
  TriggersCliBackend,
  TriggersCliCategory,
  TriggersCliCommandDefinition,
  TriggersCliCommandName,
  TriggersCliFlagDefinition,
} from '../command-types.ts';

/** Default CLI instance used by the host CLI walker. */
export const triggersCli: TriggersCli = new TriggersCli(new LocalTriggersCliBackend());

if (import.meta.main) {
  const result = await triggersCli.run(toTriggersCliArgs(Deno.args));
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

function toTriggersCliArgs(
  values: readonly string[],
): { command: string; flags: Record<string, string | boolean>; values: readonly string[] } {
  const [first = 'list', second, ...rest] = values;
  const command = normalizeCommand(first, second);
  const remaining = command === first ? values.slice(1) : rest;
  const parsed = parseFlags(remaining);
  return { command, flags: parsed.flags, values: parsed.values };
}

function normalizeCommand(first: string, second?: string): string {
  if (first === 'add' && second === 'webhook') {
    return 'add-webhook';
  }
  if (first === 'add' && second === 'file-watch') {
    return 'add-file-watch';
  }
  if (first === 'add' && second === 'scheduled') {
    return 'add-scheduled';
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
