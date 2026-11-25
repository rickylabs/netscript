/** Local-only browser fixture server; Playwright owns its process lifecycle. */
const base = new URL('../../', import.meta.url);
const files = [
  'registry/theme/tokens.css',
  'registry/theme/theme-bridge.css',
  'registry/theme/presets/studio-utility.css',
  // Copied PageHeader/SidebarShell/Breadcrumb depend on this registered layout support item.
  'registry/styles/layouts.css',
];
for await (
  const entry of Deno.readDir(new URL('packages/fresh-ui/registry/components/ui/', base))
) {
  if (entry.name.endsWith('.css')) files.push(`registry/components/ui/${entry.name}`);
}
const css = (await Promise.all(
  files.map((file) => Deno.readTextFile(new URL(`packages/fresh-ui/${file}`, base))),
))
  .join('\n').replace(/@import\s+[^;]+;/g, '');
const bundle = await Deno.readTextFile(new URL('./test-results/gap-fixture.js', import.meta.url));
async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

const server = Deno.serve({
  hostname: '127.0.0.1',
  port: Number(Deno.args[0] ?? '4187'),
  onListen: () => {},
}, async (request) => {
  const url = new URL(request.url);
  if (url.pathname === '/fixture.js') {
    return new Response(bundle, { headers: { 'content-type': 'text/javascript' } });
  }
  if (url.pathname === '/echo-secret-digest' && request.method === 'POST') {
    const fd = await request.formData();
    const raw = fd.get('webhook_secret');
    const action = fd.get('webhook_secret_action');
    const rawText = typeof raw === 'string' ? raw : '';
    const digest = await sha256Hex(rawText);
    const payload = JSON.stringify({
      action: typeof action === 'string' ? action : '',
      hasField: fd.has('webhook_secret'),
      digest,
    });
    return new Response(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Echo digest</title></head><body><pre id="echo">${payload}</pre></body></html>`,
      { headers: { 'content-type': 'text/html; charset=utf-8' } },
    );
  }
  return new Response(
    `<!doctype html><html lang="en" data-theme="studio" data-flavor="utility"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Fresh UI gap fixtures</title><style>${css}\nbody{background:var(--ns-bg);color:var(--ns-fg);font-family:var(--ns-font-body);padding:1rem}main>section{margin-block:2rem}main>section>*{margin-inline-end:1rem}</style></head><body><div id="app"></div><script type="module" src="/fixture.js"></script></body></html>`,
    { headers: { 'content-type': 'text/html' } },
  );
});
Deno.addSignalListener('SIGTERM', () => {
  void server.shutdown();
});
