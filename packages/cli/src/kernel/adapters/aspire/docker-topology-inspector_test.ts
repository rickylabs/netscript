import { assertEquals, assertStringIncludes } from '@std/assert';
import type { DockerEndpoint } from '../../domain/docker-topology.ts';
import type { ProcessPort, ProcessResult } from '../../ports/process-port.ts';
import { DockerCliTopologyInspector, readPublishedBindings } from './docker-topology-inspector.ts';
import {
  ASPIRE_CONTAINERS_INSPECT_JSON,
  LOCAL_CONTEXT_JSON,
  OTHER_APPHOST_DB_INSTANCE,
  REMOTE_CONTEXT_JSON,
  THIS_APPHOST_DB_INSTANCE,
} from './docker-topology-fixtures_test.ts';

const LOCAL_SOCKET: DockerEndpoint = {
  locality: 'local',
  host: 'unix:///var/run/docker.sock',
  source: 'DOCKER_HOST',
};

Deno.test('DOCKER_HOST is used when DOCKER_CONTEXT is unset', async () => {
  const process = new RecordingProcess([]);
  const endpoint = await new DockerCliTopologyInspector(process, {
    readEnv: env({ DOCKER_HOST: 'tcp://10.0.0.5:2376' }),
  }).inspectEndpoint();
  assertEquals(endpoint.locality, 'remote');
  assertEquals(endpoint.source, 'DOCKER_HOST');
  assertEquals(process.commands, []);
});

Deno.test('DOCKER_CONTEXT overrides DOCKER_HOST, as in the Docker CLI', async () => {
  const process = new RecordingProcess([ok(REMOTE_CONTEXT_JSON)]);
  const endpoint = await new DockerCliTopologyInspector(process, {
    readEnv: env({
      DOCKER_CONTEXT: 'remote-daemon',
      DOCKER_HOST: 'unix:///var/run/docker.sock',
    }),
  }).inspectEndpoint();
  assertEquals(endpoint, {
    locality: 'remote',
    host: 'ssh://ops@daemon-host.example',
    source: 'DOCKER_CONTEXT',
    daemonHost: 'daemon-host.example',
    context: 'remote-daemon',
  });
  assertEquals(process.commands.map((command) => command.args), [
    ['context', 'inspect', 'remote-daemon'],
  ]);
});

Deno.test('the current context endpoint is classified from recorded context JSON', async () => {
  const remote = await inspectorFor([ok(REMOTE_CONTEXT_JSON)]).inspectEndpoint();
  assertEquals(remote.locality, 'remote');
  assertEquals(remote.source, 'docker-context');
  assertEquals(remote.context, 'remote-daemon');
  const local = await inspectorFor([ok(LOCAL_CONTEXT_JSON)]).inspectEndpoint();
  assertEquals(local.locality, 'local');
  assertEquals(local.context, 'default');
});

Deno.test('blank Docker variables fall back to the current context', async () => {
  const process = new RecordingProcess([ok(LOCAL_CONTEXT_JSON)]);
  const endpoint = await new DockerCliTopologyInspector(process, {
    readEnv: env({ DOCKER_CONTEXT: ' ', DOCKER_HOST: '  ' }),
  }).inspectEndpoint();
  assertEquals(endpoint.locality, 'local');
  assertEquals(process.commands.map((command) => command.args), [['context', 'inspect']]);
});

Deno.test('a missing, failing or garbled Docker CLI yields an unknown endpoint', async () => {
  const missing = await new DockerCliTopologyInspector(new MissingProcess(), {
    readEnv: env({}),
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

Deno.test('binding reads pin the resolved context so they reach the classified daemon', async () => {
  const process = new RecordingProcess([ok('3f1c0e9a\n'), ok(ASPIRE_CONTAINERS_INSPECT_JSON)]);
  await new DockerCliTopologyInspector(process, { readEnv: env({}) }).inspectPublishedBindings(
    { locality: 'remote', host: 'ssh://ops@daemon-host.example', context: 'remote-daemon' },
    [THIS_APPHOST_DB_INSTANCE],
  );
  assertEquals(process.commands.map((command) => command.args.slice(0, 3)), [
    ['--context', 'remote-daemon', 'ps'],
    ['--context', 'remote-daemon', 'inspect'],
  ]);
});

Deno.test("published bindings come only from this AppHost's container instances", async () => {
  const process = new RecordingProcess([
    ok('3f1c0e9a\n9b2d7c41\n'),
    ok(ASPIRE_CONTAINERS_INSPECT_JSON),
  ]);
  const observation = await new DockerCliTopologyInspector(process, { readEnv: env({}) })
    .inspectPublishedBindings(LOCAL_SOCKET, [THIS_APPHOST_DB_INSTANCE]);
  assertEquals(observation, {
    status: 'observed',
    bindings: [{
      container: THIS_APPHOST_DB_INSTANCE,
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

Deno.test('a same-named resource of another AppHost is never evidence', () => {
  const foreignOnly = JSON.parse(ASPIRE_CONTAINERS_INSPECT_JSON).filter(
    (row: { Name: string }) => row.Name === `/${OTHER_APPHOST_DB_INSTANCE}`,
  );
  const observation = readPublishedBindings(foreignOnly, [THIS_APPHOST_DB_INSTANCE]);
  assertEquals(observation.status, 'unavailable');
  if (observation.status === 'unavailable') {
    assertStringIncludes(observation.reason, `${THIS_APPHOST_DB_INSTANCE} were not found`);
  }
});

Deno.test('a binding without a host address is incomplete evidence, not a wildcard', () => {
  for (
    const binding of [{ HostPort: '55001' }, { HostIp: 7, HostPort: '55001' }, {
      HostIp: '',
      HostPort: '55001',
    }]
  ) {
    const observation = readPublishedBindings(
      withPorts({ '5432/tcp': [binding] }),
      [THIS_APPHOST_DB_INSTANCE],
    );
    assertEquals(observation.status, 'unavailable', JSON.stringify(binding));
    if (observation.status === 'unavailable') {
      assertStringIncludes(observation.reason, 'without a host address and port');
    }
  }
});

Deno.test('one malformed record among valid ones makes the observation unavailable', () => {
  const mixed = readPublishedBindings(
    withPorts({
      '5432/tcp': [{ HostIp: '127.0.0.1', HostPort: '55001' }],
      '8080/tcp': 'garbled',
    }),
    [THIS_APPHOST_DB_INSTANCE],
  );
  assertEquals(mixed.status, 'unavailable');

  const noPortMap = readPublishedBindings(
    [{ Name: `/${THIS_APPHOST_DB_INSTANCE}`, NetworkSettings: {} }],
    [THIS_APPHOST_DB_INSTANCE],
  );
  assertEquals(noPortMap.status, 'unavailable');

  const unnamedRow = readPublishedBindings(
    [...withPorts({ '5432/tcp': [{ HostIp: '127.0.0.1', HostPort: '55001' }] }), { Id: 'x' }],
    [THIS_APPHOST_DB_INSTANCE],
  );
  assertEquals(unnamedRow.status, 'unavailable');
});

Deno.test('no containers to attribute means no Docker calls', async () => {
  const process = new RecordingProcess([]);
  const observation = await new DockerCliTopologyInspector(process).inspectPublishedBindings(
    LOCAL_SOCKET,
    [],
  );
  assertEquals(observation, { status: 'observed', bindings: [] });
  assertEquals(process.commands.length, 0);
});

Deno.test('no Aspire containers on the daemon means the instances are missing', async () => {
  const process = new RecordingProcess([ok('\n')]);
  const observation = await new DockerCliTopologyInspector(process).inspectPublishedBindings(
    LOCAL_SOCKET,
    [THIS_APPHOST_DB_INSTANCE],
  );
  assertEquals(observation.status, 'unavailable');
  assertEquals(process.commands.length, 1);
});

Deno.test('a timed-out daemon call makes bindings unavailable rather than empty', async () => {
  const observation = await inspectorFor([{ code: 124, stdout: '', stderr: '', timedOut: true }])
    .inspectPublishedBindings(LOCAL_SOCKET, [THIS_APPHOST_DB_INSTANCE]);
  assertEquals(observation.status, 'unavailable');
  if (observation.status === 'unavailable') {
    assertStringIncludes(observation.reason, 'docker ps timed out');
  }
});

function withPorts(ports: Record<string, unknown>): unknown[] {
  return [{ Name: `/${THIS_APPHOST_DB_INSTANCE}`, NetworkSettings: { Ports: ports } }];
}

function env(values: Readonly<Record<string, string>>): (name: string) => string | undefined {
  return (name) => values[name];
}

function inspectorFor(results: readonly ProcessResult[]): DockerCliTopologyInspector {
  return new DockerCliTopologyInspector(new RecordingProcess(results), { readEnv: env({}) });
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
