/** Serve the built docs under their real deployment prefix for browser acceptance tests. */
const root = new URL('../../docs/site/_site/', import.meta.url);
const portIndex = Deno.args.indexOf('--port');
const port = portIndex < 0 ? 4179 : Number(Deno.args[portIndex + 1]);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('Invalid docs preview port');
}
const types: Readonly<Record<string, string>> = {
  html: 'text/html; charset=utf-8',
  css: 'text/css',
  js: 'text/javascript',
  json: 'application/json',
  svg: 'image/svg+xml',
  png: 'image/png',
  webp: 'image/webp',
  woff2: 'font/woff2',
  wasm: 'application/wasm',
};
Deno.serve({ hostname: '127.0.0.1', port }, async (request) => {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/netscript/')) return new Response('Not found', { status: 404 });
  let path: string;
  try {
    path = decodeURIComponent(url.pathname.slice('/netscript/'.length));
  } catch {
    return new Response('Invalid path', { status: 400 });
  }
  if (path.startsWith('/') || path.split('/').includes('..') || /[\\:]/.test(path)) {
    return new Response('Invalid path', { status: 400 });
  }
  if (!path || path.endsWith('/')) path += 'index.html';
  try {
    const file = await Deno.open(new URL(path, root), { read: true });
    const type = types[path.split('.').pop() ?? ''] ?? 'application/octet-stream';
    return new Response(file.readable, {
      headers: { 'content-type': type, 'cache-control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof Deno.errors.NotFound || error instanceof Deno.errors.IsADirectory) {
      return new Response('Not found', { status: 404 });
    }
    throw error;
  }
});
