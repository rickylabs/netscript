import { assertEquals } from '@std/assert';
import { createMessagingAttributes, MessagingAttributes } from '../../attributes.ts';

Deno.test('attribute helper builders produce expected semantic keys', () => {
  const messaging = createMessagingAttributes({
    system: 'redis',
    destination: 'jobs',
    operation: 'publish',
    messageId: 'msg-1',
  });

  assertEquals(messaging[MessagingAttributes.SYSTEM], 'redis');
  assertEquals(messaging[MessagingAttributes.MESSAGE_ID], 'msg-1');
});
