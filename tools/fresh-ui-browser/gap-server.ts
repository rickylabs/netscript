/** Local-only browser fixture server; Playwright owns its process lifecycle. */
const base = new URL('../../', import.meta.url);
const files = [
  'registry/theme/tokens.css',
  'registry/theme/theme-bridge.css',
  'registry/theme/presets/studio-utility.css',
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
const server = Deno.serve({
  hostname: '127.0.0.1',
  port: Number(Deno.args[0] ?? '4187'),
  onListen: () => {},
}, (request) => {
  if (new URL(request.url).pathname === '/fixture.js') {
    return new Response(bundle, { headers: { 'content-type': 'text/javascript' } });
  }
  return new Response(
    `<!doctype html><html lang="en" data-theme="studio" data-flavor="utility"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Fresh UI gap fixtures</title><style>${css}\nbody{background:var(--ns-bg);color:var(--ns-fg);font-family:var(--ns-font-body);padding:1rem}section{margin-block:2rem}section>*{margin-inline-end:1rem}</style></head><body><div id="app"></div><script type="module" src="/fixture.js"></script></body></html>`,
    { headers: { 'content-type': 'text/html' } },
  );
});
Deno.addSignalListener('SIGTERM', () => {
  void server.shutdown();
});
