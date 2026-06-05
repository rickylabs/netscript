/**
 * Streaming HTML renderer for Fresh pages using Preact's renderToReadableStream.
 *
 * Provides progressive HTML delivery via Suspense boundaries, enabling
 * Partial Streaming Rendering (PSR) where shell HTML is sent immediately
 * and deferred regions stream in as their data resolves.
 *
 * @module
 */

import { renderToReadableStream } from 'preact-render-to-string/stream';
import { render as renderToString } from 'preact-render-to-string';
import type { VNode } from 'preact';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for streaming HTML rendering.
 */
export interface StreamRenderOptions {
  /** AbortSignal to cancel the stream. */
  signal?: AbortSignal;
  /** Preact context object passed to `renderToReadableStream`. */
  context?: Record<string, unknown>;
  /** Called when all Suspense boundaries have resolved. */
  onAllReady?: () => void;
  /** Called when a stream-level error occurs. */
  onError?: (error: unknown) => void;
  /** Custom response headers merged onto defaults. */
  headers?: Record<string, string>;
  /** HTTP status code (default: 200). */
  status?: number;
}

/**
 * Result of a streaming render operation.
 */
export interface StreamRenderResult {
  /** The readable stream of HTML chunks (UTF-8). */
  stream: ReadableStream<Uint8Array>;
  /**
   * Promise that resolves once every Suspense boundary in the tree has
   * settled.  Useful for tests or for deciding when to close a connection.
   */
  allReady: Promise<void>;
}

export interface IncrementalStreamChunk {
  slotId: string;
  render: () => Promise<string>;
}

// ============================================================================
// STREAMING RENDERER
// ============================================================================

/**
 * Render a Preact VNode tree to a `ReadableStream` with Suspense streaming.
 *
 * Components wrapped in `<Suspense>` boundaries will have their fallback
 * HTML sent in the initial shell.  Once each boundary resolves the
 * replacement HTML is streamed in-band.
 *
 * @example
 * ```ts
 * import { renderToStream } from '@netscript/fresh/server/stream';
 *
 * const { stream, allReady } = await renderToStream(<App />);
 * await allReady; // optional — wait until fully flushed
 * ```
 */
export function renderToStream(
  vnode: VNode,
  options: StreamRenderOptions = {},
): StreamRenderResult {
  const renderStream = renderToReadableStream(vnode, options.context);

  // Wire the allReady notification.
  const allReady = renderStream.allReady.then(() => {
    options.onAllReady?.();
  });

  // If an AbortSignal is provided, cancel the stream on abort.
  if (options.signal) {
    const onAbort = () => {
      try {
        renderStream.cancel();
      } catch {
        // Stream may already be closed.
      }
    };

    if (options.signal.aborted) {
      onAbort();
    } else {
      options.signal.addEventListener('abort', onAbort, { once: true });
    }
  }

  return { stream: renderStream, allReady };
}

// ============================================================================
// RESPONSE FACTORY
// ============================================================================

/** Default headers applied to every streaming response. */
const STREAMING_HEADERS: Record<string, string> = {
  'Content-Type': 'text/html; charset=utf-8',
  'Transfer-Encoding': 'chunked',
  'Cache-Control': 'no-transform',
  'X-Content-Type-Options': 'nosniff',
};

/**
 * Create a streaming HTTP `Response` from a Preact VNode tree.
 *
 * This is the high-level API for route handlers that want progressive
 * HTML delivery.  The response body is a `ReadableStream` of UTF-8 HTML
 * chunks.
 *
 * @example
 * ```ts
 * import { createStreamingResponse } from '@netscript/fresh/server/stream';
 *
 * export const handler = {
 *   async GET() {
 *     return await createStreamingResponse(<App />);
 *   },
 * };
 * ```
 */
export function createStreamingResponse(
  vnode: VNode,
  options: StreamRenderOptions = {},
): Response {
  const { stream } = renderToStream(vnode, options);

  const headers = new Headers({
    ...STREAMING_HEADERS,
    ...options.headers,
  });

  return new Response(stream, {
    status: options.status ?? 200,
    headers,
  });
}

function encodeHtmlChunk(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function createPatchScript(slotId: string, templateId: string): string {
  return `<script>(function(){const root=document.getElementById(${
    JSON.stringify(slotId)
  });const tpl=document.getElementById(${
    JSON.stringify(templateId)
  });if(!root||!tpl){return;}root.replaceChildren(tpl.content.cloneNode(true));for(const stale of root.querySelectorAll('script')){const next=document.createElement('script');for(const attr of stale.getAttributeNames()){const value=stale.getAttribute(attr);if(value!==null){next.setAttribute(attr,value);}}next.textContent=stale.textContent;stale.replaceWith(next);}tpl.remove();})();</script>`;
}

async function* settleChunks(chunks: IncrementalStreamChunk[]): AsyncGenerator<string> {
  const pending = new Map(
    chunks.map((chunk, index) => [
      index,
      chunk.render().then((html) => ({ index, chunk, html })),
    ]),
  );

  while (pending.size > 0) {
    const next = await Promise.race(pending.values());
    pending.delete(next.index);

    const templateId = `ns-stream-template-${next.index}`;
    yield `<template id="${templateId}">${next.html}</template>${
      createPatchScript(next.chunk.slotId, templateId)
    }`;
  }
}

export function createIncrementalStreamingResponse(
  shell: VNode,
  chunks: IncrementalStreamChunk[],
  options: StreamRenderOptions = {},
): Response {
  const headers = new Headers({
    ...STREAMING_HEADERS,
    ...options.headers,
  });

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encodeHtmlChunk(renderToString(shell)));

      void (async () => {
        try {
          for await (const chunk of settleChunks(chunks)) {
            controller.enqueue(encodeHtmlChunk(chunk));
          }

          controller.close();
          options.onAllReady?.();
        } catch (error) {
          options.onError?.(error);
          controller.error(error);
        }
      })();
    },
    cancel() {
      options.signal?.throwIfAborted?.();
    },
  });

  return new Response(stream, {
    status: options.status ?? 200,
    headers,
  });
}
