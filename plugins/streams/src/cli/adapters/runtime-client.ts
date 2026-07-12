import {
  buildStreamUrl,
  createDurableStream,
  defineStreamSchema,
  getStreamsAuth,
  inspectStreamTopic,
  type StateSchema,
  type StreamStateDefinition,
  type StreamTopicInspectionReport,
} from '@netscript/plugin-streams-core';
import type {
  ClearStreamInput,
  DiscoveredStreamTopic,
  PublishStreamInput,
  SubscribeStreamInput,
} from '../streams-types.ts';

const passthroughSchema = {
  '~standard': {
    version: 1,
    vendor: 'netscript-streams-cli',
    validate: (value: unknown) => ({ value }),
  },
} as const;

/** Publish one test entity through the core durable-stream producer. */
export async function publishStreamEvent(
  input: PublishStreamInput,
): Promise<Readonly<Record<string, unknown>>> {
  configureBaseUrl(input.baseUrl);
  const schema = schemaForTopic(input.topic, input.collection);
  const definition = schema[input.collection];
  const primaryKey = definition?.primaryKey ?? 'id';
  const value = input.value[primaryKey] === undefined
    ? { ...input.value, [primaryKey]: crypto.randomUUID() }
    : input.value;
  const producer = createDurableStream({
    streamPath: topicPath(input.topic),
    schema,
    producerId: input.producerId ?? input.topic.producerId ?? 'netscript-streams-cli',
  });
  producer.upsert(input.collection, value);
  await producer.flush();
  await producer.close();
  return value;
}

/** Read all currently available JSON entities from one durable stream. */
export async function subscribeToStream(
  input: SubscribeStreamInput,
): Promise<readonly unknown[]> {
  const url = new URL(buildStreamUrl(topicPath(input.topic), input.baseUrl));
  url.searchParams.set('offset', input.offset ?? '-1');
  const response = await fetch(url, {
    headers: getStreamsAuth(),
    signal: input.signal,
  });
  if (!response.ok) throw new Error(`Stream read failed with HTTP ${response.status}.`);
  const value: unknown = await response.json();
  return Array.isArray(value) ? value : [value];
}

/** Return the core-owned JSON-stable inspection report for a topic. */
export function inspectDiscoveredTopic(
  topic: DiscoveredStreamTopic,
): StreamTopicInspectionReport {
  return inspectStreamTopic({
    target: topic.name,
    schema: schemaForTopic(topic),
    streamPath: topic.streamPath,
    producerId: topic.producerId,
  });
}

/** Delete one durable stream so development state starts empty. */
export async function clearStream(input: ClearStreamInput): Promise<void> {
  const response = await fetch(buildStreamUrl(topicPath(input.topic), input.baseUrl), {
    method: 'DELETE',
    headers: getStreamsAuth(),
    signal: input.signal,
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Stream clear failed with HTTP ${response.status}.`);
  }
}

function schemaForTopic(
  topic: DiscoveredStreamTopic,
  fallbackCollection?: string,
): StateSchema<StreamStateDefinition> {
  const collections = topic.collections.length > 0
    ? topic.collections
    : fallbackCollection
    ? [{ name: fallbackCollection, type: fallbackCollection, primaryKey: 'id' }]
    : [];
  const definition: StreamStateDefinition = Object.fromEntries(
    collections.map((collection) => [
      collection.name,
      {
        schema: passthroughSchema,
        type: collection.type,
        primaryKey: collection.primaryKey,
      },
    ]),
  );
  return defineStreamSchema(definition);
}

function topicPath(topic: DiscoveredStreamTopic): string {
  return topic.streamPath ?? (topic.name.startsWith('/') ? topic.name : `/${topic.name}`);
}

function configureBaseUrl(baseUrl?: string): void {
  if (baseUrl) Deno.env.set('DURABLE_STREAMS_URL', baseUrl);
}
