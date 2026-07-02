/**
 * Response-header hygiene for the durable-streams front proxy.
 *
 * The proxy fronts the internal `DurableStreamTestServer` with a `fetch()`
 * hop. Deno's `fetch` transparently decodes the upstream body, so the bytes
 * the proxy re-streams are already decoded — yet the upstream advertises
 * `content-encoding: gzip` on a body that is plain JSON (it starts `[{`, hex
 * `5b 7b`, not the gzip magic `1f 8b`). Forwarding that header verbatim
 * mislabels the payload, and every standards-compliant reader then fails:
 *   - browser `fetch` / `DecompressionStream` → `TypeError: Decoding failed`
 *   - Deno `fetch` (auto-decompress)          → `TypeError: Invalid gzip header`
 *   - `curl --compressed`                      → `curl: (61) … incorrect header check`
 *
 * A stale `content-length` is equally corrupting: on a re-streamed chunked
 * body it truncates the payload. The invariant the proxy must uphold is:
 * **`content-encoding` (and `content-length`) must describe the bytes actually
 * sent.** Since the re-streamed bytes are decoded and re-framed by
 * `Deno.serve`, the honest thing is to drop both.
 *
 * See netscript#219 (root-cause wire proof) and #239 (this runtime-side fix).
 *
 * ## Cancel lifecycle (netscript#268 / SR1)
 *
 * The upstream body is not forwarded to `Deno.serve` as the raw `fetch`
 * response stream. Handing the raw stream through means a client disconnect
 * cancels the `fetch` body directly, which tears the upstream connection down
 * as an *uncaught* `AbortError` (noisy logs / half-open upstream read).
 * Instead {@link restreamUpstreamBody} wraps the upstream reader in an explicit
 * {@link ReadableStream} whose `cancel()` runs the upstream reader's own
 * `cancel()`. On client disconnect the served stream's `cancel()` fires, the
 * upstream reader is released cleanly, and no `AbortError` propagates. The
 * re-streamed bytes are enqueued verbatim, so the #239 invariant above is
 * preserved unchanged.
 *
 * @module
 */

/**
 * Headers stripped before re-streaming an upstream response through the proxy.
 *
 * - `content-encoding` / `content-length` — no longer describe the decoded,
 *   re-framed body (netscript#219 / #239).
 * - the RFC 9110 §7.6.1 hop-by-hop headers — describe the upstream connection,
 *   not the re-streamed one, so they must not be forwarded across a proxy hop.
 */
export const STRIPPED_PROXY_RESPONSE_HEADERS: readonly string[] = [
  'content-encoding',
  'content-length',
  // hop-by-hop (RFC 9110 §7.6.1)
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
];

/**
 * Return a copy of `source` with the {@link STRIPPED_PROXY_RESPONSE_HEADERS}
 * removed. All other headers (content-type, etag, the `Stream-*`/`Producer-*`
 * durable-stream headers, CORS headers, …) are preserved verbatim.
 */
export function sanitizeProxyResponseHeaders(source: Headers): Headers {
  const headers = new Headers(source);
  for (const name of STRIPPED_PROXY_RESPONSE_HEADERS) {
    headers.delete(name);
  }
  return headers;
}

/**
 * Re-stream an upstream `fetch` response body through an explicit
 * {@link ReadableStream} that decouples its lifecycle from the upstream `fetch`
 * connection's `AbortSignal`.
 *
 * Bytes are enqueued verbatim as they are read (no buffering, transform, or
 * re-framing), so the payload is byte-identical to the upstream body and the
 * #239 "content-encoding describes the bytes sent" invariant is preserved.
 *
 * The returned stream's `cancel()` — fired by `Deno.serve` when the client
 * disconnects mid-stream — cancels the upstream reader, which releases the
 * upstream `fetch` connection cleanly. This replaces the previous behavior of
 * handing the raw `fetch` body to `Deno.serve`, where a client disconnect tore
 * the upstream connection down as an uncaught `AbortError` (netscript#268 SR1).
 *
 * @param upstreamBody The non-null body of the upstream `fetch` response.
 * @returns A fresh readable stream that forwards `upstreamBody`'s chunks and
 *   propagates downstream cancellation to the upstream reader.
 */
export function restreamUpstreamBody(
  upstreamBody: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  const reader = upstreamBody.getReader();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          reader.releaseLock();
          return;
        }
        controller.enqueue(value);
      } catch (error) {
        // The upstream read failed (e.g. the upstream connection dropped):
        // surface it as a stream error and release the reader lock.
        controller.error(error);
        try {
          reader.releaseLock();
        } catch {
          // The reader may already be released/errored — nothing to do.
        }
      }
    },
    cancel(reason) {
      // Downstream (the client) cancelled — typically the browser disconnected
      // mid-stream and `Deno.serve` cancelled the response body. Cancel the
      // upstream reader so the upstream `fetch` connection is released cleanly
      // instead of being abandoned and surfacing as an uncaught `AbortError`.
      return reader.cancel(reason);
    },
  });
}

/**
 * Re-wrap an upstream proxy response so its headers describe the bytes on the
 * wire and its body's cancel lifecycle is owned by the proxy.
 *
 * Headers are rewritten by {@link sanitizeProxyResponseHeaders} (the #239
 * content-encoding/content-length/hop-by-hop strip). The body is re-streamed
 * through {@link restreamUpstreamBody} so a client disconnect cancels the
 * upstream reader cleanly rather than aborting the upstream `fetch`. A null
 * upstream body (e.g. a `204`/`304`) is forwarded as `null` unchanged.
 */
export function sanitizeProxyResponse(upstream: Response): Response {
  const body = upstream.body === null ? null : restreamUpstreamBody(upstream.body);
  return new Response(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: sanitizeProxyResponseHeaders(upstream.headers),
  });
}
