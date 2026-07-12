import { PluginCli } from '@netscript/plugin/cli';
import type { PluginCliArgs, PluginCliCommand, PluginCliResult } from '@netscript/plugin/cli';
import type { DiscoveredStreamTopic, StreamsCliServices } from './streams-types.ts';
import {
  parseStreamProducerInput,
  parseStreamSchemaInput,
  streamConsumerScaffolder,
  streamProducerScaffolder,
  streamSchemaScaffolder,
} from '../adapter/resources/mod.ts';

/** Stable Streams command names. */
export const STREAMS_COMMANDS = [
  'list-topics',
  'subscribe',
  'publish',
  'stats',
  'inspect',
  'clear',
  'add-schema',
  'add-producer',
  'add-consumer',
] as const;

type StreamsCommand = typeof STREAMS_COMMANDS[number];
/** CLI command group for `@netscript/plugin-streams`. */
export class StreamsCli extends PluginCli {
  /** Plugin CLI name used by mounted command lists. */
  readonly name = 'streams';
  /** Human-readable CLI description. */
  readonly description = 'Durable Streams plugin CLI.';

  constructor(private readonly services: StreamsCliServices) {
    super();
  }

  /** Return plugin-owned stream commands. */
  commands(): readonly PluginCliCommand[] {
    return STREAMS_COMMANDS.map((name) => ({
      name,
      description: commandDescription(name),
      run: (args) => this.run(name, args),
    }));
  }

  private async run(command: StreamsCommand, args: PluginCliArgs): Promise<PluginCliResult> {
    try {
      return await runStreamsCommand(command, args, this.services);
    } catch (error) {
      return { code: 1, message: error instanceof Error ? error.message : String(error) };
    }
  }
}

async function runStreamsCommand(
  command: StreamsCommand,
  args: PluginCliArgs,
  services: StreamsCliServices,
): Promise<PluginCliResult> {
  const root = stringFlag(args, 'project-root') ?? services.workspaceRoot();
  if (command.startsWith('add-')) {
    const artifacts = command === 'add-schema'
      ? streamSchemaScaffolder.emit(parseStreamSchemaInput({ ...args, command: 'legacy' }))
      : command === 'add-producer'
      ? streamProducerScaffolder.emit(parseStreamProducerInput({ ...args, command: 'legacy' }))
      : streamConsumerScaffolder.emit({ topic: requiredValue(args) });
    const createdFiles = await services.writeArtifacts(root, artifacts);
    return {
      code: 0,
      message: `${createdFiles.length} stream artifact(s) created.`,
      data: { createdFiles },
    };
  }
  const topics = await services.discoverTopics(root);
  if (command === 'list-topics') {
    return { code: 0, message: `${topics.length} stream topic(s) discovered.`, data: { topics } };
  }

  const topic = resolveTopic(args.values?.[0], topics);
  const baseUrl = stringFlag(args, 'url');
  if (command === 'stats' || command === 'inspect') {
    return { code: 0, data: services.inspect(topic) };
  }
  if (command === 'clear') {
    await services.clear({ topic, baseUrl });
    return { code: 0, message: `Cleared ${topic.streamPath ?? topic.name}.` };
  }
  if (command === 'subscribe') {
    const items = await services.subscribe({ topic, baseUrl, offset: stringFlag(args, 'offset') });
    return { code: 0, message: `${items.length} event(s) received.`, data: { topic, items } };
  }

  const collection = stringFlag(args, 'collection') ?? topic.collections[0]?.name ?? 'event';
  const value = parseJsonObject(stringFlag(args, 'data') ?? '{}');
  const published = await services.publish({
    topic,
    collection,
    value,
    baseUrl,
    producerId: stringFlag(args, 'producer-id'),
  });
  return { code: 0, message: `Published to ${topic.streamPath ?? topic.name}.`, data: published };
}

function resolveTopic(
  value: string | undefined,
  topics: readonly DiscoveredStreamTopic[],
): DiscoveredStreamTopic {
  if (!value) throw new Error('Missing stream topic.');
  return topics.find((topic) => topic.name === value || topic.streamPath === value) ?? {
    name: value,
    streamPath: value.startsWith('/') ? value : `/${value}`,
    producerFile: '<command-line>',
    collections: [],
  };
}

function stringFlag(args: PluginCliArgs, name: string): string | undefined {
  const value = args.flags?.[name];
  return value === undefined ? undefined : String(value);
}

function parseJsonObject(value: string): Readonly<Record<string, unknown>> {
  const parsed: unknown = JSON.parse(value);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new TypeError('--data must be a JSON object.');
  }
  return parsed as Readonly<Record<string, unknown>>;
}

function requiredValue(args: PluginCliArgs): string {
  const value = args.values?.[0];
  if (!value) throw new TypeError('Missing streams resource name.');
  return value;
}

function commandDescription(command: StreamsCommand): string {
  const descriptions: Record<StreamsCommand, string> = {
    'list-topics': 'List producer-backed topics discovered in the current project.',
    subscribe: 'Read the current events from a stream topic.',
    publish: 'Publish and flush a test entity to a stream topic.',
    stats: 'Show the JSON-stable topic inspection report.',
    inspect: 'Inspect schema, stream path, and producer metadata as JSON.',
    clear: 'Delete a development stream and its current state.',
    'add-schema': 'Generate a defineStreamSchema module.',
    'add-producer': 'Generate a durable stream producer module.',
    'add-consumer': 'Generate a StreamDB factory, query island, and seed loader.',
  };
  return descriptions[command];
}
