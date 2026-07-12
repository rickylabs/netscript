/**
 * CLI entrypoint for the streams plugin.
 *
 * @module
 */

import { StreamsCli } from '../streams-cli.ts';
import {
  clearStream,
  inspectDiscoveredTopic,
  publishStreamEvent,
  subscribeToStream,
} from '../adapters/runtime-client.ts';
import { discoverStreamTopics } from '../adapters/topic-walker.ts';
import { writeStreamArtifacts } from '../adapters/artifact-writer.ts';

/** CLI command group for the streams plugin. */
export { StreamsCli };
export type {
  PluginCli,
  PluginCliArgs,
  PluginCliCommand,
  PluginCliResult,
} from '@netscript/plugin/cli';

/** Default CLI instance used by `deno x -A jsr:@netscript/plugin-streams/cli`. */
export const streamsCli: StreamsCli = new StreamsCli({
  workspaceRoot: () => Deno.cwd(),
  discoverTopics: discoverStreamTopics,
  publish: publishStreamEvent,
  subscribe: subscribeToStream,
  inspect: inspectDiscoveredTopic,
  clear: clearStream,
  writeArtifacts: writeStreamArtifacts,
});

if (import.meta.main) {
  const [command = 'list-topics', ...values] = Deno.args;
  const args = parseArgs(command, values);
  const handler = streamsCli.commands().find((item) => item.name === command);
  const result = handler
    ? await handler.run(args)
    : { code: 1, message: `Unknown streams command: ${command}` };
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

function parseArgs(command: string, values: readonly string[]) {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith('--')) {
      positionals.push(value);
      continue;
    }
    const [name, inline] = value.slice(2).split('=', 2);
    const next = values[index + 1];
    if (inline !== undefined) flags[name] = appendFlag(flags[name], inline);
    else if (next && !next.startsWith('--')) {
      flags[name] = appendFlag(flags[name], next);
      index += 1;
    } else flags[name] = true;
  }
  return { command, values: positionals, flags };
}

function appendFlag(current: string | boolean | undefined, value: string): string {
  return typeof current === 'string' ? `${current},${value}` : value;
}
