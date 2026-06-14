/**
 * `@netscript/sdk/streams` durable stream publishing facade.
 *
 * This subpath re-exports the first-party stream producer surface from
 * `@netscript/plugin-streams-core` for SDK consumers that publish stream
 * events from oRPC handlers, service jobs, or other server-side workflows.
 *
 * The facade keeps stream producer imports colocated with the rest of the SDK
 * without changing stream-core behavior. It also re-exports the plugin-core
 * type chain so generated SDK docs can resolve the durable stream public
 * surface without private type references.
 *
 * @example
 * ```ts
 * import { createStreamProducer } from '@netscript/sdk/streams';
 *
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
