import { assertEquals, assertRejects } from '@std/assert';
import type { Clock } from '../../../src/ports/clock.ts';
import type {
  CommandExecutor,
  CommandRequest,
  CommandResult,
} from '../../../src/ports/command-executor.ts';
import type {
  DockerResourceCleaner,
  DockerResourceSnapshot,
} from '../../../src/ports/docker-resource-cleaner.ts';
import type { HttpClient, HttpRequest, HttpResult } from '../../../src/ports/http-client.ts';
import type { Reporter, ReportEvent } from '../../../src/ports/reporter.ts';
import type { PlatformPort } from '../../../src/ports/platform.ts';
import { createSuiteRunner } from '../../../src/application/runner/suite-runner.ts';
import { DockerCliResourceCleaner } from '../../../src/adapters/commands/docker-resource-cleaner.ts';
import {
  type SuiteLease,
  SuiteLeaseContentionError,
  type SuiteLeaseManager,
  type SuiteLeaseRecord,
} from '../../../src/application/runner/suite-lease.ts';
import { GATE, SCAFFOLD } from '../../../src/domain/cli-surface.ts';
import type { ExpensiveRuntimeSuiteId, SuiteId } from '../../../src/domain/cli-surface.ts';
import type { RunOptions } from '../../../src/domain/run-context.ts';
import {
  createScaffoldCapabilitySuite,
  SCAFFOLD_RUNTIME_DEFERRED_GATES,
  scaffoldCapabilitySuites,
} from '../../../suites/scaffold/capability-suites.ts';

Deno.test('suite runner reports every #1398 deferral as an explicit skipped step', async () => {
  const runtime = createScaffoldRuntimeSuite({
    repoRoot: '.',
    projectName: 'runner-deferral-test',
    cleanup: false,
    format: 'pretty',
  });
  const suite = { ...runtime, gates: [] };
  const reporter = new RecordingReporter();
  const report = await createSuiteRunner({
    clock: new FakeClock(),
    commandExecutor: new SuccessfulCommandExecutor(),
    httpClient: new FakeHttpClient(),
    reporter,
    platform: new FakePlatform(),
    suiteLeaseManager: new RecordingSuiteLeaseManager(),
  }).run(suite, { suiteId: suite.id, options: suite.defaultOptions });

  assertEquals(report.steps.map((step) => step.id), [
    GATE.BEHAVIOR_OTEL_STREAM_CONSUMER,
    GATE.BEHAVIOR_OTEL_TRACES,
  ]);
  assertEquals(report.steps.every((step) => step.verdict === 'skipped' && !step.critical), true);
  assertEquals(report.summary, { passed: 0, failed: 0, skipped: 2 });
  assertEquals(
    report.steps.map((step) => step.evidence[0]),
    SCAFFOLD_RUNTIME_DEFERRED_GATES.map((deferred) => ({
      kind: 'summary' as const,
      label: 'owned suite deferral',
      data: {
        status: 'deferred',
        issue: deferred.issue,
        reason: deferred.reason,
      },
    })),
  );
  assertEquals(
    reporter.events
      .filter((event) => event.type === 'gate-start')
      .map((event) => event.title.startsWith('DEFERRED #1398:')),
    [true, true],
  );
});

Deno.test('suite runner emits a failed report and prunes only created Docker resources', async () => {
  const commands: CommandRequest[] = [];
  const executor: CommandExecutor = {
    run(request): Promise<CommandResult> {
      commands.push(request);
      return Promise.resolve({
        command: request.command,
        cwd: request.cwd,
        code: request.command.includes('--version') ? 0 : 1,
        stdout: '',
        stderr: 'planned failure',
        timedOut: false,
      });
    },
  };
  const cleaner = new FakeDockerCleaner(['master-a', 'master-b'], [
    'master-a',
    'master-b',
    'suite-c',
  ]);
  const suite = createScaffoldRuntimeSuite({
    repoRoot: '.',
    projectName: 'runner-test',
    cleanup: true,
    format: 'json',
  });
  const options = { ...suite.defaultOptions, cleanup: true };
  const report = await createSuiteRunner({
    clock: new FakeClock(),
    commandExecutor: executor,
    httpClient: new FakeHttpClient(),
    dockerCleaner: cleaner,
    reporter: new NullReporter(),
    platform: new FakePlatform(),
    suiteLeaseManager: new RecordingSuiteLeaseManager(),
  }).run(suite, { suiteId: suite.id, options });

  assertEquals(report.ok, false);
  assertEquals(commands[0].command, ['deno', '--version']);
  assertEquals(cleaner.removed, ['suite-c']);
});

Deno.test('suite runner skips cleanup phase when cleanup is disabled', async () => {
  const commands: CommandRequest[] = [];
  let pluginDoctorRuns = 0;
  const executor: CommandExecutor = {
    run(request): Promise<CommandResult> {
      commands.push(request);
      const isPluginDoctor = request.command.includes('plugin') &&
        request.command.includes('doctor');
      if (isPluginDoctor) pluginDoctorRuns++;
      const isUnhealthyPluginDoctor = isPluginDoctor && pluginDoctorRuns === 1;
      return Promise.resolve({
        command: request.command,
        cwd: request.cwd,
        code: isUnhealthyPluginDoctor ? 1 : 0,
        stdout: isUnhealthyPluginDoctor
          ? [
            '.netscript/generated/plugin-workers/job-registry.ts',
            '.netscript/generated/plugin-sagas/sagas.registry.ts',
            'deno run -A jsr:@netscript/plugin-workers@',
            'deno run -A jsr:@netscript/plugin-sagas@',
          ].join('\n')
          : '',
        stderr: '',
        timedOut: false,
      });
    },
  };
  const cleaner = new FakeDockerCleaner(['master-a'], ['master-a']);
  const suite = createScaffoldRuntimeSuite({
    repoRoot: '.',
    projectName: 'runner-no-cleanup-test',
    cleanup: false,
    format: 'json',
  });
  const options = { ...suite.defaultOptions, cleanup: false };
  const report = await createSuiteRunner({
    clock: new FakeClock(),
    commandExecutor: executor,
    httpClient: new FakeHttpClient(),
    dockerCleaner: cleaner,
    reporter: new NullReporter(),
    platform: new FakePlatform(),
    suiteLeaseManager: new RecordingSuiteLeaseManager(),
  }).run(suite, { suiteId: suite.id, options });

  assertEquals(report.ok, true);
  assertEquals(cleaner.snapshots, 0);
  assertEquals(commands.some((request) => request.command.includes('stop')), false);
});

Deno.test('suite runner completes cleanup with a Docker-less cleaner', async () => {
  const warnings: string[] = [];
  const cleaner = new DockerCliResourceCleaner(
    () => Promise.reject(new Deno.errors.NotFound('docker')),
    (warning) => {
      warnings.push(warning);
      return Promise.resolve();
    },
  );
  const runtimeSuite = createScaffoldRuntimeSuite({
    repoRoot: '.',
    projectName: 'runner-docker-less-cleanup-test',
    cleanup: true,
    format: 'json',
  });
  const suite = { ...runtimeSuite, gates: [], deferredGates: [] };
  const options = { ...suite.defaultOptions, cleanup: true };

  const report = await createSuiteRunner({
    clock: new FakeClock(),
    commandExecutor: new SuccessfulCommandExecutor(),
    httpClient: new FakeHttpClient(),
    dockerCleaner: cleaner,
    reporter: new NullReporter(),
    platform: new FakePlatform(),
    suiteLeaseManager: new RecordingSuiteLeaseManager(),
  }).run(suite, { suiteId: suite.id, options });

  assertEquals(report.ok, true);
  assertEquals(report.steps, []);
  assertEquals(warnings.length, 2);
});

Deno.test('suite runner cleans up after a targeted non-cleanup gate when cleanup is enabled', async () => {
  const commands: CommandRequest[] = [];
  const executor: CommandExecutor = {
    run(request): Promise<CommandResult> {
      commands.push(request);
      return Promise.resolve({
        command: request.command,
        cwd: request.cwd,
        code: 0,
        stdout: '',
        stderr: '',
        timedOut: false,
      });
    },
  };
  const cleaner = new FakeDockerCleaner(['master-a'], ['master-a']);
  const suite = createScaffoldRuntimeSuite({
    repoRoot: '.',
    projectName: 'runner-target-cleanup-test',
    cleanup: true,
    format: 'json',
  });
  const options = { ...suite.defaultOptions, cleanup: true };

  await createSuiteRunner({
    clock: new FakeClock(),
    commandExecutor: executor,
    httpClient: new FakeHttpClient(),
    dockerCleaner: cleaner,
    reporter: new NullReporter(),
    platform: new FakePlatform(),
    suiteLeaseManager: new RecordingSuiteLeaseManager(),
  }).run(suite, { suiteId: suite.id, gateId: GATE.SCAFFOLD_INIT, options });

  assertEquals(cleaner.snapshots, 1);
  assertEquals(commands.some((request) => request.command.includes('init')), true);
  assertEquals(commands.some((request) => request.command.includes('stop')), true);
});

Deno.test('suite runner can target cleanup gate without suite cleanup enabled', async () => {
  const commands: CommandRequest[] = [];
  const executor: CommandExecutor = {
    run(request): Promise<CommandResult> {
      commands.push(request);
      return Promise.resolve({
        command: request.command,
        cwd: request.cwd,
        code: 0,
        stdout: '',
        stderr: '',
        timedOut: false,
      });
    },
  };
  const cleaner = new FakeDockerCleaner(['master-a'], ['master-a']);
  const suite = createScaffoldRuntimeSuite({
    repoRoot: '.',
    projectName: 'runner-target-explicit-cleanup-test',
    cleanup: false,
    format: 'json',
  });
  const options = { ...suite.defaultOptions, cleanup: false };

  await createSuiteRunner({
    clock: new FakeClock(),
    commandExecutor: executor,
    httpClient: new FakeHttpClient(),
    dockerCleaner: cleaner,
    reporter: new NullReporter(),
    platform: new FakePlatform(),
    suiteLeaseManager: new RecordingSuiteLeaseManager(),
  }).run(suite, { suiteId: suite.id, gateId: GATE.CLEANUP_ASPIRE_STOP, options });

  assertEquals(cleaner.snapshots, 0);
  assertEquals(commands.length, 1);
  assertEquals(commands[0].command.includes('stop'), true);
});

Deno.test('suite runner releases the expensive-suite lease when suite execution throws', async () => {
  const leaseManager = new RecordingSuiteLeaseManager();
  const suite = createScaffoldRuntimeSuite({ repoRoot: '.', format: 'json' });
  const runner = createSuiteRunner({
    clock: new FakeClock(),
    commandExecutor: new SuccessfulCommandExecutor(),
    httpClient: new FakeHttpClient(),
    reporter: new ThrowingReporter(),
    platform: new FakePlatform(),
    suiteLeaseManager: leaseManager,
  });

  await assertRejects(
    () => runner.run(suite, { suiteId: suite.id, options: suite.defaultOptions }),
    Error,
    'planned suite failure',
  );
  assertEquals(leaseManager.releases, 1);

  const nextLease = await leaseManager.acquire(suite.id, '.');
  assertEquals(leaseManager.acquisitions, 2);
  await nextLease.release();
});

Deno.test('expensive runtime suites contend for one lease in both directions', async () => {
  const cases = [
    [SCAFFOLD.RUNTIME, SCAFFOLD.RUNTIME_SQLITE],
    [SCAFFOLD.RUNTIME_SQLITE, SCAFFOLD.RUNTIME],
  ] as const;

  for (const [holderId, contenderId] of cases) {
    const leaseManager = new RecordingSuiteLeaseManager();
    const heldLease = await leaseManager.acquire(holderId, '/worktrees/holder');
    const suite = createScaffoldRuntimeSuite(
      { repoRoot: '/worktrees/contender', format: 'json' },
      contenderId,
    );
    const runner = createSuiteRunner({
      clock: new FakeClock(),
      commandExecutor: new SuccessfulCommandExecutor(),
      httpClient: new FakeHttpClient(),
      reporter: new NullReporter(),
      platform: new FakePlatform(),
      suiteLeaseManager: leaseManager,
    });

    try {
      const error = await assertRejects(
        () => runner.run(suite, { suiteId: suite.id, options: suite.defaultOptions }),
        SuiteLeaseContentionError,
      );
      assertEquals(error.holder.suiteId, holderId);
    } finally {
      await heldLease.release();
    }
  }
});

Deno.test('suite runner does not interact with the lease for a cheap suite', async () => {
  const leaseManager = new RecordingSuiteLeaseManager();
  const capability = scaffoldCapabilitySuites.find((suite) => suite.id === SCAFFOLD.SERVICE);
  if (!capability) throw new Error('scaffold.service suite is not registered.');
  const suite = createScaffoldCapabilitySuite(capability, { repoRoot: '.', format: 'json' });

  await createSuiteRunner({
    clock: new FakeClock(),
    commandExecutor: new SuccessfulCommandExecutor(),
    httpClient: new FakeHttpClient(),
    reporter: new NullReporter(),
    platform: new FakePlatform(),
    suiteLeaseManager: leaseManager,
  }).run(suite, { suiteId: suite.id, options: suite.defaultOptions });

  assertEquals(leaseManager.acquisitions, 0);
});

class FakeClock implements Clock {
  #time = 0;
  now(): Date {
    return new Date('2026-04-29T00:00:00.000Z');
  }
  monotonicMs(): number {
    this.#time += 1;
    return this.#time;
  }
}

class FakePlatform implements PlatformPort {
  current(): 'linux' {
    return 'linux';
  }
}

function createScaffoldRuntimeSuite(
  overrides: Partial<RunOptions>,
  suiteId: ExpensiveRuntimeSuiteId = SCAFFOLD.RUNTIME,
) {
  const capability = scaffoldCapabilitySuites.find((suite) => suite.id === suiteId);
  if (!capability) throw new Error(`${suiteId} suite is not registered.`);
  return createScaffoldCapabilitySuite(capability, overrides);
}

class NullReporter implements Reporter {
  emit(): Promise<void> {
    return Promise.resolve();
  }
}

class RecordingReporter implements Reporter {
  readonly events: ReportEvent[] = [];
  emit(event: ReportEvent): Promise<void> {
    this.events.push(event);
    return Promise.resolve();
  }
}

class ThrowingReporter implements Reporter {
  emit(): Promise<void> {
    return Promise.reject(new Error('planned suite failure'));
  }
}

class SuccessfulCommandExecutor implements CommandExecutor {
  run(request: CommandRequest): Promise<CommandResult> {
    return Promise.resolve({
      command: request.command,
      cwd: request.cwd,
      code: 0,
      stdout: '',
      stderr: '',
      timedOut: false,
    });
  }
}

class RecordingSuiteLeaseManager implements SuiteLeaseManager {
  acquisitions = 0;
  releases = 0;
  #holder: SuiteLeaseRecord | undefined;

  acquire(suiteId: SuiteId, worktree: string): Promise<SuiteLease> {
    if (this.#holder) {
      return Promise.reject(
        new SuiteLeaseContentionError(this.#holder, '/tmp/netscript-e2e-runner-test.lease'),
      );
    }
    this.#holder = {
      pid: 4242,
      startedAt: '2026-08-04T00:00:00.000Z',
      suiteId,
      worktree,
    };
    this.acquisitions += 1;
    return Promise.resolve({
      release: () => {
        this.#holder = undefined;
        this.releases += 1;
        return Promise.resolve();
      },
    });
  }
}

class FakeHttpClient implements HttpClient {
  requests: HttpRequest[] = [];
  request(request: HttpRequest): Promise<HttpResult> {
    this.requests.push(request);
    return Promise.resolve({ status: 200, ok: true, bodyPreview: '' });
  }
}

class FakeDockerCleaner implements DockerResourceCleaner {
  removed: string[] = [];
  snapshots = 0;
  constructor(private readonly before: string[], private readonly after: string[]) {}
  captureSnapshot(): Promise<DockerResourceSnapshot> {
    this.snapshots += 1;
    return Promise.resolve({ containerIds: this.before });
  }
  pruneCreatedResources(snapshot: DockerResourceSnapshot): Promise<readonly string[]> {
    const prior = new Set(snapshot.containerIds);
    this.removed = this.after.filter((id) => !prior.has(id));
    return Promise.resolve(this.removed);
  }
}
