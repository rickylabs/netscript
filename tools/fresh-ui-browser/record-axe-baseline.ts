import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import type { AxeResults } from 'axe-core';
import { fingerprints } from './accessibility.ts';
import { ROUTES, THEMES, WIDTHS } from './settings.ts';

interface Suite {
  suites?: Suite[];
  specs?: Array<{
    title: string;
    tests: Array<{
      projectName: string;
      results: Array<{ attachments: Array<{ name: string; path?: string; body?: string }> }>;
    }>;
  }>;
}

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  throw new Error('Usage: node record-axe-baseline.ts <results.json> <new-baseline.json>');
}
if (existsSync(output)) {
  throw new Error('Choose a new output file, then review its diff against axe-baseline.json');
}
const report = JSON.parse(readFileSync(input, 'utf8')) as { suites: Suite[] };
const cases: Record<string, Record<string, number>> = {};
let engine: AxeResults['testEngine'] | undefined;
let browser: string | undefined;

function collect(suite: Suite): void {
  for (const spec of suite.specs ?? []) {
    if (spec.title.includes('[negative:')) {
      throw new Error('Cannot baseline deliberate negative controls');
    }
    const route = spec.title.split(': screenshots, axe and keyboard')[0];
    for (const test of spec.tests) {
      const attachment = test.results.at(-1)?.attachments.find((item) => item.name === 'axe');
      if (!attachment) throw new Error(`Missing axe evidence for ${route} ${test.projectName}`);
      let scan: AxeResults;
      if (attachment.body) {
        scan = JSON.parse(Buffer.from(attachment.body, 'base64').toString('utf8')) as AxeResults;
      } else if (attachment.path) {
        // Downloaded CI artifacts retain the case directory, but their original absolute paths move.
        const path = existsSync(attachment.path) ? attachment.path : join(
          dirname(resolve(input)),
          basename(dirname(attachment.path)),
          basename(attachment.path),
        );
        scan = JSON.parse(readFileSync(path, 'utf8')) as AxeResults;
      } else throw new Error('Axe attachment has neither inline data nor a report path');
      if (engine && JSON.stringify(engine) !== JSON.stringify(scan.testEngine)) {
        throw new Error('Mixed axe engine versions in one baseline');
      }
      if (browser && browser !== scan.testEnvironment.userAgent) {
        throw new Error('Mixed browser versions');
      }
      engine = scan.testEngine;
      browser = scan.testEnvironment.userAgent;
      const key = `${route}|${test.projectName}`;
      if (key in cases) throw new Error(`Duplicate matrix case ${key}`);
      cases[key] = fingerprints(scan.violations);
    }
  }
  for (const child of suite.suites ?? []) collect(child);
}
for (const suite of report.suites) collect(suite);
for (const route of ROUTES) {
  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      if (!(`${route}|${theme}-${width}` in cases)) throw new Error('Incomplete axe matrix');
    }
  }
}
if (Object.keys(cases).length !== ROUTES.length * THEMES.length * WIDTHS.length) {
  throw new Error('Unexpected matrix cases in baseline input');
}
const revision = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
if (revision.status !== 0) throw new Error('Cannot record baseline source commit');
const previous = JSON.parse(
  readFileSync(new URL('./axe-baseline.json', import.meta.url), 'utf8'),
) as {
  debt: Record<string, string>;
};
writeFileSync(
  output,
  JSON.stringify(
    {
      schemaVersion: 1,
      capturedAt: new Date().toISOString(),
      sourceHead: revision.stdout.trim(),
      engine,
      browser,
      review:
        'Pending review. Compare every changed rule, target and count before replacing the approved baseline.',
      debt: previous.debt,
      cases: Object.fromEntries(
        Object.entries(cases).sort(([left], [right]) => left.localeCompare(right)),
      ),
    },
    null,
    2,
  ) + '\n',
);
console.log('Wrote a candidate axe baseline. Review required before replacing axe-baseline.json.');
