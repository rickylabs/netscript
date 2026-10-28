import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { fingerprints, verifyAccessibility } from './accessibility.ts';

const original = {
  id: 'color-contrast',
  impact: 'serious' as const,
  nodes: [{ target: ['.known'] }],
};
const baseline = fingerprints([original]);

Deno.test('axe baseline matches the exact known nodes', () => {
  verifyAccessibility([original], baseline);
  verifyAccessibility([], {});
});

Deno.test('axe rejects a new rule and a new target under a known rule', () => {
  assert.throws(() =>
    verifyAccessibility([
      original,
      { id: 'button-name', impact: 'critical', nodes: [{ target: ['#unnamed'] }] },
    ], baseline), /button-name/);
  assert.throws(() =>
    verifyAccessibility([
      original,
      { ...original, nodes: [{ target: ['.new-target'] }] },
    ], baseline), /new-target/);
});

Deno.test('axe rejects an extra copy of a baselined node', () => {
  assert.throws(() =>
    verifyAccessibility([
      { ...original, nodes: [...original.nodes, ...original.nodes] },
    ], baseline), /"actual": 2/);
});

Deno.test('axe rejects stale allowances until the baseline is lowered', () => {
  assert.throws(() => verifyAccessibility([], baseline), /"actual": 0/);
  const two = fingerprints([{ ...original, nodes: [...original.nodes, ...original.nodes] }]);
  assert.throws(() => verifyAccessibility([original], two), /"expected": 2/);
});

Deno.test('axe recorder reads relocated case attachments from a downloaded artifact', async () => {
  const root = await Deno.makeTempDir({ prefix: 'axe-relocated-artifact-' });
  try {
    const originalOutput = '/no-longer-present/browser-artifact/results';
    const projects: Array<{ name: string; outputDir: string }> = [];
    const specs = [];
    for (const route of ['/design/tokens', '/design/components']) {
      const tests = [];
      for (const theme of ['light', 'dark']) {
        for (const width of [390, 1280]) {
          const name = `${theme}-${width}`;
          if (route === '/design/tokens') projects.push({ name, outputDir: originalOutput });
          const caseName = `${route.split('/').at(-1)}-${name}`;
          await Deno.mkdir(`${root}/${caseName}/attachments`, { recursive: true });
          await Deno.writeTextFile(
            `${root}/${caseName}/attachments/axe-report.json`,
            JSON.stringify({
              testEngine: { name: 'axe-core', version: '4.11.4' },
              testEnvironment: { userAgent: 'relocated-artifact-fixture' },
              violations: [],
            }),
          );
          tests.push({
            projectName: name,
            results: [{
              attachments: [{
                name: 'axe',
                path: `${originalOutput}/${caseName}/attachments/axe-report.json`,
              }],
            }],
          });
        }
      }
      specs.push({ title: `${route}: screenshots, axe and keyboard`, tests });
    }
    const input = `${root}/results.json`;
    const output = `${root}/candidate.json`;
    await Deno.writeTextFile(input, JSON.stringify({ config: { projects }, suites: [{ specs }] }));
    const result = await new Deno.Command('node', {
      args: [fileURLToPath(new URL('./record-axe-baseline.ts', import.meta.url)), input, output],
      env: { FRESH_UI_ROUTES: '/design/tokens,/design/components' },
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assert.equal(result.code, 0, new TextDecoder().decode(result.stderr));
    const candidate = JSON.parse(await Deno.readTextFile(output));
    assert.equal(Object.keys(candidate.cases).length, 8);
    assert.deepEqual(candidate.cases['/design/tokens|light-390'], {});
    assert.match(candidate.review, /Pending review/);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
