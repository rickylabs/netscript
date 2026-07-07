import { assertEquals } from '@std/assert';
import { createFanInLinks } from '../../mod.ts';
import { createOtelDenoSpanLink, createOtelSdkSpanLink } from '../../src/adapters/otel/mod.ts';

Deno.test('createFanInLinks preserves SDK link attributes and records Deno-native drops', () => {
  const messages = [{
    traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
    tracestate: 'vendor=value',
    attributes: {
      'messaging.message.id': 'msg-1',
      'netscript.correlation.id': 'corr-1',
    },
  }];

  const sdkLinks = createFanInLinks(messages, createOtelSdkSpanLink());
  assertEquals(sdkLinks.length, 1);
  assertEquals(sdkLinks[0]?.context.traceId, '4bf92f3577b34da6a3ce929d0e0e4736');
  assertEquals(sdkLinks[0]?.context.spanId, '00f067aa0ba902b7');
  assertEquals(sdkLinks[0]?.attributes?.['messaging.message.id'], 'msg-1');
  assertEquals(sdkLinks[0]?.attributes?.['netscript.correlation.id'], 'corr-1');

  const denoLinks = createFanInLinks(messages, createOtelDenoSpanLink());
  assertEquals(denoLinks.length, 1);
  assertEquals(denoLinks[0]?.attributes, undefined);
  assertEquals(denoLinks[0]?.droppedAttributesCount, 2);
});
