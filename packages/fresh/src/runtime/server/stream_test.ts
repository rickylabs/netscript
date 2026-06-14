import { assertEquals } from '@std/assert';
import {
  renderToStream,
  type StreamingRenderable,
  type StreamingRenderer,
  type StreamingRenderStream,
} from './stream.ts';

Deno.test('renderToStream cancels the renderer stream when the signal aborts', () => {
  const controller = new AbortController();
  let canceled = false;
  let renderedContext: Record<string, unknown> | undefined;

  const renderer: StreamingRenderer = (
    _vnode: StreamingRenderable,
    context?: Record<string, unknown>,
  ) => {
    renderedContext = context;

    const stream = new ReadableStream<Uint8Array>();
    return Object.assign(stream, {
      allReady: Promise.resolve(),
      cancel() {
        canceled = true;
        return Promise.resolve();
      },
    }) as StreamingRenderStream;
  };

  renderToStream({ type: 'page' }, {
    context: { requestId: 'stream-test' },
    renderer,
    signal: controller.signal,
  });

  controller.abort();

  assertEquals(canceled, true);
  assertEquals(renderedContext, { requestId: 'stream-test' });
});

Deno.test('renderToStream cancels immediately when the signal is already aborted', () => {
  const controller = new AbortController();
  controller.abort();
  let canceled = false;

  const renderer: StreamingRenderer = () => {
    const stream = new ReadableStream<Uint8Array>();
    return Object.assign(stream, {
      allReady: Promise.resolve(),
      cancel() {
        canceled = true;
        return Promise.resolve();
      },
    }) as StreamingRenderStream;
  };

  renderToStream({ type: 'page' }, {
    renderer,
    signal: controller.signal,
  });

  assertEquals(canceled, true);
});
