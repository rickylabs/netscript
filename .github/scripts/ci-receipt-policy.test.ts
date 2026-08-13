import { assert, assertEquals, assertStringIncludes } from '@std/assert';

const ROOT = new URL('../../', import.meta.url);

async function workflow(name: string): Promise<string> {
  return await Deno.readTextFile(new URL(`.github/workflows/${name}`, ROOT));
}

function occurrences(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

Deno.test('authoritative CI jobs run repository gates through durable receipts', async () => {
  const ci = await workflow('ci.yml');
  const quality = await workflow('code-quality.yml');
  const fresh = await workflow('fresh-ui-quality.yml');

  for (const text of [ci, quality, fresh]) {
    assertStringIncludes(text, '.llm/tools/gates/run-gate.ts');
    assertStringIncludes(text, 'if: always()');
    assertStringIncludes(text, 'actions/upload-artifact@v5');
    assertStringIncludes(text, 'github.run_id');
    assertStringIncludes(text, 'github.run_attempt');
    assertStringIncludes(text, 'if-no-files-found: error');
    assertEquals(text.includes('rtk proxy deno task'), false);
  }

  assert(occurrences(ci, 'gate-receipts-${{ github.run_id }}-${{ github.run_attempt }}') >= 2);
  assert(occurrences(quality, 'gate-receipts-${{ github.run_id }}-${{ github.run_attempt }}') >= 2);
  assertEquals(
    occurrences(fresh, 'gate-receipts-${{ github.run_id }}-${{ github.run_attempt }}'),
    1,
  );
});

Deno.test('core type, test, lint, format and package gates no longer bypass the receipt runner', async () => {
  const ci = await workflow('ci.yml');
  const quality = await workflow('code-quality.yml');
  const fresh = await workflow('fresh-ui-quality.yml');

  for (
    const legacy of [
      'run: deno task check\n',
      'run: deno task test\n',
      'run: deno task lint\n',
      'run: deno task fmt:check\n',
    ]
  ) assertEquals(ci.includes(legacy), false, legacy);

  assertEquals(quality.includes('run: deno task quality:scan:repo --pretty'), false);
  assertEquals(fresh.includes('run: deno task --cwd packages/fresh-ui lint'), false);
  assertStringIncludes(fresh, '--cwd packages/fresh-ui');

  for (
    const report of [
      'check.report.json',
      'test.report.json',
      'lint.report.json',
      'fmt.report.json',
    ]
  ) {
    assertStringIncludes(ci, `--child-report .llm/tmp/gate-receipts/`);
    assertStringIncludes(ci, report);
  }
  assertStringIncludes(fresh, 'check.report.json');
  assertStringIncludes(fresh, 'lint.report.json');
  assertStringIncludes(fresh, '--child-report');
  assertStringIncludes(ci, '--report-output .llm/tmp/gate-receipts/check-test/test.report.json');
});

Deno.test('E2E keeps its domain report instead of being double-wrapped', async () => {
  for (const name of ['e2e-cli.yml', 'e2e-cli-prod.yml', 'e2e-cli-prod-local.yml']) {
    const text = await workflow(name);
    assertEquals(text.includes('.llm/tools/gates/run-gate.ts'), false, name);
  }

  const e2e = await workflow('e2e-cli.yml');
  for (const suite of ['service', 'contracts', 'plugins', 'runtime', 'runtime-sqlite']) {
    assertStringIncludes(e2e, `e2e-report-scaffold-${suite}.json`);
  }
  assertStringIncludes(e2e, 'Upload static E2E reports');
  assertStringIncludes(e2e, 'if-no-files-found: error');
});

Deno.test('root test task uses the structured deduplicating runner', async () => {
  const config = JSON.parse(await Deno.readTextFile(new URL('../../deno.json', import.meta.url)));
  assertStringIncludes(config.tasks.test, '.llm/tools/run-deno-test.ts');
  assertEquals(config.tasks.test.includes('deno test --allow-all'), false);
  assertStringIncludes(config.tasks['gates:test'], '.llm/tools/run-deno-test_test.ts');
  for (const task of ['check', 'test', 'lint', 'fmt:check', 'doc:lint']) {
    const definition = config.tasks[task];
    const command = typeof definition === 'string' ? definition : definition.command;
    assertStringIncludes(command, '--allow-write', task);
  }

  const fresh = JSON.parse(
    await Deno.readTextFile(new URL('../../packages/fresh-ui/deno.json', import.meta.url)),
  );
  for (const task of ['check', 'lint']) {
    assertStringIncludes(fresh.tasks[task], '--allow-write', `fresh-ui ${task}`);
  }
});

Deno.test('policy skips always supply a non-empty fallback reason', async () => {
  const ci = await workflow('ci.yml');
  assertStringIncludes(
    ci,
    '${SKIP_REASON:-Classifier selected no affected check-test surface.}',
  );
  assertStringIncludes(
    ci,
    '${SKIP_REASON:-Classifier selected no affected quality surface.}',
  );
  assertEquals(ci.includes('--git-head "${{ github.sha }}"'), false);
});
