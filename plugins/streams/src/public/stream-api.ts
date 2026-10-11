import type { StandardSchemaV1 } from '@standard-schema/spec';

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

/** Package-owned structural payload schema accepted by stream topic definitions. */
export interface StreamPayloadSchema<TPayload = unknown>
  extends StandardSchemaV1<unknown, TPayload> {}
