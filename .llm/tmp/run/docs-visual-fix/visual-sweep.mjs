import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = "http://127.0.0.1:4173/netscript";
const outDir = ".llm/tmp/run/docs-visual-fix";
const screenshotDir = path.join(outDir, "screenshots");
const reportPath = path.join(outDir, "reports", "visual-sweep.json");

const pages = [
  ["/", "landing"],
  ["/why/", "why"],
  ["/quickstart/", "quickstart"],
  ["/tutorials/first-workspace/", "tutorial-first-workspace"],
  ["/tutorials/build-a-service/", "tutorial-build-a-service"],
  ["/tutorials/ingest-webhook/", "tutorial-ingest-webhook"],
  ["/tutorials/durable-workflow/", "tutorial-durable-workflow"],
  ["/tutorials/background-jobs/", "tutorial-background-jobs"],
  ["/how-to/", "how-to"],
  ["/how-to/add-a-service/", "how-to-add-a-service"],
  ["/how-to/deploy/", "how-to-deploy"],
  ["/capabilities/", "capabilities"],
  ["/capabilities/database/", "capabilities-database"],
  ["/explanation/", "explanation"],
  ["/explanation/architecture/", "explanation-architecture"],
  ["/reference/", "reference"],
  ["/glossary/", "glossary"],
  ["/cli-reference/", "cli-reference"],
];

const viewports = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

await mkdir(screenshotDir, { recursive: true });
await mkdir(path.dirname(reportPath), { recursive: true });

const browser = await chromium.launch();
const results = [];

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });

  for (const [route, slug] of pages) {
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const requestFailures = [];

    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => {
      const failure = request.failure();
      requestFailures.push(`${request.url()} ${failure?.errorText ?? "failed"}`);
    });

    const url = `${baseUrl}${route}`;
    const response = await page.goto(url, { waitUntil: "networkidle" });
    await page.addStyleTag({
      content: "* { scroll-behavior: auto !important; }",
    });
    const screenshot = path.join(screenshotDir, `${viewport.name}-${slug}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });

    const audit = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const html = document.documentElement;
      const body = document.body;
      const leakPatterns = ["css: |", "js: |", ".ns-hero {", ".ns-card {", ".ns-tabbed {"];
      const leaks = leakPatterns.filter((pattern) => bodyText.includes(pattern));
      const widthOverflow = Math.max(html.scrollWidth, body.scrollWidth) - window.innerWidth;
      const sample = (selector) => {
        const node = document.querySelector(selector);
        if (!node) return null;
        const style = getComputedStyle(node);
        return {
          display: style.display,
          borderTopWidth: style.borderTopWidth,
          borderLeftWidth: style.borderLeftWidth,
          backgroundColor: style.backgroundColor,
          color: style.color,
          overflowX: style.overflowX,
        };
      };
      return {
        title: document.title,
        statusText: document.querySelector("main")?.textContent?.slice(0, 120) ?? "",
        leaks,
        widthOverflow,
        hero: sample(".ns-hero"),
        card: sample(".ns-card"),
        callout: sample(".ns-callout"),
        apiTable: sample(".ns-api-table-wrap"),
        tabbed: sample(".ns-tabbed"),
        nextPrev: sample(".ns-nextprev"),
        breadcrumb: sample(".ns-breadcrumb"),
        stylesheetLoaded: [...document.styleSheets].some((sheet) =>
          sheet.href && sheet.href.includes("/netscript/styles/docs.css")
        ),
      };
    });

    results.push({
      viewport: viewport.name,
      route,
      url,
      status: response?.status() ?? null,
      screenshot,
      consoleErrors,
      pageErrors,
      requestFailures,
      audit,
    });

    await page.close();
  }

  await context.close();
}

await browser.close();
await writeFile(reportPath, JSON.stringify(results, null, 2));

const failures = results.filter((result) =>
  result.status !== 200 ||
  result.consoleErrors.length ||
  result.pageErrors.length ||
  result.audit.leaks.length ||
  result.audit.widthOverflow > 2 ||
  !result.audit.stylesheetLoaded
);

console.log(JSON.stringify({
  reportPath,
  pages: results.length,
  failures: failures.map((failure) => ({
    viewport: failure.viewport,
    route: failure.route,
    status: failure.status,
    consoleErrors: failure.consoleErrors,
    pageErrors: failure.pageErrors,
    leaks: failure.audit.leaks,
    widthOverflow: failure.audit.widthOverflow,
    stylesheetLoaded: failure.audit.stylesheetLoaded,
  })),
}, null, 2));

if (failures.length) {
  process.exitCode = 1;
}
