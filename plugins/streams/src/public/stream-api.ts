import type { StandardSchemaV1 } from '@standard-schema/spec';

/** Typed stream topic definition. */
export interface StreamTopicDefinition<TPayload = never> {
  readonly name: string;
  readonly schema: StandardSchemaV1<TPayload>;
}

/** Define a typed stream topic. */
export function defineStreamTopic<TPayload>(
  name: string,
  schema: StandardSchemaV1<TPayload>,
): StreamTopicDefinition<TPayload> {
  return Object.freeze({ name, schema });
}

/** Stub producer handle for downstream plugin manifests. */
export interface StreamProducerHandle<TPayload> {
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
  readonly subscribe: (handler: (payload: TPayload) => void) => () => void;
}

/** Create a typed consumer handle for a topic. */
export function defineStreamConsumer<TPayload>(
  _topic: StreamTopicDefinition<TPayload>,
): StreamConsumerHandle<TPayload> {
  return Object.freeze({
    subscribe: (_handler: (payload: TPayload) => void): (() => void) => {
      return (): void => {};
    },
  });
}
