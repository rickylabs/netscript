import { assertEquals } from '@std/assert';
import {
  type MessageContext,
  type MessageQueue,
  type TracedMessageContext,
  TracedQueue,
} from '@netscript/telemetry/instrumentation';

async function consumerContract(inner: MessageQueue<{ jobId: string }>): Promise<void> {
  const queue = new TracedQueue(inner, { queueName: 'jobs' });
  await queue.listen(async (message, ctx) => {
    const contract: TracedMessageContext = ctx;
    ctx.span.setAttribute('job.id', message.jobId);
    contract.span.addEvent('consumer.step');
    await ctx.ack();
  });
  const plain: MessageQueue<{ jobId: string }> = queue;
  const plainHandler = async (_message: { jobId: string }, ctx: MessageContext): Promise<void> => {
    await ctx.ack();
  };
  await plain.listen(plainHandler);
  await queue.listen(plainHandler);
}

Deno.test('TracedQueue consumer context type supports spans and plain handlers', () => {
  assertEquals(typeof consumerContract, 'function');
});
