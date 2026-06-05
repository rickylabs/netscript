/**
 * `@netscript/sdk/streams` — SDK extension for durable stream publishing.
 *
 * Provides service-side helpers for writing to durable streams from
 * oRPC handlers, background tasks, or any server-side code.
 *
 * Re-exports `DurableStreamProducer`, `createDurableStream`, and related
 * config helpers from `@netscript/plugin-streams-core` so SDK consumers only need a
 * single import.
 *
 * @example
 * ```ts
 * import { createStreamProducer } from '@netscript/sdk/streams';
 * import { chatStreamSchema } from '../schemas.ts';
 *
 * const chatProducer = createStreamProducer({
 *   streamPath: `/user/chat-room-${roomId}`,
 *   schema: chatStreamSchema,
 *   producerId: `chat-service-1`,
 * });
 *
 * // In an oRPC handler:
 * chatProducer.upsert('message', { id: msg.id, content: msg.text, role: 'user' });
 * ```
 *
 * @module
 */

export {
  createDurableStream as createStreamProducer,
  DurableStreamProducer,
  type DurableStreamProducerOptions,
  defineStreamSchema,
  getStreamsUrl,
  getStreamsAuth,
  buildStreamUrl,
} from '@netscript/plugin-streams-core';
