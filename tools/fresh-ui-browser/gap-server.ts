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
const shell = await Deno.readTextFile(new URL('./test-results/gap-shell.html', import.meta.url));
const ai = await Deno.readTextFile(new URL('./test-results/gap-ai.html', import.meta.url));
const aiInteraction = await Deno.readTextFile(
  new URL('./test-results/gap-ai-interaction.html', import.meta.url),
);
const docsNavigation = await Deno.readTextFile(
  new URL('./test-results/gap-docs-navigation.html', import.meta.url),
);
const insetDocs = await Deno.readTextFile(
  new URL('./test-results/gap-docs-inset.html', import.meta.url),
);
const docsComposition = await Deno.readTextFile(
  new URL('./test-results/gap-docs-composition.html', import.meta.url),
);
const docsCompositionShell = await Deno.readTextFile(
  new URL('./test-results/gap-docs-composition-shell.html', import.meta.url),
);
const desktopControls = await Deno.readTextFile(
  new URL('./test-results/gap-desktop-controls.html', import.meta.url),
);
const cardCss = await Deno.readTextFile(
  new URL('packages/fresh-ui/registry/components/ui/card.css', base),
);
const server = Deno.serve({
  hostname: '127.0.0.1',
  port: Number(Deno.args[0] ?? '4187'),
  onListen: () => {},
}, (request) => {
  const target = new URL(request.url);
  // Native tab ownership is independent of booting the full component fixture a second time.
  if (target.pathname === '/data-table' && target.searchParams.get('destination') === 'linked') {
    return new Response(
      '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Linked session destination</title></head><body><main><h1>Linked session destination</h1></main></body></html>',
      { headers: { 'content-type': 'text/html' } },
    );
  }
  if (new URL(request.url).pathname === '/fixture.js') {
    return new Response(bundle, { headers: { 'content-type': 'text/javascript' } });
  }
  if (new URL(request.url).pathname === '/registered-card.css') {
    return new Response(cardCss, { headers: { 'content-type': 'text/css' } });
  }
  const desktop = ['/desktop-controls', '/desktop-controls-static'].includes(
    new URL(request.url).pathname,
  );
  const scheme = new URL(request.url).searchParams.get('scheme') === 'dark' ? 'dark' : 'light';
  const direction = new URL(request.url).searchParams.get('dir') === 'rtl' ? 'rtl' : 'ltr';
  const staticComposition = new URL(request.url).pathname === '/docs-composition-static';
  const compositionShell = new URL(request.url).pathname === '/docs-composition-shell';
  const staticInset = new URL(request.url).pathname === '/docs-navigation-inset-static';
  const staticDocsNavigation = new URL(request.url).pathname === '/docs-navigation-static';
  const staticAIInteraction = new URL(request.url).pathname === '/ai-interaction-static';
  const staticAI = new URL(request.url).pathname === '/ai-static';
  const staticShell = new URL(request.url).pathname === '/shell-static';
  return new Response(
    `<!doctype html><html lang="en" data-theme="studio" data-flavor="utility" data-scheme="${scheme}" dir="${direction}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Fresh UI gap fixtures</title><style>${css}\nbody{background:var(--ns-bg);color:var(--ns-fg);font-family:var(--ns-font-body);padding:${
      staticShell || staticInset || compositionShell ? '0' : '1rem'
    }}main>section{margin-block:2rem}main>section>*{margin-inline-end:1rem}</style></head><body>${
      desktop
        ? '<div id="app">' + desktopControls + '</div>'
        : staticComposition
        ? docsComposition
        : compositionShell
        ? docsCompositionShell
        : staticInset
        ? insetDocs
        : staticDocsNavigation
        ? docsNavigation
        : staticShell
        ? shell
        : staticAI
        ? ai
        : staticAIInteraction
        ? aiInteraction
        : '<div id="app"></div>'
    }<script type="module" src="/fixture.js"></script></body></html>`,
    { headers: { 'content-type': 'text/html' } },
  );
});
Deno.addSignalListener('SIGTERM', () => {
  void server.shutdown();
});
