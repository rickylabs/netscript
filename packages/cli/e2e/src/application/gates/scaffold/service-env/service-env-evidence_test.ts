/**
 * @module
 *
 * Pins the failure modes of the #1447 behavior gate. The gate itself only runs
 * inside the expensive runtime suite, so a mistake in its parse or its verdict
 * would surface as a green run that proved nothing — or as a red run that costs
 * many minutes to reproduce. These cases are the cheap half of that bargain.
 *
 * Both verdicts are covered: the resource-model one (`aspire describe`) and the
 * process one (`/proc/<pid>/environ`), which is the verdict that decides the
 * documented precedence categories.
 */

import { assert, assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import {
  buildDeclaredEnvironmentCases,
  DECLARED_REFUSED_PORT,
  DECLARED_STALE_DATABASE_URL,
  declaredEnvironment,
  GENERATED_DATABASE_URL_KEY,
} from './service-env-contract.ts';
import {
  collectProcessFailures,
  collectTopologyFailures,
  readDescribedResource,
} from './service-env-evidence.ts';
import { parseProcessEnvironment } from './process-evidence.ts';

const SERVICE = 'users';
const PRIMARY_DATABASE = 'main';
const REFERENCE = 'auth';
const ALLOCATED_DATABASE_URL = 'postgres://127.0.0.1:54321/app';
const ALLOCATED_ENDPOINT = 'http://127.0.0.1:54322';
const ALLOCATED_PORT = '54323';

const CASES = buildDeclaredEnvironmentCases({ name: SERVICE }, PRIMARY_DATABASE, REFERENCE);
const DECLARED = declaredEnvironment(CASES);

/** The environment a correctly wired running process would carry. */
function healthyProcessEnvironment(): Record<string, string> {
  return {
    ...DECLARED,
    OTEL_SERVICE_NAME: SERVICE,
    [GENERATED_DATABASE_URL_KEY]: ALLOCATED_DATABASE_URL,
    MAIN_URI: ALLOCATED_DATABASE_URL,
    DB_PROVIDER: PRIMARY_DATABASE,
    [`services__${REFERENCE}__http__0`]: ALLOCATED_ENDPOINT,
    PORT: ALLOCATED_PORT,
  };
}

function processEvidence(environment: Record<string, string>) {
  return {
    pid: 4242,
    environment: parseProcessEnvironment(
      new TextEncoder().encode(
        `${Object.entries(environment).map(([key, value]) => `${key}=${value}`).join('\0')}\0`,
      ),
    ),
  };
}

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
    environment: healthyProcessEnvironment(),
  };
}

Deno.test('contract: covers every documented category, in both directions', () => {
  const categories = new Set(CASES.map((entry) => entry.category));
  const rules = new Set(CASES.map((entry) => entry.rule));

  for (
    const category of [
      'plain',
      'OTel',
      'database URL',
      'database provider',
      'database engine URI',
      'service discovery',
      'PORT / endpoint',
    ]
  ) {
    assert(categories.has(category), `the declared contract covers no ${category} case`);
  }
  assertEquals([...rules].toSorted(), ['declared-wins', 'generated-wins', 'refused']);
});

for (const aspireVersion of ['13.4.6', '13.5.3']) {
  Deno.test(`topology evidence: accepts an Aspire ${aspireVersion} running resource`, () => {
    const evidence = readDescribedResource(
      describeOutput(healthyResource(), `Aspire CLI ${aspireVersion}\n`),
      SERVICE,
    );

    assertEquals(collectTopologyFailures(evidence, SERVICE, CASES), []);
  });
}

Deno.test('topology evidence: reads a DCP-suffixed instance id', () => {
  const resource = { ...healthyResource(), name: `${SERVICE}-sayhwbds`, displayName: undefined };
  const evidence = readDescribedResource(describeOutput(resource, 'Aspire CLI 13.4.6\n'), SERVICE);

  assertEquals(collectTopologyFailures(evidence, SERVICE, CASES), []);
});

Deno.test('topology evidence: reads the array-shaped environment', () => {
  const resource = {
    ...healthyResource(),
    environment: Object.entries(healthyProcessEnvironment()).map(([name, value]) => ({
      name,
      value,
    })),
  };
  const evidence = readDescribedResource(describeOutput(resource, 'Aspire CLI 13.4.6\n'), SERVICE);

  assertEquals(collectTopologyFailures(evidence, SERVICE, CASES), []);
});

Deno.test('topology evidence: requires an explicitly running state, not merely a non-terminal one', () => {
  // The old rule was a terminal-state denylist, so `Starting`, `Waiting`,
  // `Unhealthy` and any unknown spelling passed. #1447 was a resource that looked
  // fine and was not serving, so anything but Running/Healthy has to fail.
  for (
    const state of ['Starting', 'Waiting', 'Stopped', 'Unhealthy', 'Finished', 'Exited', 'Odd']
  ) {
    const failures = collectTopologyFailures(
      readDescribedResource(describeOutput({ ...healthyResource(), state }), SERVICE),
      SERVICE,
      CASES,
    );

    assertEquals(failures.length, 1, `state ${state} was accepted`);
    assertStringIncludes(failures[0], 'requires one of running, healthy');
  }
});

Deno.test('topology evidence: accepts Running and Healthy under either spelling shape', () => {
  for (const state of ['Running', 'running', 'Healthy', { text: 'Running' }]) {
    assertEquals(
      collectTopologyFailures(
        readDescribedResource(describeOutput({ ...healthyResource(), state }), SERVICE),
        SERVICE,
        CASES,
      ),
      [],
    );
  }
});

Deno.test('topology evidence: reports every missing declared entry at once', () => {
  const resource = healthyResource();
  resource.environment = { [GENERATED_DATABASE_URL_KEY]: ALLOCATED_DATABASE_URL };
  const failures = collectTopologyFailures(
    readDescribedResource(describeOutput(resource), SERVICE),
    SERVICE,
    CASES,
  );

  const declaredWins = CASES.filter((entry) => entry.rule === 'declared-wins');
  assertEquals(failures.length, declaredWins.length);
  for (const entry of declaredWins) assertStringIncludes(failures.join('\n'), entry.key);
});

Deno.test('topology evidence: catches an inverted precedence per category', () => {
  for (const entry of CASES.filter((item) => item.rule === 'generated-wins')) {
    const resource = healthyResource();
    resource.environment = { ...healthyProcessEnvironment(), [entry.key]: entry.value };
    const failures = collectTopologyFailures(
      readDescribedResource(describeOutput(resource), SERVICE),
      SERVICE,
      CASES,
    );

    assertEquals(failures.length, 1, `${entry.key} inversion went unnoticed`);
    assertStringIncludes(failures[0], `precedence inverted for ${entry.key}`);
  }
});

Deno.test('topology evidence: catches a refused key that was applied anyway', () => {
  const resource = healthyResource();
  resource.environment = { ...healthyProcessEnvironment(), PORT: DECLARED_REFUSED_PORT };
  const failures = collectTopologyFailures(
    readDescribedResource(describeOutput(resource), SERVICE),
    SERVICE,
    CASES,
  );

  assertEquals(failures.length, 1);
  assertStringIncludes(failures[0], 'the generator must refuse it');
});

Deno.test('topology evidence: refuses to guess when the resource is absent', () => {
  const output = describeOutput({ name: 'orders', displayName: 'orders', environment: {} });

  assertThrows(
    () => readDescribedResource(output, SERVICE),
    Error,
    'was not present in aspire describe output',
  );
});

Deno.test('topology evidence: refuses output that carries no JSON', () => {
  assertThrows(
    () => readDescribedResource('aspire: command not found', SERVICE),
    Error,
    'aspire describe did not emit JSON',
  );
});

Deno.test('process evidence: accepts a process that honors every category', () => {
  assertEquals(
    collectProcessFailures(processEvidence(healthyProcessEnvironment()), SERVICE, CASES),
    [],
  );
});

Deno.test('process evidence: refuses an empty case list rather than passing vacuously', () => {
  const failures = collectProcessFailures(
    processEvidence(healthyProcessEnvironment()),
    SERVICE,
    [],
  );

  assertEquals(failures.length, 1);
  assertStringIncludes(failures[0], 'must not pass vacuously');
});

Deno.test('process evidence: catches a declared value the process never observed', () => {
  const environment = healthyProcessEnvironment();
  delete environment.NETSCRIPT_E2E_SERVICE_MODE;
  const failures = collectProcessFailures(processEvidence(environment), SERVICE, CASES);

  assertEquals(failures.length, 1);
  assertStringIncludes(failures[0], 'does not observe declared NETSCRIPT_E2E_SERVICE_MODE');
});

Deno.test('process evidence: catches every inverted category in the running process', () => {
  for (const entry of CASES.filter((item) => item.rule === 'generated-wins')) {
    const failures = collectProcessFailures(
      processEvidence({ ...healthyProcessEnvironment(), [entry.key]: entry.value }),
      SERVICE,
      CASES,
    );

    assert(failures.length >= 1, `${entry.key} inversion went unnoticed in the process`);
    assertStringIncludes(failures.join('\n'), entry.key);
  }
});

Deno.test('process evidence: catches a generated OTel identity that is not the resource', () => {
  const failures = collectProcessFailures(
    processEvidence({ ...healthyProcessEnvironment(), OTEL_SERVICE_NAME: 'something-else' }),
    SERVICE,
    CASES,
  );

  assertEquals(failures.length, 1);
  assertStringIncludes(failures[0], 'expected the generated "users"');
});

Deno.test('process evidence: catches an engine URI that drifted from DATABASE_URL', () => {
  const failures = collectProcessFailures(
    processEvidence({ ...healthyProcessEnvironment(), MAIN_URI: 'postgres://elsewhere/db' }),
    SERVICE,
    CASES,
  );

  assertEquals(failures.length, 1);
  assertStringIncludes(failures[0], 'assigns both the same allocated value');
});

Deno.test('process evidence: catches a discovery URL that is not an allocated endpoint', () => {
  const failures = collectProcessFailures(
    processEvidence({
      ...healthyProcessEnvironment(),
      [`services__${REFERENCE}__http__0`]: 'tcp://127.0.0.1:1',
    }),
    SERVICE,
    CASES,
  );

  assertEquals(failures.length, 1);
  assertStringIncludes(failures[0], 'not the allocated http… value');
});

Deno.test('process evidence: catches a refused PORT that reached the process', () => {
  const failures = collectProcessFailures(
    processEvidence({ ...healthyProcessEnvironment(), PORT: DECLARED_REFUSED_PORT }),
    SERVICE,
    CASES,
  );

  assertEquals(failures.length, 1);
  assertStringIncludes(failures[0], 'must never be applied');
});

Deno.test('process evidence: catches a process with no PORT at all', () => {
  const environment = healthyProcessEnvironment();
  delete environment.PORT;
  const failures = collectProcessFailures(processEvidence(environment), SERVICE, CASES);

  assertEquals(failures.length, 1);
  assertStringIncludes(failures[0], 'injecting its own');
});

Deno.test('process evidence: catches the stale database literals winning in the process', () => {
  // Both database keys keep their own declared literal — the shape a consumer's
  // stale `appsettings.json` would produce if precedence inverted.
  const uriCase = CASES.find((entry) => entry.key === 'MAIN_URI');
  assert(uriCase, 'the engine URI case must be part of the contract');
  const failures = collectProcessFailures(
    processEvidence({
      ...healthyProcessEnvironment(),
      [GENERATED_DATABASE_URL_KEY]: DECLARED_STALE_DATABASE_URL,
      MAIN_URI: uriCase.value,
    }),
    SERVICE,
    CASES,
  );

  assertEquals(failures.length, 2);
  assertStringIncludes(failures.join('\n'), GENERATED_DATABASE_URL_KEY);
  assertStringIncludes(failures.join('\n'), 'MAIN_URI');
  assertStringIncludes(failures.join('\n'), 'the generated value must win it');
});
