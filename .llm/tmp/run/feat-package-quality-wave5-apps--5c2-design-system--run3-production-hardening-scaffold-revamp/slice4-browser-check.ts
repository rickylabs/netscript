import { chromium, type Browser, type BrowserContext, type Page } from 'npm:playwright-core';

const RUN_DIR =
  'C:/Dev/repos/netscript/output/test-app/worktrees/repo-genesis/.genesis/netscript/.worktrees/wave5-apps-5c2-design-system/.llm/tmp/run/feat-package-quality-wave5-apps--5c2-design-system--run3-production-hardening-scaffold-revamp';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = 'http://127.0.0.1:5174/design/components';

type BrowserIssue = {
  type: string;
  text: string;
};

type GateResult = {
  ok: boolean;
  url: string;
  title: string;
  desktop: Record<string, unknown>;
  mobile: Record<string, unknown>;
  reducedMotion: Record<string, unknown>;
  screenshots: string[];
  issues: BrowserIssue[];
};

const screenshots: string[] = [];
const issues: BrowserIssue[] = [];

function screenshotPath(name: string): string {
  const path = `${RUN_DIR}/${name}`;
  screenshots.push(path);
  return path;
}

function attachIssueCapture(page: Page) {
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      issues.push({ type: `console:${message.type()}`, text: message.text() });
    }
  });
  page.on('pageerror', (error) => {
    issues.push({ type: 'pageerror', text: error.message });
  });
}

async function openPage(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  attachIssueCapture(page);
  const response = await page.goto(URL, { waitUntil: 'networkidle' });
  if (!response || response.status() !== 200) {
    throw new Error(`Expected HTTP 200 for ${URL}, got ${response?.status() ?? 'no response'}`);
  }
  await page.locator('[data-registry-item="sheet-styles"]').waitFor();
  await page.locator('[data-registry-item="floating-styles"]').waitFor();
  return page;
}

async function run(): Promise<GateResult> {
  const browser: Browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox'],
  });

  try {
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: 'dark',
    });
    const desktop = await openPage(desktopContext);
    await desktop.screenshot({
      path: screenshotPath('slice4-design-components-desktop.png'),
      fullPage: true,
    });

    const title = await desktop.title();
    const themeBefore = await desktop.locator('html').getAttribute('data-theme');
    await desktop.getByLabel(/Switch to .* mode/).click();
    await desktop.waitForTimeout(100);
    const themeAfter = await desktop.locator('html').getAttribute('data-theme');

    await desktop.getByRole('button', { name: 'Open popover' }).click();
    await desktop.locator("[data-scope='popover'][data-part='content'][data-state='open']")
      .waitFor();
    await desktop.screenshot({
      path: screenshotPath('slice4-design-components-popover-open.png'),
      fullPage: false,
    });
    await desktop.keyboard.press('Escape');

    await desktop.getByRole('button', { name: 'Hover or focus' }).hover();
    await desktop.locator("[data-scope='tooltip'][data-part='content'][data-state='open']")
      .waitFor();
    await desktop.screenshot({
      path: screenshotPath('slice4-design-components-tooltip-open.png'),
      fullPage: false,
    });

    await desktop.getByRole('button', { name: 'Open right sheet' }).click();
    await desktop.locator("dialog[data-part='content'][data-side='right'][open]").waitFor();
    await desktop.screenshot({
      path: screenshotPath('slice4-design-components-sheet-open.png'),
      fullPage: false,
    });
    await desktop.keyboard.press('Escape');

    const desktopChecks = await desktop.evaluate(() => {
      const loadedCss = [...document.styleSheets].flatMap((sheet) => {
        try {
          return [...sheet.cssRules].map((rule) => rule.cssText);
        } catch {
          return [String(sheet.href ?? '')];
        }
      }).join('\n');
      return {
        sheetItem: Boolean(document.querySelector('[data-registry-item="sheet-styles"]')),
        floatingItem: Boolean(document.querySelector('[data-registry-item="floating-styles"]')),
        sheetCss: loadedCss.includes("dialog[data-part='content'][data-side]") ||
          loadedCss.includes('ns-sheet-enter'),
        floatingCss: loadedCss.includes("[data-scope='popover'][data-part='content']") ||
          loadedCss.includes('--ns-floating-anchor-name'),
      };
    });
    await desktopContext.close();

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: 'dark',
    });
    const mobile = await openPage(mobileContext);
    const mobileChecks = await mobile.evaluate(() => ({
      width: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth + 1,
      sheetVisible: Boolean(document.querySelector('[data-registry-item="sheet-styles"]')),
      floatingVisible: Boolean(document.querySelector('[data-registry-item="floating-styles"]')),
    }));
    await mobile.screenshot({
      path: screenshotPath('slice4-design-components-mobile-390x844.png'),
      fullPage: true,
    });
    await mobileContext.close();

    const reducedContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: 'dark',
      reducedMotion: 'reduce',
    });
    const reduced = await openPage(reducedContext);
    await reduced.getByRole('button', { name: 'Open right sheet' }).click();
    const reducedMotion = await reduced.locator("dialog[data-part='content'][data-side='right']")
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
          animationDuration: style.animationDuration,
          animationName: style.animationName,
        };
      });
    await reduced.screenshot({
      path: screenshotPath('slice4-design-components-reduced-motion-sheet.png'),
      fullPage: false,
    });
    await reducedContext.close();

    const result: GateResult = {
      ok: issues.length === 0 &&
        desktopChecks.sheetItem === true &&
        desktopChecks.floatingItem === true &&
        desktopChecks.sheetCss === true &&
        desktopChecks.floatingCss === true &&
        mobileChecks.noHorizontalOverflow === true &&
        reducedMotion.matches === true &&
        themeBefore !== themeAfter,
      url: URL,
      title,
      desktop: {
        ...desktopChecks,
        themeBefore,
        themeAfter,
      },
      mobile: mobileChecks,
      reducedMotion,
      screenshots,
      issues,
    };

    await Deno.writeTextFile(`${RUN_DIR}/slice4-browser-report.json`, JSON.stringify(result, null, 2));
    return result;
  } finally {
    await browser.close();
  }
}

const result = await run();
console.log(JSON.stringify(result, null, 2));
if (!result.ok) Deno.exit(1);
