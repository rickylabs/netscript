import { assert, assertEquals, assertRejects } from '@std/assert';
import { trace } from '@opentelemetry/api';
import type { MessageQueue as PlainMessageQueue } from '@netscript/queue/ports';
import {
  type MessageContext,
  type MessageQueue,
  TracedQueue,
  type TracedQueueMessageContext,
} from '@netscript/telemetry/instrumentation';
import { getSpanFromContext } from '@netscript/telemetry/context';
import { recording } from '../commands/native-fixture.ts';

Deno.test('TracedQueue delivers the active consumer span and remains a plain MessageQueue', async () => {
  await recording(async (_tracer, exporter) => {
    const message = { jobId: 'job-1', payload: 'PRIVATE_PAYLOAD' };
    let acknowledgements = 0;
    let requeues = 0;
    const headers = {
      traceparent: '00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01',
      authorization: 'PRIVATE_HEADER',
    };
    const context: MessageContext = {
      messageId: 'message-1',
      deliveryCount: 1,
      enqueuedAt: new Date(0),
      headers,
      ack: () => {
        acknowledgements++;
        return Promise.resolve();
      },
      nack: (options) => {
        if (options?.requeue) requeues++;
        return Promise.resolve();
      },
    };
    const inner: MessageQueue<typeof message> = {
      nativeRetrial: false,
      enqueue: () => Promise.resolve(),
      listen: async (handler) => {
        await handler(message, context);
      },
      stop: () => Promise.resolve(),
    };
    const queue = new TracedQueue(inner, { queueName: 'jobs' });
    await queue.listen(async (received, ctx) => {
      const contract: TracedQueueMessageContext = ctx;
      assert(ctx.span === trace.getActiveSpan());
      assert(ctx.parentContext);
      assert(getSpanFromContext(ctx.parentContext) === ctx.span);
      assertEquals(ctx.span.spanContext().traceId, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
      assertEquals(ctx.headers, headers);
      assertEquals(ctx.messageId, context.messageId);
      assertEquals(ctx.deliveryCount, context.deliveryCount);
      assertEquals(ctx.enqueuedAt, context.enqueuedAt);
      assert(ctx.span.isRecording());
      contract.span.setAttribute('job.id', received.jobId);
      await ctx.ack();
      await ctx.nack({ requeue: true });
    });
    const plain: PlainMessageQueue<typeof message> = queue;
    await plain.listen(async (_received, ctx) => {
      await ctx.ack();
    });
    assertEquals(acknowledgements, 2);
    assertEquals(requeues, 1);
    const consumers = exporter.getFinishedSpans().filter((span) => span.name === 'queue.dequeue');
    assertEquals(consumers.length, 2);
    assert(consumers[0]);
    assertEquals(consumers[0].attributes['job.id'], message.jobId);
    assertEquals(consumers[0].parentSpanContext?.spanId, 'bbbbbbbbbbbbbbbb');
    const exported = JSON.stringify(
      exporter.getFinishedSpans().map(({ attributes, events }) => ({ attributes, events })),
    );
    assert(!exported.includes('PRIVATE_PAYLOAD'));
    assert(!exported.includes('PRIVATE_HEADER'));
  });
});

Deno.test('TracedQueue post-success span fault never rejects delivery or triggers nack while handler errors still propagate', async () => {
  await recording(async () => {
    let acks = 0;
    let nacks = 0;
    const inner: MessageQueue<string> = {
      nativeRetrial: true,
      enqueue: () => Promise.resolve(),
      listen: async (handler) => {
        const ctx: MessageContext = {
          messageId: 'm-ok',
          deliveryCount: 1,
          enqueuedAt: new Date(0),
          headers: {},
          ack: () => {
            acks += 1;
            return Promise.resolve();
          },
          nack: () => {
            nacks += 1;
            return Promise.resolve();
          },
        };
        try {
          await handler('ok', ctx);
          await ctx.ack();
        } catch {
          await ctx.nack({ requeue: true });
        }
      },
      stop: () => Promise.resolve(),
    };
    const queue = new TracedQueue(inner, { queueName: 'traced-post-success' });

    await queue.listen(async (_message, ctx) => {
      ctx.span.end = () => {
        throw new Error('queue.dequeue span end failed');
      };
      ctx.span.addEvent = () => {
        throw new Error('queue.dequeue addEvent failed');
      };
      await Promise.resolve();
    });
    assertEquals(acks, 1, 'post-success span fault must still acknowledge delivery');
    assertEquals(nacks, 0, 'post-success span fault must not trigger nack');

    // Real handler failures must still reject even if span error reporting throws.
    const failingInner: MessageQueue<string> = {
      nativeRetrial: false,
      enqueue: () => Promise.resolve(),
      listen: async (handler) => {
        await handler('bad', {
          messageId: 'm-bad',
          deliveryCount: 1,
          enqueuedAt: new Date(0),
          headers: {},
          ack: () => Promise.resolve(),
          nack: () => Promise.resolve(),
        });
      },
      stop: () => Promise.resolve(),
    };
    const failingQueue = new TracedQueue(failingInner, { queueName: 'failing' });
    await assertRejects(
      () =>
        failingQueue.listen((_msg, ctx) => {
          ctx.span.setStatus = () => {
            throw new Error('span status fault');
          };
          return Promise.reject(new Error('real handler boom'));
        }),
      Error,
      'real handler boom',
    );
  });
});
