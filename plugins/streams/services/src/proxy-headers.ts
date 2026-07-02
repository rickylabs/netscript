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
 * Re-wrap an upstream proxy response so its headers describe the bytes on the
 * wire. The body stream is passed through unbuffered; only the headers are
 * rewritten (see {@link sanitizeProxyResponseHeaders}).
 */
export function sanitizeProxyResponse(upstream: Response): Response {
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: sanitizeProxyResponseHeaders(upstream.headers),
  });
}
