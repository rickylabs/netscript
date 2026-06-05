import { assertEquals } from '@std/assert';
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
import type { Reporter } from '../../../src/ports/reporter.ts';
import { createSuiteRunner } from '../../../src/application/runner/suite-runner.ts';
import { GATE } from '../../../src/domain/cli-surface.ts';
import { createScaffoldPluginsSuite } from '../../../suites/scaffold/capability-suites.ts';

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
  const suite = createScaffoldPluginsSuite({
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
  }).run(suite, { suiteId: suite.id, options });

  assertEquals(report.ok, false);
  assertEquals(commands[0].command, ['deno', '--version']);
  assertEquals(cleaner.removed, ['suite-c']);
});

Deno.test('suite runner skips cleanup phase when cleanup is disabled', async () => {
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
  const suite = createScaffoldPluginsSuite({
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
  }).run(suite, { suiteId: suite.id, options });

  assertEquals(report.ok, true);
  assertEquals(cleaner.snapshots, 0);
  assertEquals(commands.some((request) => request.command.includes('stop')), false);
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
  const suite = createScaffoldPluginsSuite({
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
  const suite = createScaffoldPluginsSuite({
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
  }).run(suite, { suiteId: suite.id, gateId: GATE.CLEANUP_ASPIRE_STOP, options });

  assertEquals(cleaner.snapshots, 0);
  assertEquals(commands.length, 1);
  assertEquals(commands[0].command.includes('stop'), true);
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

class NullReporter implements Reporter {
  emit(): Promise<void> {
    return Promise.resolve();
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
