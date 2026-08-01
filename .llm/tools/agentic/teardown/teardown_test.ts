import { assertEquals } from '@std/assert';
import { buildLeakReport } from './leak-check.ts';
import type { CommandPort, FilePort } from './ports.ts';
import { emptyRunResources } from './run-resources.ts';
import { runTeardown } from './teardown.ts';

const root = '/home/codex/repos/fix-1046';

Deno.test('dry run and foreign resources execute no commands', async () => {
  const called: string[][] = [];
  const commands: CommandPort = {
    run(command) {
      called.push([...command]);
      return Promise.resolve({ code: 0, stdout: '', stderr: '' });
    },
  };
  const registry = emptyRunResources(root);
  const report = buildLeakReport(
    [
      { kind: 'apphost', appHostPath: `${root}/apphost.mts`, appHostPid: 1 },
      { kind: 'container', id: 'foreign', mountSource: '/home/codex/repos/fix-1025/.data' },
    ],
    registry,
    root,
  );
  assertEquals((await runTeardown(report, registry, false, commands)).applied, false);
  assertEquals(called, []);
});

Deno.test('apply stops each AppHost by path and re-verifies a single container id', async () => {
  const called: string[][] = [];
  const registry = emptyRunResources(root);
  const resources = [
    { kind: 'apphost' as const, appHostPath: `${root}/apphost.mts`, appHostPid: 1 },
    {
      kind: 'container' as const,
      id: 'owned-id',
      creatorPid: 2,
      creatorProcessStartTime: 'start',
      mountSource: `${root}/.data`,
    },
  ];
  const commands: CommandPort = {
    run(command) {
      called.push([...command]);
      if (command[0] === 'docker' && command[1] === 'inspect') {
        return Promise.resolve({
          code: 0,
          stdout: JSON.stringify([{
            Id: 'owned-id',
            Name: '/postgres-owned',
            Config: {
              Labels: {
                'com.microsoft.developer.usvc-dev.creatorProcessId': '2',
                'com.microsoft.developer.usvc-dev.creatorProcessStartTime': 'start',
                'com.microsoft.developer.usvc-dev.mountsLabel': `type=bind,src=${root}/.data`,
              },
            },
          }]),
          stderr: '',
        });
      }
      return Promise.resolve({ code: 0, stdout: '', stderr: '' });
    },
  };
  const files: FilePort = {
    realPath: (path) => Promise.resolve(path),
    readText: () => Promise.resolve(''),
  };
  const result = await runTeardown(
    buildLeakReport(resources, registry, root),
    registry,
    true,
    commands,
    files,
  );
  assertEquals(result.stoppedAppHosts, [`${root}/apphost.mts`]);
  assertEquals(result.removedContainers, ['owned-id']);
  assertEquals(called, [
    ['aspire', 'stop', '--apphost', `${root}/apphost.mts`, '--non-interactive', '--nologo'],
    ['docker', 'inspect', 'owned-id'],
    ['docker', 'rm', '-f', 'owned-id'],
  ]);
});

Deno.test('changed labels abandon removal and escalate', async () => {
  const registry = emptyRunResources(root);
  const resource = { kind: 'container' as const, id: 'changed', mountSource: `${root}/.data` };
  const commands: CommandPort = {
    run() {
      return Promise.resolve({
        code: 0,
        stdout: JSON.stringify([{
          Id: 'changed',
          Config: {
            Labels: {
              'com.microsoft.developer.usvc-dev.creatorProcessId': '9',
              'com.microsoft.developer.usvc-dev.mountsLabel': 'malformed',
            },
          },
        }]),
        stderr: '',
      });
    },
  };
  const files: FilePort = {
    realPath: (path) => Promise.resolve(path),
    readText: () => Promise.resolve(''),
  };
  const result = await runTeardown(
    buildLeakReport([resource], registry, root),
    registry,
    true,
    commands,
    files,
  );
  assertEquals(result.removedContainers, []);
  assertEquals(result.escalated.length, 1);
});
