import { assertEquals, assertStringIncludes } from '@std/assert';
import { join } from '@std/path';
import { collectChangedSourceFiles } from './changed-source-files.ts';

async function git(cwd: string, ...args: string[]): Promise<string> {
  const output = await new Deno.Command('git', { cwd, args }).output();
  if (!output.success) throw new Error(new TextDecoder().decode(output.stderr));
  return new TextDecoder().decode(output.stdout).trim();
}

async function write(root: string, path: string, text: string): Promise<void> {
  const target = join(root, path);
  await Deno.mkdir(join(target, '..'), { recursive: true });
  await Deno.writeTextFile(target, text);
}

Deno.test('changed-source selector includes .llm/tools-only diffs and reports an empty set', async () => {
  const root = await Deno.makeTempDir();
  await git(root, 'init', '-q');
  await git(root, 'config', 'user.email', 'fixture@example.test');
  await git(root, 'config', 'user.name', 'Fixture');
  await write(root, 'README.md', 'base\n');
  await git(root, 'add', '.');
  await git(root, 'commit', '-qm', 'base');
  const base = await git(root, 'rev-parse', 'HEAD');

  await write(root, '.llm/tools/quality/new-rule.ts', 'const unsafe: any = 1;\n');
  await git(root, 'add', '.');
  await git(root, 'commit', '-qm', 'tool change');
  const head = await git(root, 'rev-parse', 'HEAD');

  assertEquals(await collectChangedSourceFiles(root, base, head), [
    '.llm/tools/quality/new-rule.ts',
  ]);
  assertEquals(await collectChangedSourceFiles(root, head, head), []);

  const empty = await new Deno.Command(Deno.execPath(), {
    cwd: root,
    args: [
      'run',
      '--allow-run',
      join(Deno.cwd(), '.llm/tools/quality/changed-source-files.ts'),
      head,
      head,
    ],
  }).output();
  assertEquals(empty.code, 2);
  assertEquals(
    new TextDecoder().decode(empty.stderr).trim(),
    'not scanned: no changed source files matched packages, plugins, or .llm/tools',
  );
});

Deno.test('changed-source selector uses merge-base and excludes foreign merged files', async () => {
  const root = await Deno.makeTempDir();
  await git(root, 'init', '-q');
  await git(root, 'config', 'user.email', 'fixture@example.test');
  await git(root, 'config', 'user.name', 'Fixture');
  await write(root, 'README.md', 'base\n');
  await git(root, 'add', '.');
  await git(root, 'commit', '-qm', 'common base');
  const common = await git(root, 'rev-parse', 'HEAD');

  await git(root, 'switch', '-qc', 'feature', common);
  await write(root, '.llm/tools/quality/owned.ts', 'export const owned = true;\n');
  await git(root, 'add', '.');
  await git(root, 'commit', '-qm', 'owned change');
  const head = await git(root, 'rev-parse', 'HEAD');

  await git(root, 'switch', '-q', 'master');
  await write(root, 'packages/foreign/mod.ts', 'export const foreign = true;\n');
  await git(root, 'add', '.');
  await git(root, 'commit', '-qm', 'foreign merged change');
  const recordedBase = await git(root, 'rev-parse', 'HEAD');

  assertEquals(await collectChangedSourceFiles(root, recordedBase, head), [
    '.llm/tools/quality/owned.ts',
  ]);
});

Deno.test('code-quality workflow executes the selector for every .llm/tools change', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/code-quality.yml');
  assertStringIncludes(workflow, "- '.llm/tools/**'");
  assertStringIncludes(
    workflow,
    'changed_files=$(deno run --allow-run .llm/tools/quality/changed-source-files.ts',
  );
  assertStringIncludes(workflow, 'deno task quality:scan --pretty "${args[@]}"');
  assertStringIncludes(
    workflow,
    'deno run --allow-run .llm/tools/quality/check-allowance-budget-diff.ts',
  );
  assertStringIncludes(workflow, 'github.event.pull_request.base.sha');
  assertStringIncludes(workflow, 'github.event.pull_request.head.sha');
});
