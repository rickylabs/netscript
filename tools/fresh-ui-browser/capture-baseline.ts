import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { chromium } from '@playwright/test';
import { OUTPUT_DIR, ROUTES, THEMES, WIDTHS } from './settings.ts';

if (process.env.FRESH_UI_AXE_NEGATIVE_CONTROL) {
  throw new Error('Refusing to capture a deliberate negative-control baseline');
}
const destination = resolve(
  process.argv[2] ?? `baselines/${new Date().toISOString().slice(0, 10)}-before`,
);
if (existsSync(destination)) {
  throw new Error('Baseline already exists; choose a new reviewed destination');
}
const test = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test'], {
  stdio: 'inherit',
  env: process.env,
});
if (test.status !== 0) process.exit(test.status ?? 1);
const screenshots: string[] = [];
for (const entry of readdirSync(OUTPUT_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  for (const file of readdirSync(join(OUTPUT_DIR, entry.name))) {
    if (file.endsWith('.png')) screenshots.push(join(OUTPUT_DIR, entry.name, file));
  }
}
if (screenshots.length !== ROUTES.length * THEMES.length * WIDTHS.length) {
  throw new Error('Incomplete screenshot matrix; baseline was not saved');
}
mkdirSync(destination, { recursive: true });
for (const file of screenshots) copyFileSync(file, join(destination, file.split(/[\\/]/).at(-1)!));
const browser = await chromium.launch();
const revision = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
if (revision.status !== 0) throw new Error('Cannot record baseline source commit');
const tooling = (JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  devDependencies: Record<string, string>;
}).devDependencies;
writeFileSync(
  join(destination, 'manifest.json'),
  JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      sourceHead: revision.stdout.trim(),
      platform: process.platform,
      architecture: process.arch,
      browser: `Chromium ${browser.version()}`,
      playwright: tooling['@playwright/test'],
      axeAdapter: tooling['@axe-core/playwright'],
      axeEngine: tooling['axe-core'],
      accessibilityPolicy:
        'Exact reviewed S0 findings; not an axe-clean claim. See axe-baseline.json.',
      routes: ROUTES,
      themes: THEMES,
      widths: WIDTHS,
      screenshotPolicy:
        'Capture only. No pixel comparison; normal tests do not rewrite this baseline.',
    },
    null,
    2,
  ) + '\n',
);
await browser.close();
console.log(`Saved ${screenshots.length} baseline screenshots.`);
