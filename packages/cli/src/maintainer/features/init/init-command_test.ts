import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals } from 'jsr:@std/assert@^1';

import { createMaintainerInitCommand } from './init-command.ts';

describe('createMaintainerInitCommand', () => {
  it('accepts an explicit boolean value for --service without consuming the project name', async () => {
    const initCalls: string[] = [];
    const printed: string[] = [];
    const command = createMaintainerInitCommand({
      print: (message) => printed.push(message),
      initDependencies: {
        cwd: () => 'C:/repo',
        detectMonorepoRoot: () => Promise.resolve('C:/repo'),
        runInit: (request) => {
          initCalls.push(
            `${request.name}:${request.appName}:${request.includeExampleService}:${request.serviceName}:${request.dbEngine}:${request.editor}`,
          );
          return Promise.resolve({
            name: request.name,
            targetPath: `C:/repo/${request.name}`,
            phases: [],
            dryRun: request.dryRun,
            durationMs: 0,
            totalFilesCreated: 0,
            totalDirectoriesCreated: 0,
          });
        },
        syncPackages: () =>
          Promise.resolve({
            directoriesCreated: [],
            filesCreated: [],
            packagesCopied: 0,
          }),
      },
    });

    await command.parse([
      'smoke-test',
      '--app-name',
      'frontend',
      '--service',
      'true',
      '--service-name',
      'user',
      '--db',
      'postgres',
      '--editor',
      'zed',
      '--dry-run',
    ]);

    assertEquals(initCalls, ['smoke-test:frontend:true:user:postgres:zed']);
    assertEquals(printed[0], 'Maintainer scaffold root: C:/repo/smoke-test');
  });
});
