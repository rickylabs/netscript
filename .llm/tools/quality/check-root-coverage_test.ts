import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl, join } from '@std/path';
import {
  checkRootCoverage,
  evaluateRootCoverage,
  type RootCoverageInput,
  type RootCoverageMember,
} from './check-root-coverage.ts';

function member(
  root: string,
  publishable = true,
  name = `@fixture/${root.replaceAll('/', '-')}`,
): RootCoverageMember {
  return { name, root, publishable };
}

function input(overrides: Partial<RootCoverageInput> = {}): RootCoverageInput {
  return {
    workspaceMembers: [member('packages/alpha'), member('plugins/beta')],
    doctrineRoots: ['packages/alpha', 'plugins/beta'],
    taskCommands: {
      'quality:scan': 'scanner --root packages --root plugins',
      'quality:scan:repo': 'scanner --root packages --root plugins',
    },
    ...overrides,
  };
}

Deno.test('fails closed when a publishable member is omitted from a configured root list', () => {
  const report = evaluateRootCoverage(input({
    taskCommands: {
      'quality:scan': 'scanner --root packages/alpha',
      'quality:scan:repo': 'scanner --root packages --root plugins',
    },
  }));

  assertEquals(report.ok, false);
  assertEquals(report.qualityTasks[0].uncoveredPublishedMembers, ['plugins/beta']);
  assertStringIncludes(report.errors[0], 'quality:scan');
});

Deno.test('rejects a descendant root and accepts broad roots for future members', () => {
  const descendant = evaluateRootCoverage(input({
    taskCommands: {
      'quality:scan': 'scanner --root packages/alpha/src --root plugins',
      'quality:scan:repo': 'scanner --root packages --root plugins',
    },
  }));
  assertEquals(descendant.qualityTasks[0].uncoveredPublishedMembers, ['packages/alpha']);

  const future = evaluateRootCoverage(input({
    workspaceMembers: [
      member('packages/alpha'),
      member('packages/new-package'),
      member('plugins/beta'),
    ],
    doctrineRoots: ['packages/alpha', 'packages/new-package', 'plugins/beta'],
  }));
  assertEquals(future.ok, true);
  assertEquals(future.qualityTasks[0].uncoveredPublishedMembers, []);
});

Deno.test('names both non-publishable exclusions and the parent-directory boundary', () => {
  const report = evaluateRootCoverage(input({
    workspaceMembers: [
      member('packages/alpha'),
      member('packages/bench', false),
      member('packages/cli/e2e', false),
      member('examples/demo'),
      member('apps/site'),
    ],
    doctrineRoots: ['packages/alpha'],
  }));

  assertEquals(report.census, {
    workspaceMembers: 5,
    membersInsideBoundary: 3,
    publishableMembersInsideBoundary: 1,
  });
  assertEquals(report.boundary.excludedWorkspaceMembers, {
    count: 2,
    paths: ['apps/site', 'examples/demo'],
    reason: 'outside packages/** and plugins/**',
  });
  assertEquals(report.excludedNonPublishableMembers, [
    { path: 'packages/bench', reason: 'publish:false' },
    { path: 'packages/cli/e2e', reason: 'publish:false' },
  ]);
  assertEquals(report.ok, true);
});

Deno.test('reports configured roots as configuration, never as traversed scanner paths', () => {
  const report = evaluateRootCoverage(input());

  assertEquals(report.qualityTasks[0].configuredRoots, ['packages', 'plugins']);
  assertEquals(report.scannerTraversal, {
    observedByChecker: false,
    traversedPaths: null,
    note:
      'configuredRoots are configuration coverage only; scanner mode and traversed paths belong to the scanner run report',
  });
});

Deno.test('fails closed for empty census and malformed or missing task roots', () => {
  const empty = evaluateRootCoverage(input({ workspaceMembers: [], doctrineRoots: [] }));
  assertEquals(empty.ok, false);
  assert(empty.errors.some((error) => error.includes('denominator is empty')));

  const malformed = evaluateRootCoverage(input({
    taskCommands: {
      'quality:scan': 'scanner --changed-file file.ts',
      'quality:scan:repo': '',
    },
  }));
  assertEquals(malformed.ok, false);
  assert(malformed.errors.some((error) => error.includes('quality:scan has no configured roots')));
  assert(malformed.errors.some((error) => error.includes('quality:scan:repo is missing')));
});

Deno.test('sorts every reported path deterministically', () => {
  const report = evaluateRootCoverage(input({
    workspaceMembers: [
      member('plugins/zeta'),
      member('examples/zeta'),
      member('packages/alpha'),
      member('apps/alpha'),
      member('packages/bench', false),
    ],
    doctrineRoots: ['plugins/zeta', 'packages/alpha'],
    taskCommands: {
      'quality:scan': 'scanner --root plugins --root packages',
      'quality:scan:repo': 'scanner --root plugins --root packages',
    },
  }));

  assertEquals(report.publishableMembers, ['packages/alpha', 'plugins/zeta']);
  assertEquals(report.boundary.excludedWorkspaceMembers.paths, ['apps/alpha', 'examples/zeta']);
  assertEquals(report.qualityTasks[0].configuredRoots, ['packages', 'plugins']);
});

Deno.test('live repository census and configured task coverage stay explicit', async () => {
  const report = await checkRootCoverage();

  assertEquals(report.census, {
    workspaceMembers: 37,
    membersInsideBoundary: 37,
    publishableMembersInsideBoundary: 35,
  });
  assertEquals(report.excludedNonPublishableMembers, [
    { path: 'packages/bench', reason: 'publish:false' },
    { path: 'packages/cli/e2e', reason: 'publish:false' },
  ]);
  assertEquals(report.boundary.excludedWorkspaceMembers.count, 0);
  assertEquals(report.qualityTasks[0].configuredRoots, ['docs/site', 'packages', 'plugins']);
  assertEquals(report.qualityTasks[0].uncoveredPublishedMembers, []);
  assertEquals(report.qualityTasks[1].configuredRoots, [
    '.llm/tools/fitness',
    '.llm/tools/quality',
    'docs/site',
    'packages',
    'plugins',
  ]);
  assertEquals(report.qualityTasks[1].uncoveredPublishedMembers, []);
  assertEquals(report.doctrine.uncoveredPublishedMembers, []);
  assertEquals(report.ok, true);
});

Deno.test('CLI emits structured JSON and exits non-zero for incomplete configured coverage', async () => {
  const root = await Deno.makeTempDir();
  const checker = fromFileUrl(new URL('./check-root-coverage.ts', import.meta.url));
  await Deno.mkdir(join(root, 'packages/covered'), { recursive: true });
  await Deno.mkdir(join(root, 'packages/uncovered'), { recursive: true });
  await Deno.mkdir(join(root, 'plugins'), { recursive: true });
  await Deno.writeTextFile(
    join(root, 'packages/covered/deno.json'),
    JSON.stringify({ name: '@fixture/covered', exports: './mod.ts' }),
  );
  await Deno.writeTextFile(
    join(root, 'packages/uncovered/deno.json'),
    JSON.stringify({ name: '@fixture/uncovered', exports: './mod.ts' }),
  );
  await Deno.writeTextFile(
    join(root, 'deno.json'),
    JSON.stringify({
      workspace: ['packages/*', 'plugins/*'],
      tasks: {
        'quality:scan': 'scanner --root packages/covered --root plugins',
        'quality:scan:repo': 'scanner --root packages --root plugins',
      },
    }),
  );
  const output = await new Deno.Command(Deno.execPath(), {
    args: ['run', '--allow-read', checker],
    cwd: root,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const report = JSON.parse(new TextDecoder().decode(output.stdout)) as {
    ok: boolean;
    qualityTasks: Array<{ task: string; uncoveredPublishedMembers: string[] }>;
    errors: string[];
  };

  assertEquals(output.code, 1);
  assertEquals(report.ok, false);
  assertEquals(report.qualityTasks[0].task, 'quality:scan');
  assertEquals(report.qualityTasks[0].uncoveredPublishedMembers, ['packages/uncovered']);
  assert(report.errors.some((error) => error.includes('quality:scan does not cover')));
});

Deno.test('deno task runs the checker and forwards changed-file args only to the last command', async () => {
  const root = await Deno.makeTempDir();
  const checker = fromFileUrl(new URL('./check-root-coverage.ts', import.meta.url));
  await Deno.mkdir(join(root, 'packages/alpha'), { recursive: true });
  await Deno.mkdir(join(root, 'plugins'), { recursive: true });
  await Deno.mkdir(join(root, 'examples/demo'), { recursive: true });
  await Deno.mkdir(join(root, 'apps'), { recursive: true });
  await Deno.writeTextFile(
    join(root, 'packages/alpha/deno.json'),
    JSON.stringify({ name: '@fixture/alpha', exports: './mod.ts' }),
  );
  await Deno.writeTextFile(
    join(root, 'examples/demo/deno.json'),
    JSON.stringify({ name: '@fixture/demo', exports: './mod.ts' }),
  );
  await Deno.writeTextFile(
    join(root, 'tail.ts'),
    "await Deno.writeTextFile('forwarded.json', JSON.stringify(Deno.args));\n",
  );
  const checkerCommand = `deno run --allow-read ${JSON.stringify(checker)}`;
  const tailCommand = 'deno run --allow-write tail.ts --root packages';
  await Deno.writeTextFile(
    join(root, 'deno.json'),
    JSON.stringify({
      workspace: ['packages/*', 'plugins/*', 'examples/*', 'apps/*'],
      tasks: {
        'quality:scan': `${checkerCommand} && ${tailCommand}`,
        'quality:scan:repo': `scanner --root packages`,
      },
    }),
  );

  const output = await new Deno.Command(Deno.execPath(), {
    args: ['task', 'quality:scan', '--changed-file', 'packages/alpha/mod.ts'],
    cwd: root,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(output.stdout).trim();
  const report = JSON.parse(stdout) as {
    ok: boolean;
    scannerTraversal: { observedByChecker: boolean };
  };

  assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
  assertEquals(report.ok, true);
  assertEquals(report.scannerTraversal.observedByChecker, false);
  assertEquals(JSON.parse(await Deno.readTextFile(join(root, 'forwarded.json'))), [
    '--root',
    'packages',
    '--changed-file',
    'packages/alpha/mod.ts',
  ]);
});
