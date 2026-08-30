import { assertEquals, assertThrows } from '@std/assert';
import { evaluateAspireDoctor } from '../../../src/application/gates/scaffold/runtime/evidence/doctor.ts';
import { evaluateDescribeFollow } from '../../../src/application/gates/scaffold/runtime/evidence/describe-follow.ts';

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

Deno.test('describe follow converges from last-seen resource state and object health reports', async () => {
  const stream = await Deno.readTextFile(new URL('aspire-describe-follow.ndjson', FIXTURES));
  const result = evaluateDescribeFollow(stream, ['postgres', 'workers']);
  assertEquals(result.resources.map((entry) => [entry.name, entry.state]), [
    ['postgres', 'Running'],
    ['workers', 'Running'],
  ]);
  assertEquals(result.resources[0].healthReports.postgres_listener.status, 'Healthy');
});

Deno.test('describe follow fails when the final resource set does not converge', async () => {
  const stream = await Deno.readTextFile(new URL('aspire-describe-follow.ndjson', FIXTURES));
  assertThrows(
    () => evaluateDescribeFollow(stream, ['postgres', 'workers', 'missing']),
    Error,
    'missing',
  );
});
