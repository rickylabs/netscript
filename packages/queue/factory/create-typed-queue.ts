/**
 * Typed Queue Factory
 *
 * Factory function for creating type-safe queues with schema validation.
 * Validates messages at enqueue and dequeue time.
 *
 * @module
 */

import type { EnqueueOptions, ListenOptions, MessageContext, MessageQueue } from '../ports/mod.ts';
import { QueueValidationError, type TypedQueueOptions } from '../ports/mod.ts';
import type { ValidationSchema } from '../validation/mod.ts';
import { createQueue } from './create-queue.ts';

export type {
  EnqueueOptions,
  ListenOptions,
  MessageContext,
  MessageQueue,
  QueueConnectionOptions,
  QueueOptions,
  QueueProvider,
  TypedQueueOptions,
} from '../ports/mod.ts';
export type { ValidationSchema } from '../validation/mod.ts';

/**
 * Typed message queue with runtime schema validation.
 * Extends MessageQueue with runtime type safety.
 *
 * @template T - Message payload type (inferred from schema)
 */
export interface TypedMessageQueue<T> extends MessageQueue<T> {
  /**
   * The schema used for validation.
   */
  readonly schema: ValidationSchema<T>;
}

/**
 * Create a type-safe message queue with Zod validation.
 *
 * Validates messages at enqueue and dequeue time to ensure type safety.
 * Invalid messages can be discarded, moved to DLQ, or cause errors.
 *
 * @template T - Message payload type (inferred from schema)
 * @param name - Queue name for namespacing
 * @param schema - Zod schema for message validation
 * @param options - Queue configuration options
 * @returns TypedMessageQueue instance
 *
 * @example
 * ```ts
 * import { z } from 'zod';
 * import { createTypedQueue } from '@netscript/queue';
 *
 * const MessageSchema = z.object({
 *   type: z.enum(['email', 'sms']),
 *   to: z.string().email(),
 *   body: z.string(),
 * });
 *
 * const queue = createTypedQueue('notifications', MessageSchema);
 *
 * // Type-safe enqueue (compile-time + runtime validation)
 * await queue.enqueue({
 *   type: 'email',
 *   to: 'user@example.com',
 *   body: 'Hello!',
 * });
 *
 * // Type-safe handler
 * await queue.listen(async (message) => {
 *   // message is fully typed
 *   if (message.type === 'email') {
 *     await sendEmail(message.to, message.body);
 *   }
 * });
 * ```
 */
export function createTypedQueue<T>(
  name: string,
  schema: ValidationSchema<T>,
  options: TypedQueueOptions = {},
): TypedMessageQueue<T> {
  const {
    validateOnEnqueue = true,
    validateOnDequeue = true,
    onValidationError = 'discard',
    ...queueOptions
  } = options;

  // Create base queue
  const baseQueue = createQueue<T>(name, queueOptions);

  // Wrap with validation layer
  const typedQueue: TypedMessageQueue<T> = {
    schema,
    nativeRetrial: baseQueue.nativeRetrial,

    async enqueue(message: T, enqueueOptions?: EnqueueOptions): Promise<void> {
      if (validateOnEnqueue) {
        try {
          schema.parse(message);
        } catch (error) {
          throw new QueueValidationError(
            `Message validation failed on enqueue: ${
              error instanceof Error ? error.message : String(error)
            }`,
            {
              message,
              queueName: name,
              error: error instanceof Error ? error.message : String(error),
            },
          );
        }
      }

      await baseQueue.enqueue(message, enqueueOptions);
    },

    async enqueueMany(messages: T[], enqueueOptions?: EnqueueOptions): Promise<void> {
      if (validateOnEnqueue) {
        // Validate all messages before enqueueing
        for (let i = 0; i < messages.length; i++) {
          try {
            schema.parse(messages[i]);
          } catch (error) {
            throw new QueueValidationError(
              `Message validation failed on enqueue (index ${i}): ${
                error instanceof Error ? error.message : String(error)
              }`,
              {
                index: i,
                message: messages[i],
                queueName: name,
                error: error instanceof Error ? error.message : String(error),
              },
            );
          }
        }
      }

      if (baseQueue.enqueueMany) {
        await baseQueue.enqueueMany(messages, enqueueOptions);
      } else {
        // Fallback to sequential enqueue
        for (const message of messages) {
          await baseQueue.enqueue(message, enqueueOptions);
        }
      }
    },

    async listen(
      handler: (message: T, context: MessageContext) => Promise<void>,
      listenOptions?: ListenOptions,
    ): Promise<void> {
      await baseQueue.listen(async (rawMessage, context) => {
        let validatedMessage = rawMessage;

        if (validateOnDequeue) {
          const result = schema.safeParse(rawMessage);

          if (!result.success) {
            // Handle validation error based on configuration
            const errorMessage = `Invalid message received: ${result.error.message}`;

            switch (onValidationError) {
              case 'discard':
                // Discard invalid message (acknowledge without processing)
                await context.ack();
                return;

              case 'dlq':
                // Move to dead-letter queue (nack without requeue)
                await context.nack({ requeue: false });
                return;

              case 'throw':
                // Throw error to trigger retry
                throw new QueueValidationError(errorMessage, {
                  messageId: context.messageId,
                  message: rawMessage,
                  error: result.error.message,
                });
            }
          }

          validatedMessage = result.data;
        }

        // Call user handler with validated message
        await handler(validatedMessage, context);
      }, listenOptions);
    },

    async stop(): Promise<void> {
      await baseQueue.stop();
    },
  };

  return typedQueue;
}
