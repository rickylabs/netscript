import { assertEquals, assertStringIncludes } from '@std/assert';

import { collectSchemaIssues, resolveAppsettingsPath } from './resolve-appsettings-path.ts';

const DOCUMENT = {
  NetScript: {
    Name: 'my-app',
    Databases: { postgres: { Engine: 'Postgres', Persistent: true } },
    Services: { 'user-api': { Runtime: 'deno', Port: 7101, Entrypoint: 'src/main.ts' } },
  },
};

Deno.test('resolveAppsettingsPath accepts the full appsettings path unchanged', () => {
  const resolved = resolveAppsettingsPath('NetScript.Databases.postgres.Persistent', DOCUMENT);
  assertEquals(resolved.status, 'known');
  assertEquals(resolved.canonical, 'NetScript.Databases.postgres.Persistent');
});

Deno.test('resolveAppsettingsPath canonicalizes schema field casing', () => {
  const resolved = resolveAppsettingsPath('netscript.databases.postgres.persistent', DOCUMENT);
  assertEquals(resolved.status, 'known');
  assertEquals(resolved.canonical, 'NetScript.Databases.postgres.Persistent');
});

Deno.test('resolveAppsettingsPath accepts the section-relative shorthand', () => {
  assertEquals(
    resolveAppsettingsPath('Databases.postgres.Persistent', DOCUMENT).canonical,
    'NetScript.Databases.postgres.Persistent',
  );
});

Deno.test('resolveAppsettingsPath never re-cases a record key against the schema', () => {
  // `Postgres` is the schema's *engine* spelling; the record key stays as the
  // document has it. Capitalizing it was half of #955.
  const resolved = resolveAppsettingsPath('Databases.Postgres.Persistent', DOCUMENT);
  assertEquals(resolved.canonical, 'NetScript.Databases.postgres.Persistent');
});

Deno.test('resolveAppsettingsPath keeps an unknown record key verbatim', () => {
  // A key not yet in the document is still a legal record key — it is the
  // developer's name for a new resource, so no casing is imposed on it.
  const resolved = resolveAppsettingsPath('Databases.MyReplica.Persistent', DOCUMENT);
  assertEquals(resolved.status, 'known');
  assertEquals(resolved.canonical, 'NetScript.Databases.MyReplica.Persistent');
});

Deno.test('resolveAppsettingsPath preserves hyphenated service keys', () => {
  assertEquals(
    resolveAppsettingsPath('services.user-api.Port', DOCUMENT).canonical,
    'NetScript.Services.user-api.Port',
  );
});

Deno.test('resolveAppsettingsPath rejects a misspelled schema field with suggestions', () => {
  const resolved = resolveAppsettingsPath('NetScript.Databases.postgres.Persistant', DOCUMENT);
  assertEquals(resolved.status, 'unknown');
  assertEquals(resolved.suggestions[0], 'NetScript.Databases.postgres.Persistent');
  assertStringIncludes(resolved.reason ?? '', 'NetScript.Databases.postgres');
});

Deno.test('resolveAppsettingsPath rejects a doubled root prefix', () => {
  const resolved = resolveAppsettingsPath('NetScript.NetScript.Databases.postgres.Persistent');
  assertEquals(resolved.status, 'unknown');
});

Deno.test('resolveAppsettingsPath reports an unknown top-level key at the top level', () => {
  // Not silently re-homed under NetScript: the segments a forced write would
  // use must be the ones the user typed.
  const resolved = resolveAppsettingsPath('Parameters.postgres-password', DOCUMENT);
  assertEquals(resolved.status, 'unknown');
  assertEquals(resolved.segments, ['Parameters', 'postgres-password']);
});

Deno.test('resolveAppsettingsPath will not descend into a scalar', () => {
  assertEquals(resolveAppsettingsPath('NetScript.Name.Extra', DOCUMENT).status, 'unknown');
});

Deno.test('resolveAppsettingsPath resolves the telemetry alias through the schema', () => {
  const resolved = resolveAppsettingsPath('telemetry.otlpEndpoint', DOCUMENT);
  assertEquals(resolved.status, 'known');
  assertEquals(resolved.canonical, 'NetScript.Otel.HttpEndpoint');
});

Deno.test('collectSchemaIssues reports issues at the written path', () => {
  const issues = collectSchemaIssues(
    { NetScript: { Name: 'my-app', Databases: { postgres: { Engine: 'Postgres', Persistent: 'yes' } } } },
    ['NetScript', 'Databases', 'postgres', 'Persistent'],
  );
  assertEquals(issues.length, 1);
  assertStringIncludes(issues[0]!, 'NetScript.Databases.postgres.Persistent');
});

Deno.test('collectSchemaIssues ignores pre-existing damage elsewhere', () => {
  // `Name` is required and missing; a correct write to Databases must not be
  // blocked by an unrelated defect the developer has not fixed yet.
  const issues = collectSchemaIssues(
    { NetScript: { Databases: { postgres: { Engine: 'Postgres', Persistent: false } } } },
    ['NetScript', 'Databases', 'postgres', 'Persistent'],
  );
  assertEquals(issues, []);
});
