import { assertEquals } from '@std/assert';
import { buildLeakReport } from './leak-check.ts';
import type { CommandPort, FilePort } from './ports.ts';
import { emptyRunResources } from './run-resources.ts';
import { runTeardown, teardownExitCode } from './teardown.ts';

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

Deno.test('apply exits non-zero when requested cleanup is escalated', () => {
  const report = buildLeakReport(
    [{ kind: 'container', id: 'foreign', mountSource: '/home/codex/repos/fix-1025/.data' }],
    emptyRunResources(root),
    root,
  );
  const escalated = report.survivors[0];
  assertEquals(
    teardownExitCode({
      applied: true,
      stoppedAppHosts: [],
      removedContainers: [],
      escalated: [escalated],
      atRiskNetworks: [],
    }),
    4,
  );
  assertEquals(
    teardownExitCode({
      applied: false,
      stoppedAppHosts: [],
      removedContainers: [],
      escalated: [escalated],
      atRiskNetworks: [],
    }),
    0,
  );
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
    readText: (path) => {
      // The AppHost process is gone after the stop, so `/proc/<pid>` no longer resolves.
      if (path.startsWith('/proc/')) return Promise.reject(new Deno.errors.NotFound(path));
      return Promise.resolve('');
    },
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
    // `-v` removes the container's anonymous volumes (issue #1855: `docker rm -f` left them behind).
    // Docker itself defines which volumes are anonymous, and named volumes survive.
    ['docker', 'rm', '-f', '-v', 'owned-id'],
  ]);
});

Deno.test('teardown never mutates networks or standalone volumes and reports at-risk networks', async () => {
  const called: string[][] = [];
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
    readText: (path) => {
      if (path.startsWith('/proc/')) return Promise.reject(new Deno.errors.NotFound(path));
      return Promise.resolve('');
    },
  };
  const registry = emptyRunResources(root);
  const report = buildLeakReport(
    [
      {
        kind: 'apphost' as const,
        appHostPath: `${root}/apphost.mts`,
        appHostPid: 1,
      },
      {
        kind: 'container' as const,
        id: 'owned-id',
        creatorPid: 2,
        creatorProcessStartTime: 'start',
        mountSource: `${root}/.data`,
      },
      {
        kind: 'volume' as const,
        id: 'anonhash',
        mountedBy: ['owned-id'],
      },
      {
        kind: 'network' as const,
        id: 'net581c13b7full',
        name: 'aspire-persistent-network-581c13b7-aspire-managed',
        attachedContainers: [],
      },
    ],
    registry,
    root,
  );
  const result = await runTeardown(report, registry, true, commands, files);
  assertEquals(result.removedContainers, ['owned-id']);
  assertEquals(result.atRiskNetworks.length, 1);
  assertEquals(result.atRiskNetworks[0].resource.kind, 'network');
  // Only `aspire stop` and the container re-inspect/removal may run: no network rm, no volume rm.
  assertEquals(called, [
    ['aspire', 'stop', '--apphost', `${root}/apphost.mts`, '--non-interactive', '--nologo'],
    ['docker', 'inspect', 'owned-id'],
    ['docker', 'rm', '-f', '-v', 'owned-id'],
  ]);
});

Deno.test('a zero exit from aspire stop is not accepted while the process survives', async () => {
  const registry = emptyRunResources(root);
  const resource = {
    kind: 'apphost' as const,
    appHostPath: `${root}/apphost.mts`,
    appHostPid: 1,
    appHostStartedAt: '12345',
  };
  const commands: CommandPort = {
    // `aspire stop` reports success once it has signalled the AppHost, before its tree is down.
    run: () => Promise.resolve({ code: 0, stdout: '', stderr: '' }),
  };
  const files: FilePort = {
    realPath: (path) => Promise.resolve(path),
    readText: () => Promise.resolve(`1 (dotnet) S ${'0 '.repeat(18)}12345`),
  };
  const slept: number[] = [];
  const result = await runTeardown(
    buildLeakReport([resource], registry, root),
    registry,
    true,
    commands,
    files,
    {
      confirmAttempts: 3,
      confirmIntervalMs: 25,
      sleep: (ms) => {
        slept.push(ms);
        return Promise.resolve();
      },
    },
  );
  assertEquals(result.stoppedAppHosts, []);
  assertEquals(result.escalated.length, 1);
  assertEquals(slept, [25, 25]);
});

Deno.test('a pid reused by another process counts as stopped', async () => {
  const registry = emptyRunResources(root);
  const resource = {
    kind: 'apphost' as const,
    appHostPath: `${root}/apphost.mts`,
    appHostPid: 1,
    appHostStartedAt: '12345',
  };
  const commands: CommandPort = {
    run: () => Promise.resolve({ code: 0, stdout: '', stderr: '' }),
  };
  const files: FilePort = {
    realPath: (path) => Promise.resolve(path),
    readText: () => Promise.resolve(`1 (other) S ${'0 '.repeat(18)}99999`),
  };
  const result = await runTeardown(
    buildLeakReport([resource], registry, root),
    registry,
    true,
    commands,
    files,
    { sleep: () => Promise.resolve() },
  );
  assertEquals(result.stoppedAppHosts, [`${root}/apphost.mts`]);
  assertEquals(result.escalated, []);
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
