import { assertEquals } from 'jsr:@std/assert@^1';
import { join } from '@std/path';
import { generateQualityRunner } from './quality-runner.ts';

interface QualityReport {
  readonly ok: boolean;
  readonly mode: string;
  readonly selection: {
    readonly filesSelected: number;
    readonly files?: readonly string[];
  };
  readonly batches: readonly {
    readonly exitCode: number;
  }[];
}

async function runQuality(
  projectRoot: string,
  mode: string,
  runnerRoot = projectRoot,
): Promise<{ readonly code: number; readonly report: QualityReport }> {
  const runnerPath = join(runnerRoot, 'quality-runner.ts');
  await Deno.writeTextFile(runnerPath, generateQualityRunner());
  const output = await new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--allow-read',
      `--allow-run=${Deno.execPath()}`,
      runnerPath,
      mode,
    ],
    cwd: projectRoot,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(output.stdout);
  return { code: output.code, report: JSON.parse(stdout) as QualityReport };
}

async function withTempRoots(
  body: (projectRoot: string, runnerRoot: string) => Promise<void>,
): Promise<void> {
  const parent = await Deno.makeTempDir({ prefix: 'netscript-quality-runner-' });
  const projectRoot = join(parent, 'project');
  const runnerRoot = join(parent, 'runner');
  await Deno.mkdir(projectRoot);
  await Deno.mkdir(runnerRoot);
  try {
    await body(projectRoot, runnerRoot);
  } finally {
    await Deno.remove(parent, { recursive: true });
  }
}

Deno.test('generated quality runner rejects an empty owned-source selection in every mode', async () => {
  await withTempRoots(async (projectRoot, runnerRoot) => {
    for (const mode of ['check', 'lint', 'fmt-check', 'fmt-write']) {
      const result = await runQuality(projectRoot, mode, runnerRoot);
      assertEquals(result.code, 2);
      assertEquals(result.report, {
        ok: false,
        mode,
        selection: { filesSelected: 0 },
        batches: [],
      });
    }
  });
});

Deno.test('generated quality runner selects TS, TSX, and AppHost MTS while excluding non-product trees', async () => {
  await withTempRoots(async (projectRoot, runnerRoot) => {
    const sources = new Map([
      ['apps/dashboard/main.ts', 'export const main = true;\n'],
      ['apps/dashboard/card.tsx', 'export const card = <div />;\n'],
      ['aspire/.helpers/helper.mts', 'export const helper = true;\n'],
      ['contracts/catalog.ts', 'export const contract = true;\n'],
      ['database/postgres/schema.ts', 'export const schema = true;\n'],
      ['plugins/example/runtime.ts', 'export const plugin = true;\n'],
      ['sagas/example/runtime.ts', 'export const saga = true;\n'],
      ['services/users/main.ts', 'export const service = true;\n'],
      ['streams/example/runtime.ts', 'export const stream = true;\n'],
      ['tests/smoke_test.ts', 'Deno.test(\'smoke\', () => {});\n'],
      ['triggers/example/runtime.ts', 'export const trigger = true;\n'],
      ['workers/example/runtime.ts', 'export const worker = true;\n'],
      ['.agents/skip.ts', 'const skipped = true;\n'],
      ['.llm/skip.ts', 'const skipped = true;\n'],
      ['.netscript/generated/skip.ts', 'const skipped = true;\n'],
      ['apps/dashboard/readme.md', 'not TypeScript\n'],
    ]);
    for (const [path, source] of sources) {
      const absolute = join(projectRoot, path);
      await Deno.mkdir(join(absolute, '..'), { recursive: true });
      await Deno.writeTextFile(absolute, source);
    }

    const result = await runQuality(projectRoot, 'lint', runnerRoot);
    assertEquals(result.code, 0);
    assertEquals(result.report.ok, true);
    assertEquals(result.report.selection.files, [
      'apps/dashboard/card.tsx',
      'apps/dashboard/main.ts',
      'aspire/.helpers/helper.mts',
      'contracts/catalog.ts',
      'database/postgres/schema.ts',
      'plugins/example/runtime.ts',
      'sagas/example/runtime.ts',
      'services/users/main.ts',
      'streams/example/runtime.ts',
      'tests/smoke_test.ts',
      'triggers/example/runtime.ts',
      'workers/example/runtime.ts',
    ]);
  });
});

Deno.test('generated quality runner propagates a selected TypeScript failure', async () => {
  await withTempRoots(async (projectRoot, runnerRoot) => {
    const sourcePath = join(projectRoot, 'plugins/example/runtime.ts');
    await Deno.mkdir(join(sourcePath, '..'), { recursive: true });
    await Deno.writeTextFile(sourcePath, 'const value: string = 1;\n');

    const result = await runQuality(projectRoot, 'check', runnerRoot);
    assertEquals(result.code, 1);
    assertEquals(result.report.ok, false);
    assertEquals(result.report.selection.files, ['plugins/example/runtime.ts']);
    assertEquals(result.report.batches.map((batch) => batch.exitCode), [1]);
  });
});

Deno.test('generated quality runner is itself lint and format clean in its consumer location', async () => {
  await withTempRoots(async (projectRoot) => {
    const runnerRoot = join(projectRoot, '.netscript');
    await Deno.mkdir(runnerRoot);
    await Deno.writeTextFile(
      join(projectRoot, 'deno.json'),
      JSON.stringify({ fmt: { lineWidth: 100, singleQuote: true } }),
    );
    const sourcePath = join(projectRoot, 'apps/dashboard/main.ts');
    await Deno.mkdir(join(sourcePath, '..'), { recursive: true });
    await Deno.writeTextFile(sourcePath, 'export const main = true;\n');

    for (const mode of ['lint', 'fmt-check']) {
      const result = await runQuality(projectRoot, mode, runnerRoot);
      assertEquals(result.code, 0, JSON.stringify(result.report));
      assertEquals(result.report.ok, true);
      assertEquals(result.report.selection.files, [
        '.netscript/quality-runner.ts',
        'apps/dashboard/main.ts',
      ]);
    }
  });
});
