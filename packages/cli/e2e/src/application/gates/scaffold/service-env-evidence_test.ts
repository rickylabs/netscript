/**
 * @module
 *
 * Pins the failure modes of the #1447 behavior gate. The gate itself only runs
 * inside the expensive runtime suite, so a mistake in its parse or its verdict
 * would surface as a green run that proved nothing — or as a red run that costs
 * many minutes to reproduce. These cases are the cheap half of that bargain.
 */

import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import {
  DECLARED_SERVICE_ENV,
  DECLARED_STALE_DATABASE_URL,
  GENERATED_DATABASE_URL_KEY,
} from './service-env-contract.ts';
import {
  collectServiceEnvironmentFailures,
  readDescribedResource,
} from './service-env-evidence.ts';

const SERVICE = 'users';
const ALLOCATED_DATABASE_URL = 'postgres://127.0.0.1:54321/app';

function describeOutput(
  resource: Record<string, unknown>,
  banner = 'Aspire CLI 13.4.6\n',
): string {
  return `${banner}${JSON.stringify({ resources: [resource] })}`;
}

function healthyResource(): Record<string, unknown> {
  return {
    name: SERVICE,
    displayName: SERVICE,
    state: 'Running',
    environment: {
      ...DECLARED_SERVICE_ENV,
      [GENERATED_DATABASE_URL_KEY]: ALLOCATED_DATABASE_URL,
      OTEL_SERVICE_NAME: SERVICE,
    },
  };
}

Deno.test('service env evidence: accepts a running resource that honors the contract', () => {
  const evidence = readDescribedResource(describeOutput(healthyResource()), SERVICE);

  assertEquals(collectServiceEnvironmentFailures(evidence, SERVICE), []);
});

Deno.test('service env evidence: reads a DCP-suffixed instance id', () => {
  const resource = { ...healthyResource(), name: `${SERVICE}-sayhwbds`, displayName: undefined };
  const evidence = readDescribedResource(describeOutput(resource), SERVICE);

  assertEquals(collectServiceEnvironmentFailures(evidence, SERVICE), []);
});

Deno.test('service env evidence: reads the array-shaped environment', () => {
  const resource = {
    ...healthyResource(),
    environment: [
      ...Object.entries(DECLARED_SERVICE_ENV).map(([name, value]) => ({ name, value })),
      { name: GENERATED_DATABASE_URL_KEY, value: ALLOCATED_DATABASE_URL },
    ],
  };
  const evidence = readDescribedResource(describeOutput(resource), SERVICE);

  assertEquals(collectServiceEnvironmentFailures(evidence, SERVICE), []);
});

Deno.test('service env evidence: reports every missing declared entry at once', () => {
  const resource = healthyResource();
  resource.environment = { [GENERATED_DATABASE_URL_KEY]: ALLOCATED_DATABASE_URL };
  const failures = collectServiceEnvironmentFailures(
    readDescribedResource(describeOutput(resource), SERVICE),
    SERVICE,
  );

  assertEquals(failures.length, Object.keys(DECLARED_SERVICE_ENV).length);
  for (const key of Object.keys(DECLARED_SERVICE_ENV)) {
    assertStringIncludes(failures.join('\n'), key);
  }
});

Deno.test('service env evidence: catches an inverted precedence', () => {
  const resource = healthyResource();
  resource.environment = {
    ...DECLARED_SERVICE_ENV,
    [GENERATED_DATABASE_URL_KEY]: DECLARED_STALE_DATABASE_URL,
  };
  const failures = collectServiceEnvironmentFailures(
    readDescribedResource(describeOutput(resource), SERVICE),
    SERVICE,
  );

  assertEquals(failures.length, 1);
  assertStringIncludes(failures[0], 'precedence inverted');
});

Deno.test('service env evidence: catches the #1447 symptom of a finished resource', () => {
  const resource = { ...healthyResource(), state: 'Finished' };
  const failures = collectServiceEnvironmentFailures(
    readDescribedResource(describeOutput(resource), SERVICE),
    SERVICE,
  );

  assertEquals(failures.length, 1);
  assertStringIncludes(failures[0], 'is not running');
});

Deno.test('service env evidence: reads a state published as an object', () => {
  const resource = { ...healthyResource(), state: { text: 'Exited' } };
  const failures = collectServiceEnvironmentFailures(
    readDescribedResource(describeOutput(resource), SERVICE),
    SERVICE,
  );

  assertEquals(failures.length, 1);
  assertStringIncludes(failures[0], 'is not running');
});

Deno.test('service env evidence: refuses to guess when the resource is absent', () => {
  const output = describeOutput({ name: 'orders', displayName: 'orders', environment: {} });

  assertThrows(
    () => readDescribedResource(output, SERVICE),
    Error,
    'was not present in aspire describe output',
  );
});

Deno.test('service env evidence: refuses output that carries no JSON', () => {
  assertThrows(
    () => readDescribedResource('aspire: command not found', SERVICE),
    Error,
    'aspire describe did not emit JSON',
  );
});
