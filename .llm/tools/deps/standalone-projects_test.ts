import './census.ts';
import './prod-install.ts';
import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert';
import { basePinnedVersion } from './latest.ts';
import { workspaceReport } from './standalone-deps.ts';
import {
  BROWSER_PROJECT,
  coverageNotice,
  npmArgs,
  projectInventory,
  projectSelection,
  type Runner,
  selectedProjectReport,
  standaloneCoverage,
} from './standalone-projects.ts';

const selected = ['--project', BROWSER_PROJECT];
const stable = { basePinnedVersion, fetchLatestStable: () => Promise.resolve('4.11.4') };

async function fixture(run: (root: string) => Promise<void>) {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/${BROWSER_PROJECT}`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/${BROWSER_PROJECT}/package.json`,
      JSON.stringify({ private: true, devDependencies: { 'axe-core': '4.10.3' } }),
    );
    await Deno.writeTextFile(
      `${root}/${BROWSER_PROJECT}/package-lock.json`,
      JSON.stringify({
        lockfileVersion: 3,
        packages: {
          '': { devDependencies: { 'axe-core': '4.10.3' } },
          'node_modules/axe-core': { version: '4.10.3' },
        },
      }),
    );
    await run(root);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test('project selectors precede why positionals and reject invalid routing', () => {
  assertEquals(projectSelection([...selected, 'axe-core', '--pretty']), {
    project: BROWSER_PROJECT,
    args: ['axe-core', '--pretty'],
  });
  assertEquals(projectSelection([`--project=${BROWSER_PROJECT}`, 'axe-core']).args, ['axe-core']);
  assertEquals(projectSelection(['axe-core']).project, null);
  for (
    const args of [['--project'], ['--project', '--pretty'], ['--project', '../elsewhere'], [
      ...selected,
      ...selected,
    ]]
  ) assertThrows(() => projectSelection(args));
});

Deno.test('census reads exact standalone declarations and lock without subprocess permission', async () => {
  const inventory = await projectInventory(Deno.cwd());
  assertEquals(inventory.dependencies.length, 5);
  assertEquals(inventory.scope, 'direct');
  for (const dependency of inventory.dependencies) {
    assertEquals(dependency.declared, dependency.locked);
  }
  assertEquals(standaloneCoverage('census')[0].included, true);
  for (const mode of ['latest', 'outdated', 'why', 'audit', 'prod-install'] as const) {
    assertEquals(standaloneCoverage(mode)[0].included, false);
    assert(coverageNotice(mode).includes(BROWSER_PROJECT));
  }
});

Deno.test('inventory rejects stale lock declarations and locked versions', async () => {
  await fixture(async (root) => {
    const path = `${root}/${BROWSER_PROJECT}/package-lock.json`;
    const lock = JSON.parse(await Deno.readTextFile(path));
    lock.packages['node_modules/axe-core'].version = '4.11.4';
    await Deno.writeTextFile(path, JSON.stringify(lock));
    await assertRejects(() => projectInventory(root), Error, 'mismatch');
    assertEquals((await selectedProjectReport('census', selected, { root }))?.exitCode, 3);
  });
});

Deno.test('locked freshness reports old versions and fails closed on lookup failures', async () => {
  await fixture(async (root) => {
    for (const mode of ['latest', 'outdated'] as const) {
      const result = await selectedProjectReport(mode, [...selected, '--fail-behind'], {
        root,
        stable,
      });
      assertEquals(result?.exitCode, 1);
      assertEquals(result?.report.mode, 'locked-stable');
      assertEquals(result?.report.scope, 'direct');
      assertEquals(result?.report.entries, [{
        name: 'axe-core',
        declared: '4.10.3',
        locked: '4.10.3',
        latestStable: '4.11.4',
        behind: true,
      }]);
      for (
        const fetchLatestStable of [
          () => Promise.reject(new Error('offline')),
          () => Promise.resolve('4.12.0-beta.1'),
        ]
      ) {
        const failed = await selectedProjectReport(mode, selected, {
          root,
          stable: { basePinnedVersion, fetchLatestStable },
        });
        assertEquals(failed?.exitCode, 3);
        assertEquals(failed?.report.clean, false);
        assertEquals(failed?.report.behind, undefined);
      }
    }
    const filtered = await selectedProjectReport('latest', [
      ...selected,
      '--filter',
      'other',
      '--behind-only',
    ], { root, stable });
    assertEquals(filtered?.report.entries, []);
  });
});

Deno.test('project provenance uses only lock graph and never claims safe pruning', async () => {
  await fixture(async (root) => {
    const graph = {
      dependencies: { parent: { dependencies: { 'axe-core': { version: '4.10.3' } } } },
    };
    const runner: Runner = (command, args, cwd) => {
      assertEquals(command, 'npm');
      assertEquals(args, ['ls', 'axe-core', '--all', '--package-lock-only', '--json']);
      assertEquals(cwd, `${root}/${BROWSER_PROJECT}`);
      return Promise.resolve({ code: 0, stdout: JSON.stringify(graph), stderr: '' });
    };
    const report = await selectedProjectReport('why', [...selected, 'axe-core'], { root, runner });
    assertEquals(report?.report.native, graph);
    assertEquals(report?.report.fullyRemovable, false);
    assertEquals(report?.report.transitivelyPresent, true);
    const absent = await selectedProjectReport('why', [...selected, 'absent'], {
      root,
      runner: () => Promise.resolve({ code: 1, stdout: '{}', stderr: '' }),
    });
    assertEquals(absent?.exitCode, 0);
    assertEquals(absent?.report.transitivelyPresent, false);
  });
});

Deno.test('audit preserves advisory reports but distinguishes operational and coverage failures', async () => {
  await fixture(async (root) => {
    const native = {
      auditReportVersion: 2,
      vulnerabilities: { 'axe-core': { severity: 'high' } },
      metadata: { vulnerabilities: { total: 1 }, dependencies: { dev: 1, total: 1 } },
    };
    const runner: Runner = (_command, args) => {
      assert(args.includes('--include=dev'));
      assert(args.includes('--package-lock-only'));
      assert(!args.includes('fix'));
      return Promise.resolve({ code: 1, stdout: JSON.stringify(native), stderr: '' });
    };
    assertEquals((await selectedProjectReport('audit', selected, { root, runner }))?.exitCode, 0);
    const found = await selectedProjectReport('audit', [...selected, '--fail-on-find'], {
      root,
      runner,
    });
    assertEquals(found?.exitCode, 1);
    assertEquals(found?.report.coveredPackages, 1);
    const belowThreshold = await selectedProjectReport('audit', [
      ...selected,
      '--level',
      'high',
      '--fail-on-find',
    ], {
      root,
      runner: () =>
        Promise.resolve({
          code: 0,
          stdout: JSON.stringify({
            ...native,
            vulnerabilities: { 'axe-core': { severity: 'low' } },
          }),
          stderr: '',
        }),
    });
    assertEquals(belowThreshold?.exitCode, 0);
    assertEquals(belowThreshold?.report.advisoriesFound, false);
    assertEquals(belowThreshold?.report.totalAdvisories, 1);

    for (
      const output of [
        'not json',
        '{"error":{"code":"OFFLINE"}}',
        JSON.stringify({
          ...native,
          metadata: { ...native.metadata, dependencies: { dev: 0, total: 0 } },
        }),
      ]
    ) {
      assertEquals(
        (await selectedProjectReport('audit', selected, {
          root,
          runner: () => Promise.resolve({ code: 1, stdout: output, stderr: '' }),
        }))?.exitCode,
        3,
      );
    }
    assertEquals(
      (await selectedProjectReport('audit', selected, {
        root,
        runner: () => Promise.reject(new Error('npm missing')),
      }))?.exitCode,
      3,
    );
  });
});

Deno.test('usage and dev-only install refusals execute nothing', async () => {
  const runner: Runner = () => {
    throw new Error('must not execute');
  };
  for (
    const [mode, args] of [
      ['prod-install', selected],
      ['why', selected],
      ['audit', [...selected, '--level', 'invalid']],
      ['census', ['--project', 'unknown']],
    ] as const
  ) assertEquals((await selectedProjectReport(mode, [...args], { runner }))?.exitCode, 2);
  assertThrows(() => npmArgs('audit', ['--level']));
});

Deno.test('workspace shim preserves child permissions, fields and exit codes without real npm/network', async () => {
  const runner: Runner = (command, args) => {
    assertEquals(command, 'deno');
    assertEquals(args, [
      'run',
      '--allow-read',
      '--allow-run',
      '.llm/tools/deps/outdated.ts',
      '--latest',
    ]);
    return Promise.resolve({ code: 17, stdout: '{"rows":[],"count":0}', stderr: '' });
  };
  const result = await workspaceReport('outdated', ['--pretty', '--latest'], runner);
  assertEquals(result.exitCode, 17);
  assertEquals(result.report.count, 0);
  assertEquals(result.report.standaloneCoverage, standaloneCoverage('outdated'));
  const bad = await workspaceReport(
    'why',
    ['axe-core'],
    () => Promise.resolve({ code: 0, stdout: 'null', stderr: '' }),
  );
  assertEquals(bad.exitCode, 3);
});

Deno.test('CLI census works read-only and invalid selectors/install modes never spawn npm', async () => {
  for (
    const [file, args, code] of [
      ['census.ts', [...selected, '--json'], 0],
      ['census.ts', ['--json'], 0],
      ['prod-install.ts', selected, 2],
      ['standalone-deps.ts', ['why', ...selected], 2],
      ['census.ts', ['--project', 'unknown'], 2],
    ] as const
  ) {
    const output = await new Deno.Command(Deno.execPath(), {
      args: ['run', '--cached-only', '--allow-read', `.llm/tools/deps/${file}`, ...args],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(output.code, code, new TextDecoder().decode(output.stderr));
    const report = JSON.parse(new TextDecoder().decode(output.stdout));
    if (code === 0 && (args as readonly string[]).includes('--project')) {
      assertEquals(report.dependencies.length, 5);
    } else if (code === 0) {
      assertEquals(report.standaloneCounts.directDependencies, 5);
      assertEquals(report.standaloneCoverage[0].included, true);
      for (
        const key of ['members', 'catalogEntries', 'dependencyKeys', 'dependencyUses', 'tasks']
      ) assertEquals(typeof report.counts[key], 'number');
    } else assertEquals(report.clean, false);
  }
});
