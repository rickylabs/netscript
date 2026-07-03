import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { createMcpSandboxHandler } from './mcp-sandbox-handler.ts';

const sampleUri = 'ui://widgets.example/weather/card.js';

function sandboxUrl(uri: string, theme?: string): string {
  const url = new URL('https://app.test/api/mcp/sandbox');
  url.searchParams.set('uri', uri);
  if (theme) url.searchParams.set('theme', theme);
  return url.href;
}

Deno.test('injects active --ns-* design tokens before the resource body', async () => {
  const handler = createMcpSandboxHandler({
    resolveResource: () => '<main id="widget">Weather</main>',
    themes: {
      default: {
        '--ns-color-surface': '#ffffff',
        '--not-ns-token': 'ignored',
      },
    },
  });

  const response = await handler(new Request(sandboxUrl(sampleUri)));
  const body = await response.text();

  assertEquals(response.status, 200);
  assertStringIncludes(body, '<style data-netscript-theme-tokens>');
  assertStringIncludes(body, '--ns-color-surface: #ffffff;');
  assert(!body.includes('--not-ns-token'));
  assert(
    body.indexOf('</style>') < body.indexOf('<main id="widget">Weather</main>'),
    'theme style must be injected before the resource body',
  );
  assertStringIncludes(body, '<main id="widget">Weather</main>');
});

Deno.test('switches themes and falls back to the documented default theme', async () => {
  const handler = createMcpSandboxHandler({
    resolveResource: () => '<section>Widget</section>',
    themes: {
      default: { '--ns-color-text': '#111111' },
      dark: { '--ns-color-text': '#eeeeee' },
    },
  });

  const dark = await handler(new Request(sandboxUrl(sampleUri, 'dark')));
  const darkBody = await dark.text();
  assertEquals(dark.headers.get('x-netscript-theme'), 'dark');
  assertStringIncludes(darkBody, 'data-theme="dark"');
  assertStringIncludes(darkBody, '--ns-color-text: #eeeeee;');

  const fallback = await handler(new Request(sandboxUrl(sampleUri, 'unknown')));
  const fallbackBody = await fallback.text();
  assertEquals(fallback.headers.get('x-netscript-theme'), 'default');
  assertStringIncludes(fallbackBody, 'data-theme="default"');
  assertStringIncludes(fallbackBody, '--ns-color-text: #111111;');
});

Deno.test('falls back to the first record theme when the default theme is absent', async () => {
  const handler = createMcpSandboxHandler({
    resolveResource: () => '<section>Widget</section>',
    themes: {
      dark: { '--ns-color-text': '#eeeeee' },
    },
  });

  const response = await handler(new Request(sandboxUrl(sampleUri, 'unknown')));
  const body = await response.text();

  assertEquals(response.headers.get('x-netscript-theme'), 'dark');
  assertStringIncludes(body, 'data-theme="dark"');
  assertStringIncludes(body, '--ns-color-text: #eeeeee;');
});

Deno.test('derives the CSP header and meta tag from a representative ui:// URI', async () => {
  const handler = createMcpSandboxHandler({
    resolveResource: () => '<script src="ui://widgets.example/weather/card.js"></script>',
    themes: { default: { '--ns-color-accent': 'oklch(65% 0.2 240)' } },
  });

  const response = await handler(new Request(sandboxUrl(sampleUri)));
  const body = await response.text();
  const csp = response.headers.get('content-security-policy');

  assertEquals(
    csp,
    "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'; img-src 'self' data: blob:; style-src 'self' 'sha256-xfXIkm+dPbavfhs+2rhrubbW9eeLXPX7NrQGUFFDg2A='; script-src 'self' 'ui://widgets.example/weather/card.js'; frame-src 'self' 'ui://widgets.example/weather/card.js'",
  );
  assertStringIncludes(
    body,
    'http-equiv="Content-Security-Policy" content="default-src \'none\';',
  );
});

Deno.test('returns 400 for a missing or non-ui resource URI', async () => {
  const handler = createMcpSandboxHandler({
    resolveResource: () => '<p>must not resolve</p>',
    themes: { default: {} },
  });

  const missing = await handler(new Request('https://app.test/api/mcp/sandbox'));
  assertEquals(missing.status, 400);

  const nonUi = new URL('https://app.test/api/mcp/sandbox');
  nonUi.searchParams.set('uri', 'https://widgets.example/weather/card.js');
  const invalid = await handler(new Request(nonUi.href));
  assertEquals(invalid.status, 400);
});

Deno.test('returns 404 when the ui resource resolver misses', async () => {
  const handler = createMcpSandboxHandler({
    resolveResource: () => null,
    themes: { default: {} },
  });

  const response = await handler(new Request(sandboxUrl(sampleUri)));

  assertEquals(response.status, 404);
  assertEquals(response.headers.get('content-security-policy'), null);
});

Deno.test('passes the incoming request AbortSignal to the resource resolver', async () => {
  const controller = new AbortController();
  let resolverSignal: AbortSignal | undefined;

  const handler = createMcpSandboxHandler({
    resolveResource: (_uri, { signal }) => {
      resolverSignal = signal;
      return '<p>ok</p>';
    },
    themes: { default: {} },
  });

  const request = new Request(sandboxUrl(sampleUri), { signal: controller.signal });
  const response = await handler(request);

  assertEquals(response.status, 200);
  assert(resolverSignal !== undefined);
  assertEquals(resolverSignal, request.signal);
  assertEquals(resolverSignal!.aborted, false);
  controller.abort();
  assertEquals(resolverSignal!.aborted, true);
});
