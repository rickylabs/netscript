import { defineConfig } from '@playwright/test';

/** Isolated local fixture evidence; the existing gallery/axe baseline is unchanged. */
export default defineConfig({
  testDir: './gap-tests',
  outputDir: './test-results/gaps',
  workers: 1,
  retries: 0,
  timeout: 30000,
  reporter: [['list'], ['json', { outputFile: './test-results/gaps/results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:4187',
    browserName: 'chromium',
    reducedMotion: 'reduce',
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
  },
  projects: [
    ...['light', 'dark'].flatMap((colorScheme) =>
      [390, 1280].map((width) => ({
        name: `${colorScheme}-${width}`,
        grepInvert: /@touch/,
        use: { colorScheme: colorScheme as 'light' | 'dark', viewport: { width, height: 900 } },
      }))
    ),
    {
      name: 'touch-light-390',
      testMatch: ['**/overlays.spec.ts', '**/display-motion.spec.ts'],
      grep: /@touch/,
      use: { hasTouch: true, colorScheme: 'light', viewport: { width: 390, height: 900 } },
    },
  ],
  webServer: {
    command:
      'deno run --allow-read --allow-write=test-results --allow-run gap-build.ts && deno run --allow-read --allow-net=127.0.0.1 gap-server.ts 4187',
    url: 'http://127.0.0.1:4187',
    reuseExistingServer: false,
    timeout: 30000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
  },
});
