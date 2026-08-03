import type { StreamStateDefinition } from '../domain/stream-schema.ts';
import {
  createDurableStream,
  type DurableStreamProducer,
  type DurableStreamProducerOptions,
} from './create-durable-stream.ts';

export type {
  DurableStreamProducer,
  DurableStreamProducerOptions,
} from './create-durable-stream.ts';

/** Options accepted by {@link createServiceStreamProducer}. */
export type ServiceStreamProducerOptions<TDef extends StreamStateDefinition> =
  DurableStreamProducerOptions<TDef>;

/**
 * Create a durable stream producer from a backend Service.
 *
 * This is the blessed Service-facing entry point for producing durable streams:
 * a Service (for example, an ingestion worker emitting a completion event) gets
 * one obvious factory instead of reaching for {@link createDurableStream} and
 * the URL/auth resolvers directly. It reuses the exact same singleton producer
 * and Aspire service-discovery resolution (`getStreamsUrl` / `getStreamsAuth`,
 * env `DURABLE_STREAMS_URL` / `services__streams__http__0` and
 * `STREAMS_SECRET` / `DURABLE_STREAMS_SECRET`) as the plugin services.
 *
 * Producer construction validates that the streams URL and auth resolve, so a
 * Service that forgot to declare the `streams` reference fails immediately
 * rather than silently dropping writes.
 *
 * @param options - Durable stream producer options.
 * @returns The singleton {@link DurableStreamProducer} for the stream path.
 *
 * @example Emit a completion event from a Service
 * ```ts
 * import {
 *   createServiceStreamProducer,
 *   defineStreamSchema,
 * } from "@netscript/plugin-streams-core";
 *
 * const schema = defineStreamSchema({
 *   completion: { schema, type: "completion", primaryKey: "id" },
 * });
 *
 * const producer = createServiceStreamProducer({
 *   streamPath: "/eischat/completions",
 *   schema,
 *   producerId: "eischat-service",
 * });
 *
 * producer.upsert("completion", { id: "run-1", status: "done" });
 * await producer.flush();
 * ```
 */
export function createServiceStreamProducer<TDef extends StreamStateDefinition>(
  options: ServiceStreamProducerOptions<TDef>,
): DurableStreamProducer<TDef> {
  return createDurableStream(options);
}
