import { assertEquals, assertStringIncludes } from '@std/assert';
import {
  assessDockerTopology,
  classifyDockerEndpoint,
  type DockerEndpoint,
  type PublishedBinding,
} from './docker-topology.ts';

const LOCAL: DockerEndpoint = classifyDockerEndpoint(
  'unix:///var/run/docker.sock',
  'docker-context',
);
const REMOTE: DockerEndpoint = classifyDockerEndpoint(
  'ssh://ops@daemon-host.example',
  'docker-context',
);
const UNKNOWN: DockerEndpoint = { locality: 'unknown', reason: 'docker CLI was not found.' };

const ASPIRE_POSTGRES: PublishedBinding = {
  container: 'main-db-xkcdabcd',
  containerPort: '5432/tcp',
  hostIp: '127.0.0.1',
  hostPort: '55001',
};

Deno.test('Docker endpoint classification treats sockets, pipes and loopback TCP as local', () => {
  for (
    const host of [
      'unix:///var/run/docker.sock',
      'unix:///run/user/1000/docker.sock',
      'npipe:////./pipe/docker_engine',
      'tcp://127.0.0.1:2375',
      'tcp://localhost:2376',
      'tcp://[::1]:2375',
      'ssh://ops@localhost',
    ]
  ) {
    assertEquals(classifyDockerEndpoint(host, 'DOCKER_HOST').locality, 'local', host);
  }
});

Deno.test('Docker endpoint classification treats any other network host as remote', () => {
  assertEquals(classifyDockerEndpoint('tcp://10.0.0.5:2376', 'DOCKER_HOST'), {
    locality: 'remote',
    host: 'tcp://10.0.0.5:2376',
    source: 'DOCKER_HOST',
    daemonHost: '10.0.0.5',
  });
  assertEquals(REMOTE.locality, 'remote');
  assertEquals(REMOTE.daemonHost, 'daemon-host.example');
});

Deno.test('Docker endpoint classification never guesses an unparseable or unsupported endpoint', () => {
  for (const host of [undefined, '', '   ', 'not a url', 'fd://', 'ftp://daemon-host.example']) {
    const endpoint = classifyDockerEndpoint(host, 'docker-context');
    assertEquals(endpoint.locality, 'unknown', String(host));
    assertEquals(typeof endpoint.reason, 'string');
  }
});

Deno.test('topology passes only when a local daemon publishes on loopback', () => {
  const assessment = assessDockerTopology(LOCAL, {
    status: 'observed',
    bindings: [ASPIRE_POSTGRES, { ...ASPIRE_POSTGRES, hostIp: '0.0.0.0', hostPort: '55002' }],
  });
  assertEquals(assessment.endpoint.verdict, 'local');
  assertEquals(assessment.bindings.verdict, 'local');
  assertStringIncludes(assessment.bindings.message, '2 published port(s)');
});

Deno.test("topology reports a remote daemon's loopback bindings as a mismatch", () => {
  const assessment = assessDockerTopology(REMOTE, {
    status: 'observed',
    bindings: [ASPIRE_POSTGRES],
  });
  assertEquals(assessment.endpoint.verdict, 'mismatch');
  assertStringIncludes(assessment.endpoint.message, 'never become ready');
  assertEquals(assessment.bindings.verdict, 'mismatch');
  assertStringIncludes(
    assessment.bindings.message,
    "main-db-xkcdabcd 5432/tcp -> 127.0.0.1:55001 (daemon host's loopback)",
  );
  assertStringIncludes(assessment.bindings.message, 'daemon-host.example');
});

Deno.test('topology reports wildcard bindings on a remote daemon as a mismatch too', () => {
  const assessment = assessDockerTopology(REMOTE, {
    status: 'observed',
    bindings: [{ ...ASPIRE_POSTGRES, hostIp: '::', hostPort: '5432' }],
  });
  assertEquals(assessment.bindings.verdict, 'mismatch');
  assertStringIncludes(assessment.bindings.message, '[::]:5432 (all daemon-host interfaces)');
});

Deno.test('topology reports a local non-loopback binding as a mismatch', () => {
  const assessment = assessDockerTopology(LOCAL, {
    status: 'observed',
    bindings: [{ ...ASPIRE_POSTGRES, hostIp: '192.168.10.4' }],
  });
  assertEquals(assessment.bindings.verdict, 'mismatch');
  assertStringIncludes(assessment.bindings.message, 'non-loopback interface');
});

Deno.test('topology is inconclusive, never a pass, when anything is undeterminable', () => {
  const observed = { status: 'observed', bindings: [ASPIRE_POSTGRES] } as const;
  const cases = [
    assessDockerTopology(UNKNOWN, observed),
    assessDockerTopology(LOCAL, undefined),
    assessDockerTopology(LOCAL, { status: 'observed', bindings: [] }),
    assessDockerTopology(LOCAL, { status: 'unavailable', reason: 'docker ps timed out.' }),
  ];
  assertEquals(cases[0].endpoint.verdict, 'inconclusive');
  assertStringIncludes(cases[0].endpoint.message, 'docker CLI was not found.');
  for (const assessment of cases) {
    assertEquals(assessment.bindings.verdict, 'inconclusive');
    assertStringIncludes(assessment.bindings.message, 'Inconclusive:');
  }
  assertStringIncludes(cases[1].bindings.message, 'no AppHost is running');
  assertStringIncludes(cases[3].bindings.message, 'docker ps timed out.');
});
