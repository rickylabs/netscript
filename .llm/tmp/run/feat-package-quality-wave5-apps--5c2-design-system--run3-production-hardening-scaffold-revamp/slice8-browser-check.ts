import { chromium, type Browser, type BrowserContext, type Page } from 'npm:playwright-core';

const RUN_DIR =
  'C:/Dev/repos/netscript/output/test-app/worktrees/repo-genesis/.genesis/netscript/.worktrees/wave5-apps-5c2-design-system/.llm/tmp/run/feat-package-quality-wave5-apps--5c2-design-system--run3-production-hardening-scaffold-revamp';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = Deno.args[0] ?? 'http://127.0.0.1:5175/design/components';

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
    if (message.type() === 'error') {
      issues.push({ type: 'console:error', text: message.text() });
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
  await page.locator('[data-registry-item="responsive-table"]').waitFor();
  await page.locator('.ns-responsive-table').waitFor();
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
    const title = await desktop.title();
    const themeBefore = await desktop.locator('html').getAttribute('data-theme');
    await desktop.getByLabel(/Switch to .* mode/).click();
    await desktop.waitForTimeout(100);
    const themeAfterFirstFlip = await desktop.locator('html').getAttribute('data-theme');
    await desktop.getByLabel(/Switch to .* mode/).click();
    await desktop.waitForTimeout(100);
    const themeAfterSecondFlip = await desktop.locator('html').getAttribute('data-theme');

    const desktopChecks = await desktop.evaluate(() => {
      const item = document.querySelector('[data-registry-item="responsive-table"]');
      const table = document.querySelector('.ns-responsive-table');
      const cells = [...document.querySelectorAll('.ns-responsive-table__cell')];
      const loadedCss = [...document.styleSheets].flatMap((sheet) => {
        try {
          return [...sheet.cssRules].map((rule) => rule.cssText);
        } catch {
          return [String(sheet.href ?? '')];
        }
      }).join('\n');

      return {
        item: Boolean(item),
        table: Boolean(table),
        cellCount: cells.length,
        serviceLabel: cells.some((cell) => cell.getAttribute('data-label') === 'Service'),
        cssLoaded: loadedCss.includes('.ns-responsive-table'),
        display: table ? getComputedStyle(table).display : null,
      };
    });
    await desktop.screenshot({
      path: screenshotPath('slice8-responsive-table-desktop.png'),
      fullPage: true,
    });
    await desktopContext.close();

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: 'dark',
    });
    const mobile = await openPage(mobileContext);
    const mobileChecks = await mobile.evaluate(() => {
      const offenders = [...document.querySelectorAll('body *')].flatMap((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.width > window.innerWidth + 1 || rect.right > window.innerWidth + 1) {
          return [{
            tag: element.tagName.toLowerCase(),
            className: element.getAttribute('class'),
            width: Math.round(rect.width),
            right: Math.round(rect.right),
          }];
        }
        return [];
      }).slice(0, 12);
      const firstCell = document.querySelector('.ns-responsive-table__cell');
      return {
        width: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth + 1,
        offenders,
        firstCellDisplay: firstCell ? getComputedStyle(firstCell).display : null,
        firstCellLabel: firstCell?.getAttribute('data-label') ?? null,
      };
    });
    await mobile.screenshot({
      path: screenshotPath('slice8-responsive-table-mobile-390x844.png'),
      fullPage: true,
    });
    await mobileContext.close();

    const reducedContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: 'dark',
      reducedMotion: 'reduce',
    });
    const reduced = await openPage(reducedContext);
    const reducedMotion = await reduced.evaluate(() => ({
      matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      tableVisible: Boolean(document.querySelector('.ns-responsive-table')),
      scrollWidth: document.documentElement.scrollWidth,
      width: window.innerWidth,
    }));
    await reduced.screenshot({
      path: screenshotPath('slice8-responsive-table-reduced-motion.png'),
      fullPage: true,
    });
    await reducedContext.close();

    const result: GateResult = {
      ok: issues.length === 0 &&
        desktopChecks.item === true &&
        desktopChecks.table === true &&
        desktopChecks.cssLoaded === true &&
        desktopChecks.serviceLabel === true &&
        Number(desktopChecks.cellCount) >= 12 &&
        themeBefore !== themeAfterFirstFlip &&
        themeAfterSecondFlip === themeBefore &&
        mobileChecks.noHorizontalOverflow === true &&
        mobileChecks.firstCellDisplay === 'grid' &&
        reducedMotion.matches === true &&
        reducedMotion.tableVisible === true,
      url: URL,
      title,
      desktop: {
        ...desktopChecks,
        themeBefore,
        themeAfterFirstFlip,
        themeAfterSecondFlip,
      },
      mobile: mobileChecks,
      reducedMotion,
      screenshots,
      issues,
    };

    await Deno.writeTextFile(
      `${RUN_DIR}/slice8-browser-report.json`,
      JSON.stringify(result, null, 2),
    );
    return result;
  } finally {
    await browser.close();
  }
}

const result = await run();
console.log(JSON.stringify(result, null, 2));
if (!result.ok) Deno.exit(1);
