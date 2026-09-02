import { assertEquals } from '@std/assert';
import { buildLeakReport } from './leak-check.ts';
import type {
  AppHostCandidate,
  ContainerCandidate,
  ProcessCandidate,
  ResourceCandidate,
} from './ownership.ts';
import type { CommandPort, FilePort } from './ports.ts';
import { emptyRunResources } from './run-resources.ts';
import {
  NO_RUNNING_APPHOST_FOR_PERSISTENT_CLEANUP,
  parseTeardownArgs,
  runTeardown,
  teardownExitCode,
} from './teardown.ts';

const root = '/home/codex/repos/fix-1046';

Deno.test('force-persistent CLI flag is explicit and remains dry-run without apply', () => {
  assertEquals(
    parseTeardownArgs([
      '--slice-dir',
      '.llm/runs/example',
      '--worktree',
      root,
      '--force-persistent',
    ]),
    {
      sliceDir: '.llm/runs/example',
      worktreeRoot: root,
      apply: false,
      forcePersistent: true,
      ownedRoots: [],
    },
  );
});

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

Deno.test('force-persistent dry run prints exact owned argv and refuses foreign resources', async () => {
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
      {
        kind: 'apphost',
        appHostPath: '/home/codex/repos/fix-1025/apphost.mts',
        appHostPid: 2,
      },
    ],
    registry,
    root,
  );
  const result = await runTeardown(report, registry, false, commands, undefined, {
    forcePersistent: true,
  });
  assertEquals(result.plannedCommands, [
    [
      'aspire',
      'stop',
      '--force',
      '--apphost',
      `${root}/apphost.mts`,
      '--non-interactive',
      '--nologo',
    ],
  ]);
  assertEquals(result.escalated.map((entry) => entry.ownership), ['foreign']);
  assertEquals(called, []);
});

Deno.test('apply uses force-persistent as the single stop while the owned AppHost is running', async () => {
  const called: string[][] = [];
  let stopped = false;
  const commands: CommandPort = {
    run(command) {
      called.push([...command]);
      stopped = true;
      return Promise.resolve({ code: 0, stdout: '', stderr: '' });
    },
  };
  const files: FilePort = {
    realPath: (path) => Promise.resolve(path),
    readText: (path) =>
      stopped
        ? Promise.reject(new Deno.errors.NotFound(path))
        : Promise.resolve(`1 (dotnet) S ${'0 '.repeat(18)}running-start`),
  };
  const registry = emptyRunResources(root);
  const report = buildLeakReport(
    [{
      kind: 'apphost',
      appHostPath: `${root}/apphost.mts`,
      appHostPid: 1,
      appHostStartedAt: 'running-start',
    }],
    registry,
    root,
  );
  const result = await runTeardown(report, registry, true, commands, files, {
    forcePersistent: true,
    processProbe: () => Promise.resolve([]),
  });
  assertEquals(called, [
    [
      'aspire',
      'stop',
      '--force',
      '--apphost',
      `${root}/apphost.mts`,
      '--non-interactive',
      '--nologo',
    ],
  ]);
  assertEquals(result.stoppedAppHosts, [`${root}/apphost.mts`]);
  assertEquals(result.actionsRequired, []);
  assertEquals(result.escalated, []);
});

Deno.test('force-persistent refuses an already-gone AppHost and reports operator action', async () => {
  const called: string[][] = [];
  const commands: CommandPort = {
    run(command) {
      called.push([...command]);
      return Promise.resolve({ code: 0, stdout: '', stderr: '' });
    },
  };
  const files: FilePort = {
    realPath: (path) => Promise.resolve(path),
    readText: (path) => Promise.reject(new Deno.errors.NotFound(path)),
  };
  const registry = emptyRunResources(root);
  const report = buildLeakReport(
    [{
      kind: 'apphost',
      appHostPath: `${root}/apphost.mts`,
      appHostPid: 1,
      appHostStartedAt: 'already-gone',
    }],
    registry,
    root,
  );
  const result = await runTeardown(report, registry, true, commands, files, {
    forcePersistent: true,
    processProbe: () => Promise.resolve([]),
  });
  assertEquals(called, []);
  assertEquals(result.stoppedAppHosts, []);
  assertEquals(result.actionsRequired, [NO_RUNNING_APPHOST_FOR_PERSISTENT_CLEANUP]);
  assertEquals(result.escalated.length, 1);
  assertEquals(teardownExitCode(result), 4);
});

Deno.test('force-persistent with no owned AppHost is action-required rather than clean', async () => {
  const registry = emptyRunResources(root);
  const result = await runTeardown(
    buildLeakReport([], registry, root),
    registry,
    true,
    undefined,
    undefined,
    { forcePersistent: true },
  );
  assertEquals(result.plannedCommands, []);
  assertEquals(result.stoppedAppHosts, []);
  assertEquals(result.actionsRequired, [NO_RUNNING_APPHOST_FOR_PERSISTENT_CLEANUP]);
  assertEquals(teardownExitCode(result), 4);
});

Deno.test('positive force-stop confirmation wins over the command exit code', async () => {
  let stopped = false;
  const commands: CommandPort = {
    run() {
      stopped = true;
      return Promise.resolve({ code: 12, stdout: '', stderr: 'transport closed' });
    },
  };
  const files: FilePort = {
    realPath: (path) => Promise.resolve(path),
    readText: (path) =>
      stopped
        ? Promise.reject(new Deno.errors.NotFound(path))
        : Promise.resolve(`1 (dotnet) S ${'0 '.repeat(18)}running-start`),
  };
  const registry = emptyRunResources(root);
  const report = buildLeakReport(
    [{
      kind: 'apphost',
      appHostPath: `${root}/apphost.mts`,
      appHostPid: 1,
      appHostStartedAt: 'running-start',
    }],
    registry,
    root,
  );
  const result = await runTeardown(report, registry, true, commands, files, {
    forcePersistent: true,
    processProbe: () => Promise.resolve([]),
  });
  assertEquals(result.stoppedAppHosts, [`${root}/apphost.mts`]);
  assertEquals(result.actionsRequired, []);
  assertEquals(result.escalated, []);
});

Deno.test('force-stop accepts a persistent container only after a positive gone census', async () => {
  let stopped = false;
  const called: string[][] = [];
  const commands: CommandPort = {
    run(command) {
      called.push([...command]);
      if (command[0] === 'aspire') stopped = true;
      if (command[0] === 'docker' && command[1] === 'inspect') {
        return Promise.resolve({ code: 1, stdout: '', stderr: 'No such container' });
      }
      return Promise.resolve({ code: 0, stdout: '', stderr: '' });
    },
  };
  const files: FilePort = {
    realPath: (path) => Promise.resolve(path),
    readText: (path) =>
      stopped
        ? Promise.reject(new Deno.errors.NotFound(path))
        : Promise.resolve(`1 (dotnet) S ${'0 '.repeat(18)}running-start`),
  };
  const registry = emptyRunResources(root);
  const report = buildLeakReport(
    [
      {
        kind: 'apphost',
        appHostPath: `${root}/apphost.mts`,
        appHostPid: 1,
        appHostStartedAt: 'running-start',
      },
      { kind: 'container', id: 'persistent-id', mountSource: `${root}/.data` },
    ],
    registry,
    root,
  );
  const result = await runTeardown(report, registry, true, commands, files, {
    forcePersistent: true,
    processProbe: () => Promise.resolve([]),
  });
  assertEquals(result.stoppedAppHosts, [`${root}/apphost.mts`]);
  assertEquals(result.removedContainers, ['persistent-id']);
  assertEquals(result.escalated, []);
  assertEquals(called, [
    [
      'aspire',
      'stop',
      '--force',
      '--apphost',
      `${root}/apphost.mts`,
      '--non-interactive',
      '--nologo',
    ],
    ['docker', 'inspect', 'persistent-id'],
    ['docker', 'ps', '-a', '--filter', 'id=persistent-id', '--format', '{{.ID}}'],
  ]);
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
      plannedCommands: [],
      stoppedAppHosts: [],
      terminatedProcesses: [],
      removedContainers: [],
      actionsRequired: [],
      escalated: [escalated],
      atRiskNetworks: [],
    }),
    4,
  );
  assertEquals(
    teardownExitCode({
      applied: false,
      plannedCommands: [],
      stoppedAppHosts: [],
      terminatedProcesses: [],
      removedContainers: [],
      actionsRequired: [],
      escalated: [escalated],
      atRiskNetworks: [],
    }),
    0,
  );
});

Deno.test('apply stops each AppHost by path and re-verifies a single container id', async () => {
  const called: string[][] = [];
  const registry = emptyRunResources(root);
  const resources: ResourceCandidate[] = [
    { kind: 'apphost', appHostPath: `${root}/apphost.mts`, appHostPid: 1 },
    {
      kind: 'container',
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
    { processProbe: () => Promise.resolve([]) },
  );
  assertEquals(result.stoppedAppHosts, [`${root}/apphost.mts`]);
  assertEquals(result.removedContainers, ['owned-id']);
  assertEquals(called, [
    ['aspire', 'stop', '--apphost', `${root}/apphost.mts`, '--non-interactive', '--nologo'],
    ['docker', 'inspect', 'owned-id'],
    // `-v` removes the container's anonymous volumes (issue #1855: `docker rm -f` left them behind).
    // Docker itself defines which volumes are anonymous, and named volumes survive.
    ['docker', 'rm', '-f', '-v', 'owned-id'],
    // Removal counts only after a positive gone census, not on the remove command's exit code.
    ['docker', 'ps', '-a', '--filter', 'id=owned-id', '--format', '{{.ID}}'],
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
  const result = await runTeardown(report, registry, true, commands, files, {
    processProbe: () => Promise.resolve([]),
  });
  assertEquals(result.removedContainers, ['owned-id']);
  assertEquals(result.atRiskNetworks.length, 1);
  assertEquals(result.atRiskNetworks[0].resource.kind, 'network');
  // Only `aspire stop`, the container re-inspect/removal, and the read-only gone census may run:
  // no network rm, no volume rm.
  assertEquals(called, [
    ['aspire', 'stop', '--apphost', `${root}/apphost.mts`, '--non-interactive', '--nologo'],
    ['docker', 'inspect', 'owned-id'],
    ['docker', 'rm', '-f', '-v', 'owned-id'],
    ['docker', 'ps', '-a', '--filter', 'id=owned-id', '--format', '{{.ID}}'],
  ]);
});

Deno.test('a zero exit from aspire stop is not accepted while the process survives', async () => {
  const registry = emptyRunResources(root);
  const resource: AppHostCandidate = {
    kind: 'apphost',
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
      processProbe: () => Promise.resolve([]),
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
  const resource: AppHostCandidate = {
    kind: 'apphost',
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
    { processProbe: () => Promise.resolve([]), sleep: () => Promise.resolve() },
  );
  assertEquals(result.stoppedAppHosts, [`${root}/apphost.mts`]);
  assertEquals(result.escalated, []);
});

Deno.test('changed labels abandon removal and escalate', async () => {
  const registry = emptyRunResources(root);
  const resource: ContainerCandidate = {
    kind: 'container',
    id: 'changed',
    mountSource: `${root}/.data`,
  };
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
    { processProbe: () => Promise.resolve([]) },
  );
  assertEquals(result.removedContainers, []);
  assertEquals(result.escalated.length, 1);
});

Deno.test('container remove exit zero is not clean while the container remains visible', async () => {
  const registry = emptyRunResources(root);
  const resource: ContainerCandidate = {
    kind: 'container',
    id: 'still-running',
    creatorPid: 2,
    creatorProcessStartTime: 'start',
    mountSource: `${root}/.data`,
  };
  const commands: CommandPort = {
    run(command) {
      if (command[0] === 'docker' && command[1] === 'inspect') {
        return Promise.resolve({
          code: 0,
          stdout: JSON.stringify([{
            Id: resource.id,
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
      if (command[0] === 'docker' && command[1] === 'ps') {
        return Promise.resolve({ code: 0, stdout: `${resource.id}\n`, stderr: '' });
      }
      return Promise.resolve({ code: 0, stdout: '', stderr: '' });
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
    {
      confirmAttempts: 2,
      confirmIntervalMs: 1,
      processProbe: () => Promise.resolve([]),
      sleep: () => Promise.resolve(),
    },
  );
  assertEquals(result.removedContainers, []);
  assertEquals(result.escalated.length, 1);
});

Deno.test('post-stop confirmation waits for the associated DCP helper to exit', async () => {
  const called: string[][] = [];
  const commands: CommandPort = {
    run(command) {
      called.push([...command]);
      return Promise.resolve({ code: 0, stdout: '', stderr: '' });
    },
  };
  const files: FilePort = {
    realPath: (path) => Promise.resolve(path),
    readText: (path) => Promise.reject(new Deno.errors.NotFound(path)),
  };
  const appHostPath = `${root}/workspace/aspire/apphost.mts`;
  const helper: ProcessCandidate = {
    kind: 'process',
    pid: 81,
    ppid: 1,
    processStartedAt: 'helper-start',
    commandLine: 'aspire-managed dcp backchannel',
    evidence: [{ kind: 'apphost-argv', path: appHostPath }],
  };
  let probe = 0;
  const slept: number[] = [];
  const registry = emptyRunResources(root);
  const report = buildLeakReport(
    [{ kind: 'apphost', appHostPath, appHostPid: 80, appHostStartedAt: 'apphost-start' }],
    registry,
    root,
  );
  const result = await runTeardown(report, registry, true, commands, files, {
    confirmAttempts: 4,
    confirmIntervalMs: 500,
    processProbe: () => Promise.resolve(probe++ < 2 ? [helper] : []),
    sleep: (ms) => {
      slept.push(ms);
      return Promise.resolve();
    },
  });
  assertEquals(result.stoppedAppHosts, [appHostPath]);
  assertEquals(result.escalated, []);
  assertEquals(slept, [500, 500]);
  assertEquals(called, [
    ['aspire', 'stop', '--apphost', appHostPath, '--non-interactive', '--nologo'],
  ]);
});

Deno.test('a DCP helper that never exits is escalated and never killed', async () => {
  const called: string[][] = [];
  const commands: CommandPort = {
    run(command) {
      called.push([...command]);
      return Promise.resolve({ code: 0, stdout: '', stderr: '' });
    },
  };
  const files: FilePort = {
    realPath: (path) => Promise.resolve(path),
    readText: (path) => Promise.reject(new Deno.errors.NotFound(path)),
  };
  const appHostPath = `${root}/workspace/aspire/apphost.mts`;
  const helper: ProcessCandidate = {
    kind: 'process',
    pid: 82,
    ppid: 1,
    processStartedAt: 'helper-start',
    commandLine: 'aspire-managed dcp backchannel',
    evidence: [{ kind: 'socket-path', path: `${root}/workspace/.aspire/dcp.sock` }],
  };
  const registry = emptyRunResources(root);
  const report = buildLeakReport(
    [{ kind: 'apphost', appHostPath, appHostPid: 80, appHostStartedAt: 'apphost-start' }],
    registry,
    root,
  );
  const result = await runTeardown(report, registry, true, commands, files, {
    confirmAttempts: 3,
    confirmIntervalMs: 500,
    processProbe: () => Promise.resolve([helper]),
    sleep: () => Promise.resolve(),
  });
  assertEquals(result.stoppedAppHosts, []);
  assertEquals(result.terminatedProcesses, []);
  assertEquals(result.escalated.length, 1);
  assertEquals(called, [
    ['aspire', 'stop', '--apphost', appHostPath, '--non-interactive', '--nologo'],
  ]);
});

Deno.test('old owned orphan is terminated by stable pid identity, young orphan is escalated', async () => {
  const oldProcess: ProcessCandidate = {
    kind: 'process',
    pid: 83,
    ppid: 1,
    processStartedAt: 'old-start',
    observedAgeMs: 40_000,
    commandLine: 'aspire-managed nuget search',
    evidence: [{ kind: 'dcp-label', path: `${root}/workspace/aspire/apphost.mts` }],
  };
  const youngProcess: ProcessCandidate = {
    kind: 'process',
    pid: 84,
    ppid: 1,
    processStartedAt: 'young-start',
    observedAgeMs: 2_000,
    commandLine: 'aspire-managed nuget search',
    evidence: [{ kind: 'dcp-label', path: `${root}/other/aspire/apphost.mts` }],
  };
  let terminated = false;
  const called: string[][] = [];
  const commands: CommandPort = {
    run(command) {
      called.push([...command]);
      if (command[0] === 'kill') terminated = true;
      return Promise.resolve({ code: 0, stdout: '', stderr: '' });
    },
  };
  const files: FilePort = {
    realPath: (path) => Promise.resolve(path),
    readText(path) {
      if (path === '/proc/83/stat' && !terminated) {
        return Promise.resolve(`83 (aspire-managed) S 1 ${'0 '.repeat(17)}old-start`);
      }
      return Promise.reject(new Deno.errors.NotFound(path));
    },
  };
  const registry = emptyRunResources(root);
  const report = buildLeakReport([oldProcess, youngProcess], registry, root);
  const result = await runTeardown(report, registry, true, commands, files, {
    sleep: () => Promise.resolve(),
  });
  assertEquals(result.plannedCommands, [['kill', '-TERM', '83']]);
  assertEquals(result.terminatedProcesses, [83]);
  assertEquals(result.escalated.map((entry) => entry.resource.kind), ['process']);
  assertEquals(called, [['kill', '-TERM', '83']]);
});

Deno.test('orphan process cleanup fails closed when the AppHost census failed', async () => {
  const process: ProcessCandidate = {
    kind: 'process',
    pid: 85,
    ppid: 1,
    processStartedAt: 'old-start',
    observedAgeMs: 40_000,
    commandLine: 'aspire-managed nuget search',
    evidence: [{ kind: 'dcp-label', path: `${root}/workspace/aspire/apphost.mts` }],
  };
  const registry = emptyRunResources(root);
  const report = buildLeakReport(
    [process],
    registry,
    root,
    Date.now(),
    1,
    {
      aspire: { state: 'failed', message: 'census failed' },
      docker: { state: 'ok' },
      volumes: { state: 'ok' },
      networks: { state: 'ok' },
      process: { state: 'ok' },
    },
  );
  const called: string[][] = [];
  const commands: CommandPort = {
    run(command) {
      called.push([...command]);
      return Promise.resolve({ code: 0, stdout: '', stderr: '' });
    },
  };
  const result = await runTeardown(report, registry, true, commands);
  assertEquals(result.plannedCommands, []);
  assertEquals(result.terminatedProcesses, []);
  assertEquals(result.escalated.length, 1);
  assertEquals(called, []);
});
