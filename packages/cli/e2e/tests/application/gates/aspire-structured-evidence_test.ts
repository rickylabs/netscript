import { assertEquals, assertThrows } from '@std/assert';
import { evaluateAspireDoctor } from '../../../src/application/gates/scaffold/runtime/evidence/doctor.ts';
import {
  evaluateDescribeFollow,
  parseDescribeFollow,
} from '../../../src/application/gates/scaffold/runtime/evidence/describe-follow.ts';

const FIXTURES = new URL('./fixtures/', import.meta.url);
const ASPIRE_13_5_3_CAPTURE = new URL(
  'aspire-describe-follow-13.5.3-capture.ndjson',
  FIXTURES,
);
const RESOURCE_JSON_NULLABLE_FIELDS: readonly string[] = [
  'name',
  'displayName',
  'resourceType',
  'uid',
  'state',
  'waitingFor',
  'stateStyle',
  'creationTimestamp',
  'startTimestamp',
  'stopTimestamp',
  'source',
  'exitCode',
  'healthStatus',
  'dashboardUrl',
  'relationships',
  'urls',
  'volumes',
  'properties',
  'environment',
  'healthReports',
  'commands',
];

Deno.test('doctor receipt preserves warnings and accepts a zero-failure host', async () => {
  const fixture = JSON.parse(
    await Deno.readTextFile(new URL('aspire-doctor-13.5.3.json', FIXTURES)),
  );
  const result = evaluateAspireDoctor(fixture);
  assertEquals(result.summary, { passed: 5, warnings: 3, failed: 0 });
  assertEquals(result.warnings.map((entry) => entry.name), [
    'dev-certs',
    'dev-certs-certutil',
    'dcp-developer-certificate',
  ]);
});

Deno.test('doctor receipt fails closed on an explicit failed check', async () => {
  const fixture = JSON.parse(
    await Deno.readTextFile(new URL('aspire-doctor-13.5.3.json', FIXTURES)),
  );
  fixture.checks.push({
    category: 'container',
    name: 'docker',
    status: 'fail',
    message: 'stopped',
  });
  assertThrows(() => evaluateAspireDoctor(fixture), Error, 'docker: stopped');
});

Deno.test('describe follow parses bare Aspire 13.5 ResourceJson lines with last-seen semantics', async () => {
  const stream = await Deno.readTextFile(
    new URL('aspire-describe-follow-13.5.3.ndjson', FIXTURES),
  );
  const parsed = parseDescribeFollow(stream);
  assertEquals(parsed.resources.map((entry) => [entry.name, entry.state]), [
    ['postgres', 'Running'],
    ['workers', 'Running'],
  ]);
  assertEquals(evaluateDescribeFollow(stream, ['postgres', 'workers']), parsed);
});

Deno.test('describe follow accepts every nullable ResourceJson field omitted', () => {
  const complete: Record<string, unknown> = {
    name: 'dto-resource-instance',
    displayName: 'dto-resource',
    resourceType: 'Executable',
    uid: 'resource-uid',
    state: 'Running',
    waitingFor: ['dependency'],
    stateStyle: 'success',
    creationTimestamp: '2026-08-30T00:00:00Z',
    startTimestamp: '2026-08-30T00:00:01Z',
    stopTimestamp: null,
    source: 'deno',
    exitCode: null,
    healthStatus: 'Healthy',
    dashboardUrl: 'https://localhost.invalid/?resource=dto-resource',
    relationships: [{ type: 'Reference', resourceName: 'dependency' }],
    urls: [{ name: 'http', url: 'http://localhost.invalid' }],
    volumes: [{ source: '/data', target: '/data', mountType: 'bind' }],
    properties: { key: null },
    environment: { KEY: null },
    healthReports: { self: { status: 'Healthy' } },
    commands: { restart: { displayName: 'Restart', state: 'Enabled' } },
  };

  for (const field of RESOURCE_JSON_NULLABLE_FIELDS) {
    const candidate = structuredClone(complete);
    delete candidate[field];
    const resource = parseDescribeFollow(`${JSON.stringify(candidate)}\n`).resources[0];
    if (!resource) throw new Error(`omitting ${field} removed the resource`);
    assertEquals(
      resource.name,
      field === 'displayName' ? 'dto-resource-instance' : 'dto-resource',
      `identity after omitting ${field}`,
    );
    assertEquals(resource.state, field === 'state' ? 'Unknown' : 'Running', field);
    assertEquals(resource.statePending, field === 'state', field);
    if (field === 'healthReports') assertEquals(resource.healthReports, {});
  }

  const explicitNulls = parseDescribeFollow(
    '{"displayName":"nullable-resource","state":null,"healthStatus":null,"healthReports":null}\n',
  ).resources[0];
  assertEquals(explicitNulls?.state, 'Unknown');
  assertEquals(explicitNulls?.statePending, true);
  assertEquals(explicitNulls?.healthReports, {});
});

Deno.test('describe follow parses hosted nullable-state resource shapes as pending', async () => {
  const stream = await Deno.readTextFile(
    new URL('aspire-describe-follow-13.5.3-nullable-state.ndjson', FIXTURES),
  );
  assertEquals(
    parseDescribeFollow(stream).resources.map((resource) => [
      resource.name,
      resource.state,
      resource.statePending,
    ]),
    [
      ['prisma-studio', 'Unknown', true],
      ['sagas-api', 'Unknown', true],
    ],
  );
  assertThrows(
    () => evaluateDescribeFollow(stream, ['prisma-studio', 'sagas-api']),
    Error,
    'did not converge: prisma-studio=Unknown, sagas-api=Unknown',
  );
  const laterRunning = `${stream}{"displayName":"prisma-studio","state":"Running"}\n`;
  assertEquals(
    evaluateDescribeFollow(laterRunning, ['prisma-studio']).resources[0]?.state,
    'Running',
  );
  assertEquals(
    evaluateDescribeFollow(laterRunning, ['prisma-studio']).resources[0]?.statePending,
    false,
  );
});

Deno.test('describe follow rejects invalid ResourceJson gate fields precisely', () => {
  const cases: readonly { readonly line: string; readonly message: string }[] = [
    {
      line: '[]',
      message: 'describe line 1 is not an object',
    },
    {
      line: '{"displayName":"prisma-studio","state":7}',
      message: 'describe line 1 prisma-studio state must be a string, null, or omitted',
    },
    {
      line: '{"displayName":"sagas-api","healthStatus":7}',
      message: 'describe line 1 sagas-api healthStatus must be a string, null, or omitted',
    },
    {
      line: '{"displayName":"workers","healthReports":[]}',
      message: 'describe line 1 workers healthReports is not an object',
    },
    {
      line: '{"state":"Running"}',
      message: 'describe line 1 resource 1 omitted identity (displayName/name/resourceName)',
    },
  ];
  for (const example of cases) {
    assertThrows(() => parseDescribeFollow(`${example.line}\n`), Error, example.message);
  }
});

Deno.test('describe follow treats omitted and null health-report statuses as pending', async () => {
  const lines = (await Deno.readTextFile(ASPIRE_13_5_3_CAPTURE)).trimEnd().split(/\r?\n/);
  const earlyRunningPostgres = lines[11];
  if (!earlyRunningPostgres) throw new Error('Aspire capture omitted line 12');

  const parsed = parseDescribeFollow(`${earlyRunningPostgres}\n`);
  assertEquals(parsed.resources[0]?.healthReports.postgres_check, {
    status: 'Unknown',
    pending: true,
  });
  assertThrows(
    () => evaluateDescribeFollow(`${earlyRunningPostgres}\n`, ['postgres']),
    Error,
    'postgres.healthReports.postgres_check=Unknown',
  );

  const explicitNull = earlyRunningPostgres.replace(
    '"postgres_check":{}',
    '"postgres_check":{"status":null}',
  );
  if (explicitNull === earlyRunningPostgres) {
    throw new Error('Aspire capture omitted the expected pending postgres report');
  }
  assertEquals(
    parseDescribeFollow(`${explicitNull}\n`).resources[0]?.healthReports.postgres_check,
    { status: 'Unknown', pending: true },
  );
});

Deno.test('describe follow applies last-seen health-report status from a real 13.5.3 capture', async () => {
  const stream = await Deno.readTextFile(ASPIRE_13_5_3_CAPTURE);
  const postgres = parseDescribeFollow(stream).resources.find((entry) => entry.name === 'postgres');
  assertEquals(postgres?.healthReports.postgres_check, {
    status: 'Unhealthy',
    pending: false,
    description: 'Failed to connect to 127.0.0.1:29584',
  });
  assertThrows(
    () => evaluateDescribeFollow(stream, ['postgres']),
    Error,
    'postgres.healthReports.postgres_check=Unhealthy',
  );

  const web = evaluateDescribeFollow(stream, ['preflight-topology-web']).resources[0];
  assertEquals(web?.healthReports['preflight-topology-web_http_/health_200_check'], {
    status: 'Healthy',
    pending: false,
  });
});

Deno.test('describe follow rejects a non-string non-null health-report status precisely', () => {
  const stream =
    '{"name":"postgres","state":"Running","healthReports":{"postgres_check":{"status":7}}}\n';
  assertThrows(
    () => parseDescribeFollow(stream),
    Error,
    'describe line 1 postgres healthReports.postgres_check status must be a string, null, or omitted',
  );
});

Deno.test('describe follow rejects a non-object health report precisely', () => {
  const stream = '{"name":"postgres","state":"Running","healthReports":{"postgres_check":"x"}}\n';
  assertThrows(
    () => parseDescribeFollow(stream),
    Error,
    'describe line 1 postgres healthReports.postgres_check is not an object',
  );
});

Deno.test('describe follow retains the wrapped resources shape', async () => {
  const stream = await Deno.readTextFile(new URL('aspire-describe-follow.ndjson', FIXTURES));
  const result = parseDescribeFollow(stream);
  assertEquals(result.resources.map((entry) => [entry.name, entry.state]), [
    ['postgres', 'Running'],
    ['workers', 'Running'],
  ]);
  assertEquals(result.resources[0].healthReports.postgres_listener.status, 'Healthy');
});

Deno.test('describe follow converges from wrapped last-seen resource state', async () => {
  const stream = await Deno.readTextFile(new URL('aspire-describe-follow.ndjson', FIXTURES));
  assertEquals(
    evaluateDescribeFollow(stream, ['postgres', 'workers']).resources.map((entry) => entry.state),
    ['Running', 'Running'],
  );
});

Deno.test('describe follow fails when the final resource set does not converge', async () => {
  const stream = await Deno.readTextFile(new URL('aspire-describe-follow.ndjson', FIXTURES));
  assertThrows(
    () => evaluateDescribeFollow(stream, ['postgres', 'workers', 'missing']),
    Error,
    'missing',
  );
});

Deno.test('describe follow reports a malformed NDJSON line number', () => {
  const stream = [
    JSON.stringify({ resources: [{ displayName: 'postgres', state: 'Starting' }] }),
    '{not-json}',
  ].join('\n');
  assertThrows(
    () => evaluateDescribeFollow(stream, ['postgres']),
    Error,
    'line 2 is not JSON',
  );
});

Deno.test('describe follow rejects an unknown JSON line shape precisely', () => {
  assertThrows(
    () => parseDescribeFollow('{"message":"not a resource"}\n'),
    Error,
    'describe line 1 resource 1 omitted identity (displayName/name/resourceName)',
  );
});

Deno.test('describe follow reports a pending last-seen resource state', () => {
  const stream = `${
    JSON.stringify({
      resources: [{ displayName: 'postgres', state: 'Starting', healthReports: {} }],
    })
  }\n`;
  assertThrows(
    () => evaluateDescribeFollow(stream, ['postgres']),
    Error,
    'did not converge: postgres=Starting',
  );
});

Deno.test('describe follow rejects Running resources with unhealthy reports', () => {
  const stream = `${
    JSON.stringify({
      resources: [{
        displayName: 'postgres',
        state: 'Running',
        healthReports: { self: { status: 'Unhealthy' } },
      }],
    })
  }\n`;
  assertThrows(
    () => evaluateDescribeFollow(stream, ['postgres']),
    Error,
    'did not converge: postgres.healthReports.self=Unhealthy',
  );
});
