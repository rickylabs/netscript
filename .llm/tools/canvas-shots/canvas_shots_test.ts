import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { join } from '@std/path';
import { parseArgs } from './args.ts';
import { browserLaunchError, resolveChromiumPath } from './browser.ts';
import { routeUrl, shotFilename } from './naming.ts';
import { redactServeUrl } from './redact.ts';
import { DARK_THEME_SCRIPT, LIGHT_THEME_SCRIPT, themeApplyScript } from './theme.ts';
import { defectExitCode, type ShotResult, unresolvedHoles } from './verdict.ts';

Deno.test('parseArgs applies defaults and parses the full contract', () => {
  assertEquals(
    parseArgs([
      '--serve-url',
      'https://example.invalid/secret',
      '--out',
      'shots',
      '--routes',
      ',catalog/item',
      '--themes',
      'dark',
      '--viewport',
      '800x600',
      '--scale',
      '1.5',
      '--settle-ms',
      '50',
      '--json',
      '--allow-defects',
    ]),
    {
      serveUrl: 'https://example.invalid/secret',
      outDir: 'shots',
      routes: ['', 'catalog/item'],
      themes: ['dark'],
      viewport: { width: 800, height: 600 },
      scale: 1.5,
      settleMs: 50,
      format: 'json',
      allowDefects: true,
    },
  );
});

Deno.test('parseArgs rejects missing required and malformed values', () => {
  assertThrows(() => parseArgs(['--out', 'shots']), Error, '--serve-url is required');
  assertThrows(
    () => parseArgs(['--serve-url', 'https://example.invalid', '--out', 'x', '--themes', 'blue']),
    Error,
    '--themes accepts only light,dark',
  );
});

Deno.test('route filename slugging includes home and theme', () => {
  assertEquals(shotFilename('', 'light'), 'home--light.png');
  assertEquals(shotFilename('/API Explorer/:id', 'dark'), 'api-explorer-id--dark.png');
});

Deno.test('hash routes retain the secret serve URL only for navigation', () => {
  const serveUrl = 'https://project.claudeusercontent.com/scoped-token#old';
  assertEquals(
    routeUrl(serveUrl, '#catalog/item'),
    'https://project.claudeusercontent.com/scoped-token#catalog/item',
  );
  assertEquals(routeUrl(serveUrl, ''), 'https://project.claudeusercontent.com/scoped-token#');
});

Deno.test('serve URL redaction covers the base and descendant diagnostics', () => {
  const serveUrl = 'https://project.claudeusercontent.com/scoped-token/';
  assertEquals(redactServeUrl(`failed ${serveUrl}`, serveUrl), 'failed <serve-url>');
  assertEquals(
    redactServeUrl(`404 ${serveUrl}assets/app.js`, serveUrl),
    '404 <serve-url>assets/app.js',
  );
});

Deno.test('theme scripts encode NS One light-default and dark attribute semantics', () => {
  assertEquals(themeApplyScript('light'), LIGHT_THEME_SCRIPT);
  assertEquals(themeApplyScript('dark'), DARK_THEME_SCRIPT);
  assertEquals(LIGHT_THEME_SCRIPT, "document.documentElement.removeAttribute('data-theme');");
  assertEquals(DARK_THEME_SCRIPT, "document.documentElement.setAttribute('data-theme','dark');");
});

Deno.test('defect classifier controls exit behavior', () => {
  const clean: ShotResult = {
    route: '',
    theme: 'light',
    file: 'home--light.png',
    windowNSOne: true,
    consoleErrors: [],
    failedRequests: [],
    unresolvedHoles: [],
  };
  assertEquals(defectExitCode([clean], false), 0);
  assertEquals(defectExitCode([{ ...clean, windowNSOne: false }], false), 1);
  assertEquals(defectExitCode([{ ...clean, consoleErrors: ['boom'] }], false), 1);
  assertEquals(defectExitCode([{ ...clean, failedRequests: ['missing.js'] }], false), 1);
  assertEquals(defectExitCode([{ ...clean, unresolvedHoles: ['{{ value }}'] }], false), 1);
  assertEquals(defectExitCode([{ ...clean, windowNSOne: false }], true), 0);
  assertEquals(unresolvedHoles('<div title="{{ a }}">{{ b }}</div>'), ['{{ a }}', '{{ b }}']);
});

Deno.test({
  name: 'browser resolver honors env then newest valid cached revision',
  async fn() {
    const root = await Deno.makeTempDir();
    try {
      const older = join(root, 'chromium-1228', 'chrome-linux64');
      const newer = join(root, 'chromium-1232', 'chrome-linux64');
      await Deno.mkdir(older, { recursive: true });
      await Deno.mkdir(newer, { recursive: true });
      await Deno.writeTextFile(join(older, 'chrome'), '');
      await Deno.writeTextFile(join(newer, 'chrome'), '');
      assertEquals(
        await resolveChromiumPath({ envPath: '/explicit/chrome', cacheDir: root }),
        '/explicit/chrome',
      );
      assertEquals(await resolveChromiumPath({ cacheDir: root }), join(newer, 'chrome'));
      assertEquals(await resolveChromiumPath({ cacheDir: join(root, 'missing') }), undefined);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  },
});

Deno.test('browser launch failure is actionable', () => {
  const message = browserLaunchError(new Error('revision 1228 missing'), undefined).message;
  assertStringIncludes(message, 'CANVAS_SHOTS_CHROMIUM');
  assertStringIncludes(message, 'No browser was downloaded automatically');
});
