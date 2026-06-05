/**
 * Queue Instrumentation
 *
 * Provides a TracedQueue wrapper that adds OpenTelemetry tracing to any MessageQueue.
 * Automatically creates spans for enqueue, dequeue, ack, and nack operations.
 *
 * @module
 */

import { type Context, context as otelContext, type Span, SpanKind } from '@opentelemetry/api';
import {
  addSpanEvent,
  createSpan,
  getQueueTracer,
  setSpanError,
  setSpanOk,
  withSpan,
} from '../core/mod.ts';
import {
  contextWithSpan,
  createMessageHeaders,
  resolveParentContextFromHeaders,
} from '../context/mod.ts';
import {
  createMessagingAttributes,
  MessagingAttributes,
  MessagingOperations,
  MessagingSystems,
  SpanNames,
} from '../attributes/mod.ts';
import type {
  EnqueueOptions,
  ListenOptions,
  MessageContext,
  MessageQueue,
  TracedMessageContext,
  TracedQueueOptions,
} from './types.ts';

// ============================================================================
// TRACED QUEUE WRAPPER
// ============================================================================

/**
 * TracedQueue - A wrapper that adds OpenTelemetry tracing to any MessageQueue.
 *
 * Features:
 * - Automatic span creation for enqueue/dequeue operations
 * - Trace context propagation through message headers
 * - Semantic messaging attributes following OTEL conventions
 * - Optional ack/nack tracing
 *
 * @example
 * ```ts
 * import { createQueue } from '@netscript/queue';
 * import { TracedQueue } from '@netscript/telemetry/instrumentation/queue';
 *
 * const innerQueue = createQueue<JobMessage>('jobs');
 * const queue = new TracedQueue(innerQueue, {
 *   queueName: 'jobs',
 *   system: 'deno-kv-polling',
 * });
 *
 * // Enqueue with automatic tracing
 * await queue.enqueue({ jobId: 'test', payload: {} });
 *
 * // Listen with automatic tracing
 * await queue.listen(async (message, context) => {
 *   // context.span is the processing span
 *   context.span.setAttribute('custom.attr', 'value');
 *   // ... process message
 * });
 * ```
 */
export class TracedQueue<T = unknown> implements MessageQueue<T> {
  private readonly inner: MessageQueue<T>;
  private readonly options: Required<TracedQueueOptions>;
  private readonly tracer = getQueueTracer();

  constructor(inner: MessageQueue<T>, options: TracedQueueOptions) {
    this.inner = inner;
    this.options = {
      queueName: options.queueName,
      system: options.system ?? MessagingSystems.DENO_KV_POLLING,
      propagateContext: options.propagateContext ?? true,
      traceAckNack: options.traceAckNack ?? true,
      attributePrefix: options.attributePrefix ?? '',
    };
  }

  /**
   * Whether the underlying queue supports native retry mechanisms.
   */
  get nativeRetrial(): boolean {
    return this.inner.nativeRetrial;
  }

  /**
   * Enqueue a message with tracing.
   *
   * Creates a PRODUCER span and injects trace context into message headers.
   */
  async enqueue(message: T, options?: EnqueueOptions): Promise<void> {
    const messageId = crypto.randomUUID();

    return await withSpan(
      this.tracer,
      SpanNames.QUEUE_ENQUEUE,
      async (span) => {
        // Set messaging attributes
        span.setAttributes(
          createMessagingAttributes({
            system: this.options.system,
            destination: this.options.queueName,
            operation: MessagingOperations.PUBLISH,
            messageId,
            priority: options?.priority,
          }),
        );

        // Prepare headers with trace context
        // IMPORTANT: If headers already contain traceparent (from scheduler.dispatch),
        // preserve it instead of overwriting with the queue.enqueue span's context.
        // This ensures the trace chain is: scheduler.dispatch -> queue.dequeue -> job.execute
        let headers = options?.headers ?? {};
        if (this.options.propagateContext && !headers['traceparent']) {
          headers = createMessageHeaders(headers);
        }

        // Add delay info if present
        if (options?.delay) {
          span.setAttribute('messaging.message.delay_ms', options.delay);
        }

        // Enqueue with updated headers
        await this.inner.enqueue(message, {
          ...options,
          headers,
        });

        addSpanEvent(span, 'message.enqueued', {
          [MessagingAttributes.MESSAGE_ID]: messageId,
        });
      },
      { kind: SpanKind.PRODUCER },
    );
  }

  /**
   * Enqueue multiple messages with tracing.
   *
   * Creates a PRODUCER span that covers all messages.
   */
  async enqueueMany(messages: T[], options?: EnqueueOptions): Promise<void> {
    if (!this.inner.enqueueMany) {
      // Fall back to sequential enqueue
      for (const message of messages) {
        await this.enqueue(message, options);
      }
      return;
    }

    const enqueueManyFn = this.inner.enqueueMany.bind(this.inner);

    return await withSpan(
      this.tracer,
      `${SpanNames.QUEUE_ENQUEUE}.batch`,
      async (span) => {
        span.setAttributes(
          createMessagingAttributes({
            system: this.options.system,
            destination: this.options.queueName,
            operation: MessagingOperations.PUBLISH,
          }),
        );
        span.setAttribute('messaging.batch.message_count', messages.length);

        // Prepare headers with trace context for all messages
        let headers = options?.headers ?? {};
        if (this.options.propagateContext) {
          headers = createMessageHeaders(headers);
        }

        await enqueueManyFn(messages, {
          ...options,
          headers,
        });

        addSpanEvent(span, 'batch.enqueued', {
          'messaging.batch.message_count': messages.length,
        });
      },
      { kind: SpanKind.PRODUCER },
    );
  }

  /**
   * Listen for messages with tracing.
   *
   * Creates a CONSUMER span for each message and provides the span in the context.
   */
  async listen(
    handler: (message: T, context: MessageContext) => Promise<void>,
    options?: ListenOptions,
  ): Promise<void> {
    const tracedHandler = async (message: T, ctx: MessageContext): Promise<void> => {
      // Extract parent context from message headers
      const parentContext = resolveParentContextFromHeaders(ctx.headers);

      // Create a consumer span linked to the producer
      const span = createSpan(
        this.tracer,
        SpanNames.QUEUE_DEQUEUE,
        {
          kind: SpanKind.CONSUMER,
          parentContext,
          attributes: createMessagingAttributes({
            system: this.options.system,
            destination: this.options.queueName,
            operation: MessagingOperations.RECEIVE,
            messageId: ctx.messageId,
            deliveryCount: ctx.deliveryCount,
          }),
        },
      );

      // Create a context that includes the queue.dequeue span
      // This ensures that any spans created by the handler (e.g., job.execute)
      // will be children of queue.dequeue, not of the original parent (scheduler.dispatch)
      const contextWithQueueSpan = contextWithSpan(span, parentContext);

      // Create traced context with wrapped ack/nack
      // Pass the context WITH the queue span so child spans are properly linked
      const tracedCtx = this.createTracedContext(ctx, span, contextWithQueueSpan);

      try {
        // Run handler within the queue span context so all child spans are linked
        await otelContext.with(contextWithQueueSpan, async () => {
          await handler(message, tracedCtx);
        });

        setSpanOk(span);
        addSpanEvent(span, 'message.processed');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setSpanError(span, message, error instanceof Error ? error : undefined);
        addSpanEvent(span, 'message.failed', { 'error.message': message });
        throw error;
      } finally {
        span.end();
      }
    };

    await this.inner.listen(tracedHandler, options);
  }

  /**
   * Stop listening for messages.
   */
  async stop(): Promise<void> {
    await this.inner.stop();
  }

  /**
   * Create a traced message context with wrapped ack/nack.
   */
  private createTracedContext(
    ctx: MessageContext,
    span: Span,
    parentContext: Context,
  ): TracedMessageContext {
    const traceAckNack = this.options.traceAckNack;
    const tracer = this.tracer;

    return {
      ...ctx,
      span,
      parentContext,

      async ack(): Promise<void> {
        if (traceAckNack) {
          const ackSpan = createSpan(
            tracer,
            SpanNames.QUEUE_ACK,
            {
              kind: SpanKind.INTERNAL,
              attributes: {
                [MessagingAttributes.MESSAGE_ID]: ctx.messageId,
                [MessagingAttributes.OPERATION]: MessagingOperations.ACK,
              },
            },
          );

          try {
            await ctx.ack();
            setSpanOk(ackSpan);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setSpanError(ackSpan, message);
            throw error;
          } finally {
            ackSpan.end();
          }
        } else {
          await ctx.ack();
        }
      },

      async nack(options?: { requeue?: boolean }): Promise<void> {
        if (traceAckNack) {
          const nackSpan = createSpan(
            tracer,
            SpanNames.QUEUE_NACK,
            {
              kind: SpanKind.INTERNAL,
              attributes: {
                [MessagingAttributes.MESSAGE_ID]: ctx.messageId,
                [MessagingAttributes.OPERATION]: MessagingOperations.NACK,
                'messaging.requeue': options?.requeue ?? true,
              },
            },
          );

          try {
            await ctx.nack(options);
            setSpanOk(nackSpan);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setSpanError(nackSpan, message);
            throw error;
          } finally {
            nackSpan.end();
          }
        } else {
          await ctx.nack(options);
        }
      },
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Wrap a MessageQueue with tracing instrumentation.
 *
 * @param queue - The queue to wrap
 * @param options - Tracing options
 * @returns Traced queue wrapper
 *
 * @example
 * ```ts
 * const tracedQueue = traceQueue(innerQueue, { queueName: 'jobs' });
 * ```
 */
export function traceQueue<T>(
  queue: MessageQueue<T>,
  options: TracedQueueOptions,
): TracedQueue<T> {
  return new TracedQueue(queue, options);
}

/**
 * Check if a queue is already traced.
 */
export function isTracedQueue<T>(queue: MessageQueue<T>): queue is TracedQueue<T> {
  return queue instanceof TracedQueue;
}
