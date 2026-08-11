/**
 * @module
 *
 * Pins the discovery the #1447 gates depend on — in particular the case where
 * nothing declares an environment.
 *
 * That negative case is the reason this file exists. A verifier that discovered
 * zero subjects and iterated them would exit 0 having asserted nothing, and a
 * green run would prove the opposite of what it claims. Discovery therefore
 * throws, and this test is what keeps it throwing.
 */

import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import {
  databaseUriEnvKey,
  discoverDeclaringSubjects,
  readTopology,
  selectDeclarationSubject,
} from './discover-service-subjects.ts';

function appsettings(services: Record<string, unknown>, primaryDatabase = 'main'): string {
  return JSON.stringify({
    NetScript: {
      Name: 'discovery-fixture',
      PrimaryDatabase: primaryDatabase,
      Services: services,
    },
  });
}

Deno.test('discovery: reads names, workdirs, entrypoints and declared entries', () => {
  const topology = readTopology(appsettings({
    users: { Runtime: 'deno', Env: { A: '1' } },
    reports: {
      Runtime: 'deno',
      Workdir: 'custom/reports',
      Entrypoint: 'mod.ts',
      Environment: { B: '2' },
      ServiceReferences: ['users'],
      PluginReferences: ['auth'],
    },
  }));

  assertEquals(topology.primaryDatabase, 'main');
  assertEquals(topology.services.map((service) => service.name), ['users', 'reports']);
  assertEquals(topology.services[0].workdir, 'services/users');
  assertEquals(topology.services[0].entrypoint, 'src/main.ts');
  assertEquals(topology.services[0].declared, { A: '1' });
  assertEquals(topology.services[1].workdir, 'custom/reports');
  assertEquals(topology.services[1].entrypoint, 'mod.ts');
  assertEquals(topology.services[1].references, ['users', 'auth']);
});

Deno.test('discovery: prefers the canonical Environment over the deprecated alias', () => {
  const topology = readTopology(appsettings({
    users: { Environment: { MODE: 'http' }, Env: { MODE: 'stdio' } },
  }));

  assertEquals(topology.services[0].declared, { MODE: 'http' });
});

Deno.test('discovery: selects the subject deterministically and skips disabled services', () => {
  const topology = readTopology(appsettings({
    users: { Runtime: 'deno' },
    accounts: { Runtime: 'deno', Enabled: false },
  }));

  assertEquals(selectDeclarationSubject(topology).name, 'users');
  assertEquals(
    selectDeclarationSubject(readTopology(appsettings({
      users: { Runtime: 'deno' },
      accounts: { Runtime: 'deno' },
    }))).name,
    'accounts',
  );
});

Deno.test('discovery: refuses a project with no enabled service', () => {
  const topology = readTopology(appsettings({ users: { Enabled: false } }));

  assertThrows(
    () => selectDeclarationSubject(topology),
    Error,
    'declares no enabled service',
  );
});

Deno.test('discovery: returns every service that declares an environment', () => {
  const subjects = discoverDeclaringSubjects(readTopology(appsettings({
    users: { Env: { A: '1' } },
    reports: { Runtime: 'deno' },
    accounts: { Environment: { B: '2' } },
  })));

  assertEquals(subjects.map((subject) => subject.name), ['users', 'accounts']);
});

Deno.test('discovery: refuses to pass by matching nothing when no service declares env', () => {
  const topology = readTopology(appsettings({ users: { Runtime: 'deno' } }));

  const error = assertThrows(
    () => discoverDeclaringSubjects(topology),
    Error,
    'declares Environment or Env',
  );
  // The message has to name what it did see, or a red run costs a repro.
  assertStringIncludes(error.message, 'users');
  assertStringIncludes(error.message, 'refuses to pass by matching nothing');
});

Deno.test('discovery: refuses a config whose shape it cannot read', () => {
  assertThrows(() => readTopology('{}'), Error, 'declares no NetScript section');
  assertThrows(
    () => readTopology(JSON.stringify({ NetScript: { Name: 'x' } })),
    Error,
    'declares no NetScript.Services',
  );
  assertThrows(
    () => readTopology(appsettings({ users: { Env: { A: 1 } } })),
    Error,
    'non-string value for A',
  );
});

Deno.test('discovery: derives the engine URI key the way the compat helper does', () => {
  assertEquals(databaseUriEnvKey('main'), 'MAIN_URI');
  assertEquals(databaseUriEnvKey('my-app-db'), 'MY_APP_DB_URI');
  assertEquals(databaseUriEnvKey(undefined), undefined);
  assertEquals(databaseUriEnvKey('---'), undefined);
});
