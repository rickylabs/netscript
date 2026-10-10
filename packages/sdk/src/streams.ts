/**
 * `@netscript/sdk/streams` durable stream publishing and fetch-consumer facade.
 *
 * This subpath re-exports the first-party stream producer surface from
 * `@netscript/plugin-streams-core` for SDK consumers that publish stream
 * events from oRPC handlers, service jobs, or other server-side workflows.
 *
 * `createFetchStreamEventSourceV1` supplies a DOM-independent consumer transport
 * for the same versioned SSE binding, with injected streaming fetch and auth.
 * Shared/browser/React Native consumers should use `@netscript/sdk/streams/consumer`
 * to keep server producer telemetry out of their import graph.
 *
 * The facade keeps stream producer imports colocated with the rest of the SDK
 * without changing stream-core behavior. It also re-exports the plugin-core
 * type chain so generated SDK docs can resolve the durable stream public
 * surface without private type references.
 *
 * @example
 * ```ts
 * import {
 *   createStreamProducer,
 *   type StateSchema,
 *   type StreamStateDefinition,
 * } from '@netscript/sdk/streams';
 *
 * declare const chatStreamSchema: StateSchema<StreamStateDefinition>;
 *
 * // Note: framework prepends STREAMS_URL_PREFIX ('/v1/stream/netscript');
 * // '/user/chat-room-1' resolves to '<base>/v1/stream/netscript/user/chat-room-1'.
 * const producer = createStreamProducer({
 *   streamPath: '/user/chat-room-1',
 *   schema: chatStreamSchema,
 *   producerId: 'chat-service-1',
 * });
 * ```
 *
 * @module
 */

export {
  buildStreamUrl,
  createDurableStream as createStreamProducer,
  defineStreamSchema,
  DurableStreamProducer,
  getStreamsAuth,
  getStreamsUrl,
} from '@netscript/plugin-streams-core';
export type * from '@netscript/plugin-streams-core';

export {
  bindStreamEventSourceV1,
  createFetchStreamEventSourceV1,
} from './client/stream-source/mod.ts';
export type * from './client/stream-source/mod.ts';
