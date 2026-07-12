import type { StreamTopicInspectionReport } from '@netscript/plugin-streams-core';

/** One collection declared by a discovered durable stream schema. */
export interface DiscoveredStreamCollection {
  /** Collection key passed to stream producers. */
  readonly name: string;
  /** State Protocol event type emitted by the collection. */
  readonly type: string;
  /** Entity property used as the stream key. */
  readonly primaryKey: string;
}

/** Static stream metadata discovered from a project producer module. */
export interface DiscoveredStreamTopic {
  /** Stable topic name shown by the CLI. */
  readonly name: string;
  /** Durable stream route when declared in source. */
  readonly streamPath?: string;
  /** Stable producer identity when declared in source. */
  readonly producerId?: string;
  /** Project-relative producer module. */
  readonly producerFile: string;
  /** Collections found in the producer's sibling schema. */
  readonly collections: readonly DiscoveredStreamCollection[];
}

/** Input used to publish one test entity. */
export interface PublishStreamInput {
  readonly topic: DiscoveredStreamTopic;
  readonly collection: string;
  readonly value: Readonly<Record<string, unknown>>;
  readonly baseUrl?: string;
  readonly producerId?: string;
}

/** Input used to read the current contents of a stream. */
export interface SubscribeStreamInput {
  readonly topic: DiscoveredStreamTopic;
  readonly baseUrl?: string;
  readonly offset?: string;
  readonly signal?: AbortSignal;
}

/** Input used to clear one development stream. */
export interface ClearStreamInput {
  readonly topic: DiscoveredStreamTopic;
  readonly baseUrl?: string;
  readonly signal?: AbortSignal;
}

/** Runtime and discovery seams consumed by the Streams command group. */
export interface StreamsCliServices {
  /** Return the default project root for this invocation. */
  readonly workspaceRoot: () => string;
  /** Discover producer-backed topics beneath a project root. */
  readonly discoverTopics: (workspaceRoot: string) => Promise<readonly DiscoveredStreamTopic[]>;
  /** Publish one entity and wait until the write is flushed. */
  readonly publish: (input: PublishStreamInput) => Promise<Readonly<Record<string, unknown>>>;
  /** Read the current stream contents. */
  readonly subscribe: (input: SubscribeStreamInput) => Promise<readonly unknown[]>;
  /** Return the core-owned JSON-stable topic report. */
  readonly inspect: (topic: DiscoveredStreamTopic) => StreamTopicInspectionReport;
  /** Delete one development stream. */
  readonly clear: (input: ClearStreamInput) => Promise<void>;
}
