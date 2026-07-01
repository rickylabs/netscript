import { dirname, fromFileUrl, join } from 'jsr:@std/path@^1';
import { ensureDir } from 'jsr:@std/fs@^1';
import { chromium, type Page } from 'npm:playwright@1.58.2';

const baseUrl = Deno.args[0] ?? 'http://127.0.0.1:5173';
const artifactDir = dirname(fromFileUrl(import.meta.url));
const routes = ['/design/tokens', '/design/components', '/design/composition'] as const;
const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
] as const;

type RouteResult = {
  route: string;
  status: number;
  title: string;
  desktopNoConsoleErrors: boolean;
  themeFlip: {
    initial: string | null;
    first: string | null;
    second: string | null;
    bgChanged: boolean;
  };
  mobile: {
    width: number;
    height: number;
    scrollWidth: number;
    innerWidth: number;
    overflow: boolean;
    offenders: readonly string[];
  };
  reducedMotionNoConsoleErrors: boolean;
  screenshot: string;
};

function selectorFor(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const klass = typeof element.className === 'string' && element.className.trim()
    ? `.${element.className.trim().split(/\s+/).slice(0, 3).join('.')}`
    : '';
  return `${tag}${id}${klass}`;
}

async function collectOverflowOffenders(page: Page): Promise<readonly string[]> {
  return await page.evaluate((selectorSource) => {
    const makeSelector = new Function('element', `return (${selectorSource})(element);`) as (
      element: Element,
    ) => string;
    const width = document.documentElement.clientWidth;
    return Array.from(document.querySelectorAll('*'))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.right > width + 1 || rect.left < -1;
      })
      .slice(0, 20)
      .map((element) => makeSelector(element));
  }, selectorFor.toString());
}

async function runRoute(page: Page, route: string): Promise<RouteResult> {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  const status = response?.status() ?? 0;
  const title = await page.title();
  const initialTheme = await page.locator('html').getAttribute('data-theme');
  const initialBg = await page.locator('html').evaluate((element) =>
    getComputedStyle(element).getPropertyValue('--ns-bg').trim()
  );

  await page.getByRole('button', { name: /Switch to (light|dark) mode/ }).click();
  await page.waitForTimeout(150);
  const firstTheme = await page.locator('html').getAttribute('data-theme');
  const firstBg = await page.locator('html').evaluate((element) =>
    getComputedStyle(element).getPropertyValue('--ns-bg').trim()
  );
  await page.getByRole('button', { name: /Switch to (light|dark) mode/ }).click();
  await page.waitForTimeout(150);
  const secondTheme = await page.locator('html').getAttribute('data-theme');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  const mobileMetrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: globalThis.innerWidth,
  }));
  const offenders = mobileMetrics.scrollWidth > mobileMetrics.innerWidth
    ? await collectOverflowOffenders(page)
    : [];
  const screenshot = join(
    artifactDir,
    `slice14-${route.replaceAll('/', '-').replace(/^-/, '')}-390x844.png`,
  );
  await page.screenshot({ path: screenshot, fullPage: true });

  const reducedMotionErrors: string[] = [];
  page.removeAllListeners('console');
  page.removeAllListeners('pageerror');
  page.on('console', (message) => {
    if (message.type() === 'error') reducedMotionErrors.push(message.text());
  });
  page.on('pageerror', (error) => reducedMotionErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });

  return {
    route,
    status,
    title,
    desktopNoConsoleErrors: consoleErrors.length === 0,
    themeFlip: {
      initial: initialTheme,
      first: firstTheme,
      second: secondTheme,
      bgChanged: initialBg !== firstBg,
    },
    mobile: {
      width: 390,
      height: 844,
      scrollWidth: mobileMetrics.scrollWidth,
      innerWidth: mobileMetrics.innerWidth,
      overflow: mobileMetrics.scrollWidth > mobileMetrics.innerWidth,
      offenders,
    },
    reducedMotionNoConsoleErrors: reducedMotionErrors.length === 0,
    screenshot,
  };
}

await ensureDir(artifactDir);
let executablePath: string | undefined;
for (const candidate of chromeCandidates) {
  try {
    const stat = await Deno.stat(candidate);
    if (stat.isFile) {
      executablePath = candidate;
      break;
    }
  } catch {
    // Try the next known browser path.
  }
}
const browser = await chromium.launch({ headless: true, executablePath });
try {
  const page = await browser.newPage();
  const results = [];
  for (const route of routes) {
    results.push(await runRoute(page, route));
  }

  const failures = results.flatMap((result) => {
    const issues: string[] = [];
    if (result.status !== 200) issues.push(`${result.route}: status ${result.status}`);
    if (!result.desktopNoConsoleErrors) issues.push(`${result.route}: desktop console errors`);
    if (result.themeFlip.first === result.themeFlip.initial) {
      issues.push(`${result.route}: first theme click did not change theme`);
    }
    if (result.themeFlip.second !== result.themeFlip.initial) {
      issues.push(`${result.route}: second theme click did not restore theme`);
    }
    if (!result.themeFlip.bgChanged) issues.push(`${result.route}: theme bg token did not change`);
    if (result.mobile.overflow) issues.push(`${result.route}: mobile overflow`);
    if (!result.reducedMotionNoConsoleErrors) {
      issues.push(`${result.route}: reduced-motion console errors`);
    }
    return issues;
  });

  const report = {
    baseUrl,
    routes: results,
    ok: failures.length === 0,
    failures,
  };
  const reportPath = join(artifactDir, 'slice14-browser-report.json');
  await Deno.writeTextFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (failures.length > 0) Deno.exit(1);
} finally {
  await browser.close();
}
