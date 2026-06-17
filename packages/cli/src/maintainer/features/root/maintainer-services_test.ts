import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';

import { orchestrateMaintainerInit } from '../init/orchestrate-maintainer-init.ts';
import { probeMonorepo } from '../probe/probe-monorepo.ts';
import { runScaffoldTest } from '../test-scaffold/run-scaffold-test.ts';
import { syncPackages } from '../sync/packages/sync-packages.ts';
import { syncPlugin } from '../sync/plugin/sync-plugin.ts';
import { syncTemplates } from '../sync/templates/sync-templates.ts';

describe('maintainer application services', () => {
  it('syncPackages delegates to the package copier port', async () => {
    const result = await syncPackages({
      sourceRoot: '/repo',
      targetPath: '/tmp/demo',
      dbEngines: ['postgres'],
    }, {
      packageCopier: {
        copyLocalPackages: (options) =>
          Promise.resolve({
            directoriesCreated: [options.targetPath + '/packages'],
            filesCreated: [options.targetPath + '/packages/config/mod.ts'],
            packagesCopied: options.dbEngines?.length ?? 0,
          }),
      },
    });

    assertEquals(result.packagesCopied, 1);
    assertEquals(result.directoriesCreated, ['/tmp/demo/packages']);
  });

  it('syncPlugin discovers the source root and defaults to canonical names', async () => {
    const result = await syncPlugin({
      startDir: '/repo/worktrees/refactor-cli-doctrine-rewrite',
      targetPath: '/tmp/demo',
      projectName: 'demo',
      kind: 'worker',
    }, {
      getSource: () => Promise.resolve({ canonicalName: 'workers' }),
      findSourceRoot: () => Promise.resolve('/repo'),
      copyPlugin: (request) =>
        Promise.resolve({
          pluginName: request.pluginName,
          pluginDir: '/tmp/demo/plugins/workers',
          backgroundDir: '/tmp/demo/workers',
          serviceConfigKey: 'workers-api',
          servicePort: 8091,
          backgroundPort: 8091,
          workspaceMembers: ['./workers'],
          filesCreated: ['/tmp/demo/plugins/workers/mod.ts'],
          directoriesCreated: ['/tmp/demo/plugins/workers'],
        }),
    });

    assertEquals(result.sourceRoot, '/repo');
    assertEquals(result.pluginName, 'workers');
    assertEquals(result.workspaceMembers, ['./workers']);
  });

  it('syncTemplates runs all registered steps in order', async () => {
    const result = await syncTemplates({
      targetPath: '/repo/fixture',
    }, {
      steps: [
        {
          name: 'aspire',
          run: () => Promise.resolve(['/repo/fixture/aspire/apphost.mts']),
        },
        {
          name: 'registry',
          run: () => Promise.resolve(['/repo/fixture/plugins/registry.ts']),
        },
      ],
    });

    assertEquals(result.filesWritten, 2);
    assertEquals(result.steps.map((step) => step.name), ['aspire', 'registry']);
  });

  it('probeMonorepo reports local sync capabilities and localBase', async () => {
    const result = await probeMonorepo({
      startDir: '/repo/scaffold',
      targetPath: '/repo/scaffold/demo',
    }, {
      detectMonorepoRoot: () => Promise.resolve('/repo'),
      findOfficialPluginSourceRoot: () => Promise.resolve('/repo'),
      computeLocalBase: () => '../..',
      hasLocalImportResolver: true,
    });

    assertEquals(result.sourceRoot, '/repo');
    assertEquals(result.localBase, '../..');
    assertEquals(result.canSyncPackages, true);
    assertEquals(result.canSyncPlugins, true);
  });

  it('runScaffoldTest launches the repo e2e task with scaffold suite ids', async () => {
    const calls: Array<{
      command: string;
      args: readonly string[];
      cwd?: string;
    }> = [];

    const result = await runScaffoldTest({
      repoRoot: '/repo',
      fixture: 'plugins',
      cleanup: true,
      format: 'pretty',
    }, {
      process: {
        exec: (command, args, options) => {
          calls.push({ command, args, cwd: options?.cwd });
          return Promise.resolve({ code: 0, stdout: 'ok', stderr: '' });
        },
      },
    });

    assertEquals(result.suiteId, 'scaffold.plugins');
    assertEquals(calls, [{
      command: 'deno',
      args: ['task', 'e2e:cli', 'run', 'scaffold.plugins', '--cleanup', '--format', 'pretty'],
      cwd: '/repo',
    }]);
  });

  it('orchestrateMaintainerInit runs local-mode init and package sync', async () => {
    const calls: string[] = [];

    const result = await orchestrateMaintainerInit({
      name: 'demo',
      path: 'scaffold',
      force: false,
      ci: true,
      yes: false,
      dryRun: false,
      noGit: true,
      noAspire: true,
      legacyAspire: false,
      dbEngine: 'postgres',
    }, {
      cwd: () => 'C:/repo',
      detectMonorepoRoot: () => Promise.resolve('C:/repo'),
      runInit: (request) => {
        calls.push(`init:${request.importMode}:${request.localBase}:${request.sourceRoot}`);
        return Promise.resolve({
          name: request.name,
          targetPath: 'C:/repo/scaffold/demo',
          phases: [],
          dryRun: false,
          durationMs: 0,
          totalFilesCreated: 0,
          totalDirectoriesCreated: 0,
        });
      },
      syncPackages: (request) => {
        calls.push(`packages:${request.sourceRoot}:${request.targetPath}`);
        return Promise.resolve({
          directoriesCreated: ['C:/repo/scaffold/demo/packages'],
          filesCreated: ['C:/repo/scaffold/demo/packages/config/mod.ts'],
          packagesCopied: 1,
        });
      },
    });

    assertEquals(result.sourceRoot, 'C:/repo');
    assertEquals(result.localBase, '.');
    assertEquals(calls, [
      'init:local:.:C:/repo',
      'packages:C:/repo:C:/repo/scaffold/demo',
    ]);
    assertEquals(result.packageSync?.packagesCopied, 1);
  });

  it('orchestrateMaintainerInit fails when no monorepo root is available', async () => {
    await assertRejects(
      () =>
        orchestrateMaintainerInit({
          name: 'demo',
          force: false,
          ci: true,
          yes: false,
          dryRun: false,
          noGit: true,
          noAspire: true,
          legacyAspire: false,
        }, {
          cwd: () => '/tmp',
          detectMonorepoRoot: () => Promise.resolve(undefined),
          runInit: () =>
            Promise.resolve({
              name: 'demo',
              targetPath: '/tmp/demo',
              phases: [],
              dryRun: false,
              durationMs: 0,
              totalFilesCreated: 0,
              totalDirectoriesCreated: 0,
            }),
          syncPackages: () =>
            Promise.resolve({
              directoriesCreated: [],
              filesCreated: [],
              packagesCopied: 0,
            }),
        }),
      Error,
      'Maintainer init requires a NetScript monorepo checkout',
    );
  });
});
