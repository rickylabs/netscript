/** Typed stream topic definition. */
export interface StreamTopicDefinition<TPayload = never> {
  /** Durable stream topic name. */
  readonly name: string;
  /** Payload schema accepted by this stream topic. */
  readonly schema: StreamPayloadSchema<TPayload>;
}

/** Define a typed stream topic. */
export function defineStreamTopic<TPayload>(
  name: string,
  schema: StreamPayloadSchema<TPayload>,
): StreamTopicDefinition<TPayload> {
  return Object.freeze({ name, schema });
}

/** Stub producer handle for downstream plugin manifests. */
export interface StreamProducerHandle<TPayload> {
  /** Publish a payload to the configured stream topic. */
  readonly publish: (payload: TPayload) => Promise<void>;
}

/** Create a typed producer handle for a topic. */
export function defineStreamProducer<TPayload>(
  _topic: StreamTopicDefinition<TPayload>,
): StreamProducerHandle<TPayload> {
  return Object.freeze({
    publish: async (_payload: TPayload): Promise<void> => {},
  });
}

/** Stub consumer handle for downstream plugin manifests. */
export interface StreamConsumerHandle<TPayload> {
  /** Subscribe to topic payloads and return an unsubscribe callback. */
  readonly subscribe: (handler: (payload: TPayload) => void) => () => void;
}

/** Create a typed consumer handle for a topic. */
export function defineStreamConsumer<TPayload>(
  _topic: StreamTopicDefinition<TPayload>,
): StreamConsumerHandle<TPayload> {
  return Object.freeze({
    subscribe: (_handler: (payload: TPayload) => void): () => void => {
      return (): void => {};
    },
  });
}

/** Package-owned structural payload schema accepted by stream topic definitions. */
export interface StreamPayloadSchema<TPayload = unknown> {
  /** Standard Schema-compatible metadata used by validators. */
  readonly '~standard': {
    /** Standard Schema version marker. */
    readonly version: 1;
    /** Schema vendor identifier. */
    readonly vendor: string;
    /** Validate an unknown payload value. */
    readonly validate: (value: unknown) => unknown;
    /** Optional input/output type witness carried by Standard Schema providers. */
    readonly types?: unknown;
  };
}
