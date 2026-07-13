import { chromium, type Page } from 'playwright';
import { join } from '@std/path';
import { type CanvasShotsOptions, parseArgs, type Theme } from './args.ts';
import { browserLaunchError, defaultBrowserCacheDir, resolveChromiumPath } from './browser.ts';
import { routeUrl, shotFilename } from './naming.ts';
import { redactServeUrl } from './redact.ts';
import { themeApplyScript } from './theme.ts';
import { defectExitCode, isDefective, type ShotResult, unresolvedHoles } from './verdict.ts';

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

async function inspectPage(page: Page): Promise<{ windowNSOne: boolean; holes: string[] }> {
  const values = await page.evaluate(() => ({
    windowNSOne: typeof (window as Window & { NSOne?: unknown }).NSOne !== 'undefined',
    html: document.documentElement.outerHTML,
  }));
  return { windowNSOne: values.windowNSOne, holes: unresolvedHoles(values.html) };
}

async function captureShot(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  options: CanvasShotsOptions,
  route: string,
  theme: Theme,
): Promise<ShotResult> {
  const context = await browser.newContext({
    colorScheme: theme,
    viewport: options.viewport,
    deviceScaleFactor: options.scale,
  });
  await context.addInitScript(themeApplyScript(theme));
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(redactServeUrl(message.text(), options.serveUrl));
    }
  });
  page.on('response', (response) => {
    if (response.status() === 404 && !response.request().isNavigationRequest()) {
      failedRequests.push(redactServeUrl(response.url(), options.serveUrl));
    }
  });

  try {
    await page.goto(routeUrl(options.serveUrl, route), { waitUntil: 'load' });
    await page.waitForTimeout(options.settleMs);
    const inspection = await inspectPage(page);
    const file = shotFilename(route, theme);
    await page.screenshot({ path: join(options.outDir, file), fullPage: true });
    return {
      route,
      theme,
      file,
      windowNSOne: inspection.windowNSOne,
      consoleErrors: unique(consoleErrors),
      failedRequests: unique(failedRequests),
      unresolvedHoles: inspection.holes,
    };
  } finally {
    await context.close();
  }
}

function printResults(
  results: ShotResult[],
  format: 'json' | 'pretty',
  allowDefects: boolean,
): void {
  const defective = results.filter(isDefective).length;
  if (format === 'json') {
    console.log(JSON.stringify({ ok: defective === 0, defective, results }));
    return;
  }
  for (const result of results) {
    const state = isDefective(result) ? 'DEFECT' : 'PASS';
    console.log(
      `${state} ${result.route || '<home>'} ${result.theme} -> ${result.file} ` +
        `(NSOne=${result.windowNSOne}, console=${result.consoleErrors.length}, ` +
        `404=${result.failedRequests.length}, holes=${result.unresolvedHoles.length})`,
    );
  }
  console.log(
    `${results.length} shot(s), ${defective} defective${allowDefects ? ' (allowed)' : ''}`,
  );
}

/** Runs the canvas screenshot matrix and returns its defect-sensitive exit code. */
export async function run(args: string[]): Promise<number> {
  let options: CanvasShotsOptions;
  try {
    options = parseArgs(args);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 2;
  }

  await Deno.mkdir(options.outDir, { recursive: true });
  const executablePath = await resolveChromiumPath({
    envPath: Deno.env.get('CANVAS_SHOTS_CHROMIUM'),
    cacheDir: defaultBrowserCacheDir(Deno.env.get('HOME')),
  });

  let browser: Awaited<ReturnType<typeof chromium.launch>>;
  try {
    browser = await chromium.launch(executablePath ? { executablePath } : {});
  } catch (error) {
    console.error(browserLaunchError(error, executablePath).message);
    return 2;
  }

  const results: ShotResult[] = [];
  try {
    for (const route of options.routes) {
      for (const theme of options.themes) {
        results.push(await captureShot(browser, options, route, theme));
      }
    }
  } catch (error) {
    console.error(
      redactServeUrl(error instanceof Error ? error.message : String(error), options.serveUrl),
    );
    return 2;
  } finally {
    await browser.close();
  }

  printResults(results, options.format, options.allowDefects);
  return defectExitCode(results, options.allowDefects);
}

if (import.meta.main) Deno.exit(await run(Deno.args));
