import { defineConfig } from '@playwright/test';

const port = Number(process.env.DOCS_BROWSER_PORT || 4179);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('Invalid docs browser port');
}
const baseURL = process.env.DOCS_BROWSER_BASE_URL || `http://127.0.0.1:${port}/netscript/`;
const output = process.env.DOCS_BROWSER_OUTPUT_DIR || 'test-results/docs';
export default defineConfig({
  testDir: './docs-tests',
  outputDir: output,
  workers: 1,
  retries: 0,
  fullyParallel: false,
  timeout: 90_000,
  reporter: [['list'], ['json', { outputFile: `${output}/results.json` }], ['html', {
    outputFolder: 'playwright-report/docs',
    open: 'never',
  }]],
  use: {
    baseURL,
    browserName: 'chromium',
    locale: 'en-US',
    timezoneId: 'UTC',
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
  },
  projects: (['light', 'dark'] as const).flatMap((colorScheme) =>
    [390, 1280].map((width) => ({
      name: `${colorScheme}-${width}`,
      use: { colorScheme, viewport: { width, height: 900 } },
    }))
  ),
  webServer: process.env.DOCS_BROWSER_BASE_URL ? undefined : {
    command: `deno run --allow-read --allow-net ../docs-site/serve.ts --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
  },
});
