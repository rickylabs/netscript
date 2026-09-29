import { assertEquals } from '@std/assert';
import { buildLeakReport } from './leak-check.ts';
import { classify, type ProcessCandidate } from './ownership.ts';
import type { CommandPort, FilePort } from './ports.ts';
import { probeProcesses } from './probes.ts';
import { emptyRunResources } from './run-resources.ts';
import { runTeardown } from './teardown.ts';

interface CapturedProcess {
  readonly role: string;
  readonly pid: number;
  readonly ppid: number;
  readonly startTimeTicks: string;
  readonly argv: readonly string[];
}

interface ReparentedProcess {
  readonly role: string;
  readonly pid: number;
  readonly ppid: number;
  readonly startTimeTicks: string;
}

interface PhaseBLiveFixture {
  readonly leasedRun: {
    readonly worktreeRoot: string;
    readonly ownedRoot: string;
    readonly appHostPath: string;
  };
  readonly foreignControl: {
    readonly appHostPath: string;
  };
  readonly baselineProcesses: readonly CapturedProcess[];
  readonly afterCliSigkill: readonly ReparentedProcess[];
  readonly derivedContainmentVectors: {
    readonly dcpLabelPath: string;
    readonly socketPath: string;
    readonly cwdPath: string;
    readonly foreignDcpLabelPath: string;
  };
}

const fixture = JSON.parse(
  await Deno.readTextFile(
    new URL('./__fixtures__/process-tree-13.5.3-phase-b-live.json', import.meta.url),
  ),
) as PhaseBLiveFixture;

function captured(role: string): CapturedProcess {
  const row = fixture.baselineProcesses.find((process) => process.role === role);
  if (!row) throw new Error(`missing captured process: ${role}`);
  return row;
}

function reparented(role: string): ReparentedProcess {
  const row = fixture.afterCliSigkill.find((process) => process.role === role);
  if (!row) throw new Error(`missing re-parented process: ${role}`);
  return row;
}

Deno.test('Phase-B live snapshot classifies only leased descendants as owned and plans targeted TERM', async () => {
  const leasedServerBeforeKill = captured('leased-run-apphost');
  const leasedServerAfterKill = reparented('leased-run-aspire-managed-server');
  const foreignServer = captured('foreign-control-apphost');
  const rows = [
    { ...leasedServerBeforeKill, ppid: leasedServerAfterKill.ppid, elapsedSeconds: 90 },
    { ...foreignServer, elapsedSeconds: 90 },
  ];
  const commands: CommandPort = {
    run: () =>
      Promise.resolve({
        code: 0,
        stdout: rows.map((row) =>
          `${row.pid}\t${row.ppid}\t${row.elapsedSeconds}\t${row.argv.join(' ')}`
        ).join('\n'),
        stderr: '',
      }),
  };
  const files: FilePort = {
    realPath(path) {
      if (path.startsWith('/proc/')) return Promise.reject(new Deno.errors.NotFound(path));
      return Promise.resolve(path);
    },
    readText(path) {
      const match = path.match(/^\/proc\/(\d+)\/(cmdline|stat|environ)$/);
      const row = match ? rows.find((candidate) => candidate.pid === Number(match[1])) : undefined;
      if (!row || !match) return Promise.reject(new Deno.errors.NotFound(path));
      if (match[2] === 'cmdline') return Promise.resolve(`${row.argv.join('\0')}\0`);
      if (match[2] === 'stat') {
        return Promise.resolve(
          `${row.pid} (aspire-managed) S ${row.ppid} ${'0 '.repeat(17)}${row.startTimeTicks}`,
        );
      }
      return Promise.resolve('');
    },
  };
  const probed = await probeProcesses(commands, files, 50);
  const leasedServer = probed.find((process) =>
    process.kind === 'process' && process.pid === leasedServerAfterKill.pid
  );
  const controlServer = probed.find((process) =>
    process.kind === 'process' && process.pid === foreignServer.pid
  );
  if (leasedServer?.kind !== 'process' || controlServer?.kind !== 'process') {
    throw new Error('captured managed-server rows were not probed');
  }
  assertEquals(leasedServer.evidence, [{
    kind: 'content-root-argv',
    path: leasedServerBeforeKill.argv[3],
  }]);
  assertEquals(controlServer.evidence, [{
    kind: 'content-root-argv',
    path: foreignServer.argv[3],
  }]);

  const dcpApi = reparented('leased-run-dcp-apiserver');
  const dcpControllers = reparented('leased-run-dcp-controllers');
  const dashboard = reparented('leased-run-aspire-managed-dashboard');
  const exactPathDescendants: ProcessCandidate[] = [
    leasedServer,
    {
      kind: 'process',
      ...dcpApi,
      processStartedAt: dcpApi.startTimeTicks,
      observedAgeMs: 90_000,
      commandLine: 'dcp start-apiserver',
      evidence: [{ kind: 'dcp-label', path: fixture.derivedContainmentVectors.dcpLabelPath }],
    },
    {
      kind: 'process',
      ...dcpControllers,
      processStartedAt: dcpControllers.startTimeTicks,
      observedAgeMs: 90_000,
      commandLine: 'dcp run-controllers',
      evidence: [{ kind: 'socket-path', path: fixture.derivedContainmentVectors.socketPath }],
    },
    {
      kind: 'process',
      ...dashboard,
      processStartedAt: dashboard.startTimeTicks,
      observedAgeMs: 90_000,
      commandLine: 'aspire-managed dashboard',
      cwd: fixture.derivedContainmentVectors.cwdPath,
      evidence: [{ kind: 'cwd-path', path: fixture.derivedContainmentVectors.cwdPath }],
    },
  ];
  const registry = {
    ...emptyRunResources(fixture.leasedRun.worktreeRoot),
    ownedRoots: [fixture.leasedRun.ownedRoot],
  };

  assertEquals(
    exactPathDescendants.map((process) =>
      classify(process, registry, fixture.leasedRun.worktreeRoot)
    ),
    ['owned', 'owned', 'owned', 'owned'],
  );
  assertEquals(
    classify(controlServer, registry, fixture.leasedRun.worktreeRoot),
    'foreign',
  );
  assertEquals(
    classify(
      {
        ...controlServer,
        evidence: [{
          kind: 'dcp-label',
          path: fixture.derivedContainmentVectors.foreignDcpLabelPath,
        }],
      },
      registry,
      fixture.leasedRun.worktreeRoot,
    ),
    'foreign',
  );

  const report = buildLeakReport(exactPathDescendants, registry, fixture.leasedRun.worktreeRoot);
  const teardown = await runTeardown(report, registry, false);
  assertEquals(
    teardown.plannedCommands,
    exactPathDescendants.map((process) => ['kill', '-TERM', String(process.pid)]),
  );
});

Deno.test('Phase-B apply mutates only old inactive path-proven descendants', async () => {
  const registry = {
    ...emptyRunResources(fixture.leasedRun.worktreeRoot),
    ownedRoots: [fixture.leasedRun.ownedRoot],
  };
  const detachedOwnedRoot = `${fixture.leasedRun.worktreeRoot}/.llm/tmp/detached-owned`;
  const oldContentRoot: ProcessCandidate = {
    kind: 'process',
    pid: 201,
    ppid: 1,
    processStartedAt: 'old-content-root',
    observedAgeMs: 90_000,
    commandLine: 'aspire-managed server',
    evidence: [{ kind: 'content-root-argv', path: `${detachedOwnedRoot}/aspire/.aspire` }],
  };
  const oldCwd: ProcessCandidate = {
    kind: 'process',
    pid: 202,
    ppid: 1,
    processStartedAt: 'old-cwd',
    observedAgeMs: 90_000,
    commandLine: 'aspire-managed dashboard',
    cwd: `${detachedOwnedRoot}/aspire/.aspire`,
    evidence: [{ kind: 'cwd-path', path: `${detachedOwnedRoot}/aspire/.aspire` }],
  };
  const foreign: ProcessCandidate = {
    kind: 'process',
    pid: 203,
    ppid: 1,
    processStartedAt: 'foreign',
    observedAgeMs: 90_000,
    commandLine: 'aspire-managed server',
    evidence: [{ kind: 'content-root-argv', path: fixture.foreignControl.appHostPath }],
  };
  const ppidOnly: ProcessCandidate = {
    kind: 'process',
    pid: 204,
    ppid: 1,
    processStartedAt: 'ppid-only',
    observedAgeMs: 90_000,
    commandLine: 'aspire-managed dashboard',
    evidence: [],
  };
  const youngOwned: ProcessCandidate = {
    kind: 'process',
    pid: 205,
    ppid: 1,
    processStartedAt: 'young-owned',
    observedAgeMs: 2_000,
    commandLine: 'aspire-managed dashboard',
    evidence: [{ kind: 'cwd-path', path: `${detachedOwnedRoot}/young` }],
  };
  const activeAppHost = {
    kind: 'apphost' as const,
    appHostPath: fixture.leasedRun.appHostPath,
    appHostPid: 206,
    appHostStartedAt: 'active-apphost',
  };
  const activeDescendant: ProcessCandidate = {
    kind: 'process',
    pid: 207,
    ppid: 1,
    processStartedAt: 'active-descendant',
    observedAgeMs: 90_000,
    commandLine: 'aspire-managed dashboard',
    evidence: [{ kind: 'cwd-path', path: `${fixture.leasedRun.ownedRoot}/aspire/.aspire` }],
  };
  const live = new Set([201, 202, 203, 204, 205, 207]);
  const called: string[][] = [];
  const commands: CommandPort = {
    run(command) {
      called.push([...command]);
      if (command[0] === 'kill') live.delete(Number(command[2]));
      return Promise.resolve({ code: 0, stdout: '', stderr: '' });
    },
  };
  const files: FilePort = {
    realPath: (path) => Promise.resolve(path),
    readText(path) {
      const match = path.match(/^\/proc\/(\d+)\/stat$/);
      const pid = match ? Number(match[1]) : undefined;
      if (pid === undefined || !live.has(pid)) {
        return Promise.reject(new Deno.errors.NotFound(path));
      }
      const starts = new Map([
        [201, 'old-content-root'],
        [202, 'old-cwd'],
        [203, 'foreign'],
        [204, 'ppid-only'],
        [205, 'young-owned'],
        [207, 'active-descendant'],
      ]);
      return Promise.resolve(`${pid} (aspire-managed) S 1 ${'0 '.repeat(17)}${starts.get(pid)}`);
    },
  };
  const report = buildLeakReport(
    [
      oldContentRoot,
      oldCwd,
      foreign,
      ppidOnly,
      youngOwned,
      activeAppHost,
      activeDescendant,
    ],
    registry,
    fixture.leasedRun.worktreeRoot,
  );
  const result = await runTeardown(report, registry, true, commands, files, {
    confirmAttempts: 2,
    confirmIntervalMs: 1,
    processProbe: () => Promise.resolve([]),
    sleep: () => Promise.resolve(),
  });

  assertEquals(result.stoppedAppHosts, [fixture.leasedRun.appHostPath]);
  assertEquals(result.terminatedProcesses, [201, 202]);
  assertEquals(result.escalated.map((entry) => entry.ownership), [
    'foreign',
    'unproven',
    'owned',
  ]);
  assertEquals(called, [
    [
      'aspire',
      'stop',
      '--apphost',
      fixture.leasedRun.appHostPath,
      '--non-interactive',
      '--nologo',
    ],
    ['kill', '-TERM', '201'],
    ['kill', '-TERM', '202'],
  ]);
});
