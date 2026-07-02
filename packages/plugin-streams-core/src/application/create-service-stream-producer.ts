import type { StreamStateDefinition } from '../domain/stream-schema.ts';
import {
  createDurableStream,
  type DurableStreamProducer,
  type DurableStreamProducerOptions,
} from './create-durable-stream.ts';
import { getStreamsAuth, getStreamsUrl } from './stream-url-resolver.ts';

export type {
  DurableStreamProducer,
  DurableStreamProducerOptions,
} from './create-durable-stream.ts';

/** Options accepted by {@link createServiceStreamProducer}. */
export interface ServiceStreamProducerOptions<TDef extends StreamStateDefinition>
  extends DurableStreamProducerOptions<TDef> {
  /**
   * Eagerly resolve the streams URL and auth headers when the producer is
   * created so a misconfigured Service fails fast instead of silently dropping
   * events. Defaults to `true`.
   *
   * @remarks A backend Service that declares `ServiceReferences: ["streams"]`
   * always has `services__streams__http__0` (or `DURABLE_STREAMS_URL`) wired, so
   * this resolves without throwing. Set to `false` to keep the tolerant,
   * lazy-connect behavior of {@link createDurableStream} when a Service may start
   * before the streams service is reachable.
   */
  readonly assertResolvable?: boolean;
}

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
 * Unlike {@link createDurableStream}, it eagerly validates that the streams URL
 * and auth resolve (`assertResolvable`, default `true`) so a Service that
 * forgot to declare the `streams` reference fails at construction rather than
 * silently dropping writes.
 *
 * @param options - Producer options plus the optional `assertResolvable` gate.
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
  const { assertResolvable = true, ...producerOptions } = options;
  if (assertResolvable) {
    // Throws a clear, immediate error when the streams service is not wired,
    // instead of the tolerant warn-and-drop path taken by a lazy connect.
    getStreamsUrl();
    getStreamsAuth();
  }
  return createDurableStream(producerOptions);
}
