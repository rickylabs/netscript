import { assertEquals, assertStringIncludes } from '@std/assert';
import type { ProcessPort, ProcessResult } from '../../ports/process-port.ts';
import { DockerCliTopologyInspector } from './docker-topology-inspector.ts';
import {
  ASPIRE_CONTAINERS_INSPECT_JSON,
  LOCAL_CONTEXT_JSON,
  REMOTE_CONTEXT_JSON,
} from './docker-topology-fixtures_test.ts';

Deno.test('DOCKER_HOST takes precedence over the active context', async () => {
  const process = new RecordingProcess([]);
  const endpoint = await new DockerCliTopologyInspector(process, {
    readEnv: (name) => name === 'DOCKER_HOST' ? 'tcp://10.0.0.5:2376' : undefined,
  }).inspectEndpoint();
  assertEquals(endpoint.locality, 'remote');
  assertEquals(endpoint.source, 'DOCKER_HOST');
  assertEquals(process.commands, []);
});

Deno.test('the active context endpoint is classified from recorded context JSON', async () => {
  const remote = await inspectorFor([ok(REMOTE_CONTEXT_JSON)]).inspectEndpoint();
  assertEquals(remote, {
    locality: 'remote',
    host: 'ssh://ops@daemon-host.example',
    source: 'docker-context',
    daemonHost: 'daemon-host.example',
  });
  const local = await inspectorFor([ok(LOCAL_CONTEXT_JSON)]).inspectEndpoint();
  assertEquals(local.locality, 'local');
});

Deno.test('an empty DOCKER_HOST falls back to the context', async () => {
  const process = new RecordingProcess([ok(LOCAL_CONTEXT_JSON)]);
  const endpoint = await new DockerCliTopologyInspector(process, { readEnv: () => '  ' })
    .inspectEndpoint();
  assertEquals(endpoint.locality, 'local');
  assertEquals(process.commands.map((command) => command.args), [['context', 'inspect']]);
});

Deno.test('a missing, failing or garbled Docker CLI yields an unknown endpoint', async () => {
  const missing = await new DockerCliTopologyInspector(new MissingProcess(), {
    readEnv: () => undefined,
  }).inspectEndpoint();
  assertEquals(missing.locality, 'unknown');
  assertStringIncludes(missing.reason ?? '', 'Docker CLI was not found');

  const failing = await inspectorFor([{ code: 1, stdout: '', stderr: 'context not found' }])
    .inspectEndpoint();
  assertEquals(failing.locality, 'unknown');
  assertStringIncludes(failing.reason ?? '', 'context not found');

  const garbled = await inspectorFor([ok('not json')]).inspectEndpoint();
  assertEquals(garbled.locality, 'unknown');
  assertStringIncludes(garbled.reason ?? '', 'unreadable JSON');
});

Deno.test("published bindings are read only for the AppHost's Aspire containers", async () => {
  const process = new RecordingProcess([
    ok('3f1c0e9a\n9b2d7c41\n'),
    ok(ASPIRE_CONTAINERS_INSPECT_JSON),
  ]);
  const observation = await new DockerCliTopologyInspector(process, { readEnv: () => undefined })
    .inspectPublishedBindings(['api', 'main-db']);
  assertEquals(observation, {
    status: 'observed',
    bindings: [{
      container: 'main-db-xkcdabcd',
      containerPort: '5432/tcp',
      hostIp: '127.0.0.1',
      hostPort: '55001',
    }],
  });
  assertEquals(process.commands.map((command) => command.args), [
    [
      'ps',
      '--filter',
      'label=com.microsoft.developer.usvc-dev.creatorProcessId',
      '--format',
      '{{.ID}}',
    ],
    ['inspect', '3f1c0e9a', '9b2d7c41'],
  ]);
});

Deno.test('no Aspire containers means no bindings without a second Docker call', async () => {
  const process = new RecordingProcess([ok('\n')]);
  const observation = await new DockerCliTopologyInspector(process).inspectPublishedBindings([
    'main-db',
  ]);
  assertEquals(observation, { status: 'observed', bindings: [] });
  assertEquals(process.commands.length, 1);
});

Deno.test('a timed-out daemon call makes bindings unavailable rather than empty', async () => {
  const observation = await inspectorFor([{ code: 124, stdout: '', stderr: '', timedOut: true }])
    .inspectPublishedBindings(['main-db']);
  assertEquals(observation.status, 'unavailable');
  if (observation.status === 'unavailable') {
    assertStringIncludes(observation.reason, 'docker ps timed out');
  }
});

function inspectorFor(results: readonly ProcessResult[]): DockerCliTopologyInspector {
  return new DockerCliTopologyInspector(new RecordingProcess(results), {
    readEnv: () => undefined,
  });
}

function ok(stdout: string): ProcessResult {
  return { code: 0, stdout, stderr: '' };
}

class RecordingProcess implements ProcessPort {
  readonly commands: { command: string; args: readonly string[] }[] = [];
  constructor(private readonly results: readonly ProcessResult[]) {}

  exec(command: string, args: readonly string[]): Promise<ProcessResult> {
    this.commands.push({ command, args });
    const result = this.results[this.commands.length - 1];
    if (!result) throw new Error('No process result configured.');
    return Promise.resolve(result);
  }
}

class MissingProcess implements ProcessPort {
  exec(): Promise<ProcessResult> {
    return Promise.reject(new Deno.errors.NotFound('docker command not found'));
  }
}
