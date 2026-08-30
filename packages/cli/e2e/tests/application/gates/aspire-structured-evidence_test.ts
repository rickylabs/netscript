import { assertEquals, assertThrows } from '@std/assert';
import { evaluateAspireDoctor } from '../../../src/application/gates/scaffold/runtime/evidence/doctor.ts';
import {
  evaluateDescribeFollow,
  parseDescribeFollow,
} from '../../../src/application/gates/scaffold/runtime/evidence/describe-follow.ts';

const FIXTURES = new URL('./fixtures/', import.meta.url);

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
    'describe line 1 is neither wrapped resources[] nor a bare resource object',
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
