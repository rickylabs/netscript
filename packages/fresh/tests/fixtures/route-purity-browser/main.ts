import { App, staticFiles } from 'fresh';
import { Partial } from 'fresh/runtime';
import { h } from 'preact';
import { z } from 'zod';
import RouteHarness from './app.tsx';
import { pairedChannel } from './contracts.ts';

const app: App<unknown> = new App();
app.use(staticFiles());
app.get('/favicon.ico', () => new Response(null, { status: 204 }));
function page(channel: 'A' | 'B') {
  return h(
    'html',
    null,
    h('head', null, h('title', null, `Channel ${channel}`)),
    h(
      'body',
      { 'f-client-nav': true },
      h(
        Partial,
        { name: 'channel-panel' },
        h(
          'nav',
          null,
          h(
            'a',
            { id: 'to-a', ...pairedChannel.getLinkProps({ path: { channel: 'A' } }) },
            'Channel A',
          ),
          h(
            'a',
            { id: 'to-b', ...pairedChannel.getLinkProps({ path: { channel: 'B' } }) },
            'Channel B',
          ),
        ),
        h(RouteHarness, { key: channel, channel }),
      ),
    ),
  );
}
for (const pattern of ['/channel/:channel', '/partials/channel/:channel']) {
  app.get(pattern, (ctx) => ctx.render(page(z.enum(['A', 'B']).parse(ctx.params.channel))));
}
const requests: { channel: string; resumed: boolean }[] = [];
app.get('/chat/read', (ctx) => Response.json({ channel: ctx.url.searchParams.get('id') }));
app.get('/stats', () => Response.json(requests));
const bodySchema = z.object({ threadId: z.string(), runId: z.string() });
app.get('/chat/send', (ctx) => {
  const channel = ctx.url.searchParams.get('id');
  return Response.json({
    messages: [{
      id: `seed-${channel}`,
      role: 'assistant',
      parts: [{ type: 'text', content: `transcript-${channel}` }],
    }],
    activeRun: null,
    interrupts: null,
  });
});
app.post('/chat/send', async (ctx) => {
  const channel = z.enum(['A', 'B']).parse(ctx.url.searchParams.get('id'));
  const { threadId, runId } = bodySchema.parse(await ctx.req.json());
  const resumed = ctx.req.headers.has('Last-Event-ID');
  requests.push({ channel, resumed });
  const messageId = `reply-${runId}`;
  const chunks = resumed
    ? [
      { type: 'TEXT_MESSAGE_CONTENT', messageId, delta: 'resumed' },
      { type: 'TEXT_MESSAGE_END', messageId },
      { type: 'RUN_FINISHED', threadId, runId },
    ]
    : [
      { type: 'RUN_STARTED', threadId, runId },
      { type: 'TEXT_MESSAGE_START', messageId, role: 'assistant' },
      { type: 'TEXT_MESSAGE_CONTENT', messageId, delta: `live-${channel}-` },
    ];
  // A real incomplete SSE response forces the native transport to resume from its offset.
  const events = chunks.map((chunk, index) =>
    `id: ${index + (resumed ? 4 : 1)}\ndata: ${JSON.stringify(chunk)}\n\n`
  ).join('');
  return new Response(events, { headers: { 'Content-Type': 'text/event-stream' } });
});
export { app };
export default app;
