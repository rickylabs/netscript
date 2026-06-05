import { PluginCli } from '@netscript/plugin/cli';
import type { PluginCliArgs, PluginCliCommand, PluginCliResult } from '@netscript/plugin/cli';

const STREAMS_COMMANDS = [
  'list-topics',
  'subscribe',
  'publish',
  'stats',
  'clear',
] as const;

type StreamsCommand = typeof STREAMS_COMMANDS[number];

/**
 * CLI command group for `@netscript/plugin-streams`.
 *
 * @example
 * ```ts
 * const cli = new StreamsCli();
 * const result = await cli.run({ command: "list-topics" });
 * ```
 */
export class StreamsCli extends PluginCli {
  /** Plugin CLI name used by mounted command lists. */
  readonly name = 'streams';

  /** Human-readable CLI description. */
  readonly description = 'Durable Streams plugin CLI.';

  /** Return plugin-owned stream commands. */
  commands(): readonly PluginCliCommand[] {
    return STREAMS_COMMANDS.map((name) => ({
      name,
      description: getStreamsCommandDescription(name),
      run: (args) => runStreamsCommand(name, args),
    }));
  }
}

function getStreamsCommandDescription(command: StreamsCommand): string {
  switch (command) {
    case 'list-topics':
      return 'List stream topics discovered for the current project.';
    case 'subscribe':
      return 'Subscribe to a stream topic.';
    case 'publish':
      return 'Publish a test event to a stream topic.';
    case 'stats':
      return 'Show stream service statistics.';
    case 'clear':
      return 'Clear development stream state.';
  }
}

function runStreamsCommand(
  command: StreamsCommand,
  _args: PluginCliArgs,
): PluginCliResult {
  if (command === 'list-topics') {
    return {
      code: 0,
      message: 'Stream topic walker is not implemented yet.',
      data: { topics: [] },
    };
  }

  return {
    code: 1,
    message: `ns-streams ${command} is not implemented until the streams runtime CLI is wired.`,
  };
}
