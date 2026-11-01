import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import {
  APP_DIR,
  BASE_URL,
  EXTERNAL_SERVER,
  OUTPUT_DIR,
  ROUTES,
  THEMES,
  WIDTHS,
} from './settings.ts';

const prepareFixtures = fileURLToPath(new URL('./prepare-component-fixtures.ts', import.meta.url));
// The browser harness runs on POSIX hosts; quote the script path before using the shell command.
const quotedPrepareFixtures = "'" + prepareFixtures.replaceAll("'", "'\\''") + "'";

export default defineConfig({
  testDir: './tests',
  outputDir: OUTPUT_DIR,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: `${OUTPUT_DIR}/results.json` }],
  ],
  use: {
    baseURL: BASE_URL,
    browserName: 'chromium',
    reducedMotion: 'reduce',
    locale: 'en-US',
    timezoneId: 'UTC',
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
  },
  projects: THEMES.flatMap((colorScheme) =>
    WIDTHS.map((width) => ({
      name: `${colorScheme}-${width}`,
      use: { colorScheme, viewport: { width, height: 900 } },
    }))
  ),
  webServer: EXTERNAL_SERVER ? undefined : {
    command: `node ${quotedPrepareFixtures} && deno task dev --host 127.0.0.1 --port ${
      new URL(BASE_URL).port
    } --strictPort`,
    cwd: APP_DIR,
    url: new URL(ROUTES[0], BASE_URL).href,
    timeout: 180_000,
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
  },
});
