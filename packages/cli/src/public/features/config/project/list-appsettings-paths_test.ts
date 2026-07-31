import { assertEquals } from '@std/assert';

import { listAppsettingsPaths, RECORD_KEY_PLACEHOLDER } from './list-appsettings-paths.ts';

Deno.test('listAppsettingsPaths reports canonical case-sensitive paths', () => {
  const paths = listAppsettingsPaths().map((entry) => entry.path);
  assertEquals(paths.includes('NetScript.Otel.HttpEndpoint'), true);
  assertEquals(paths.includes('NetScript.otel.httpEndpoint'), false);
});

Deno.test('listAppsettingsPaths expands records over the project\'s own keys', () => {
  const entries = listAppsettingsPaths(
    { NetScript: { Databases: { postgres: { Engine: 'Postgres', Persistent: true } } } },
    'Databases',
  );
  const persistent = entries.find((entry) =>
    entry.path === 'NetScript.Databases.postgres.Persistent'
  );
  assertEquals(persistent?.status, 'known');
  assertEquals(persistent?.value, true);
});

Deno.test('listAppsettingsPaths templates records the project has not populated', () => {
  const paths = listAppsettingsPaths({ NetScript: { Databases: {} } }, 'Databases').map((entry) =>
    entry.path
  );
  assertEquals(paths.includes(`NetScript.Databases.${RECORD_KEY_PLACEHOLDER}.Persistent`), true);
});

Deno.test('listAppsettingsPaths surfaces keys the generator does not read', () => {
  // The dead key #955 used to write. Listing it is how a developer discovers
  // that an earlier `config set` changed nothing.
  const entries = listAppsettingsPaths({
    NetScript: {
      Name: 'my-app',
      NetScript: { Databases: { Postgres: { Persistent: false } } },
    },
  });
  const dead = entries.find((entry) =>
    entry.path === 'NetScript.NetScript.Databases.Postgres.Persistent'
  );
  assertEquals(dead?.status, 'unknown');
  assertEquals(dead?.value, false);
});

Deno.test('listAppsettingsPaths filters by prefix', () => {
  const paths = listAppsettingsPaths(undefined, 'Otel').map((entry) => entry.path);
  assertEquals(paths, ['NetScript.Otel.HttpEndpoint', 'NetScript.Otel.Protocol']);
});
