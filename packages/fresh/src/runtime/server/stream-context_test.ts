import { assertEquals } from '@std/assert';
import { h } from 'preact';
import { renderToStream } from './stream.ts';

Deno.test('default streaming renderer preserves legacy context with the Preact options slot', async () => {
  const ContextReader = (_props: object, context: { locale?: string }) =>
    h('span', null, context.locale ?? 'missing');
  const { stream, allReady } = renderToStream(h(ContextReader, {}), {
    context: { locale: 'qualified' },
  });
  const html = await new Response(stream).text();
  await allReady;
  assertEquals(html, '<span>qualified</span>');
});
