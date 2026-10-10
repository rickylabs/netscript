import { assertEquals, assertThrows } from '@std/assert';
import * as postgres from '../adapters/postgres.adapter.ts';
import { parseAdoNetConnectionString } from '../adapters/mssql.adapter.ts';

Deno.test('Postgres normalizer preserves both URI schemes and TLS query bytes', () => {
  for (
    const input of [
      'postgres://app:p%40ss@db.example:5432/app?sslmode=verify-full&sslrootcert=%2Fca.pem',
      'postgresql://app:secret@localhost/app?sslmode=verify-ca#fragment',
      'POSTGRESQL://app:secret@localhost/app?sslmode=require',
    ]
  ) {
    assertEquals(postgres.normalizePostgresConnectionString(input), input);
  }
});

Deno.test('Postgres normalizer translates Npgsql keys, aliases and encoded credentials', () => {
  const cases = [
    [
      'Host=db.example;Port=5433;Database=app;Username=app;Password=secret',
      'postgres://app:secret@db.example:5433/app',
    ],
    [
      'Server=db.example;User ID=a@b;Password=p:=/@?#%;Database=a/b',
      'postgres://a%40b:p%3A%3D%2F%40%3F%23%25@db.example:5432/a%2Fb',
    ],
    [
      ' hOsT = localhost ; DaTaBaSe = app ; UsErNaMe = app ; pAsSwOrD = " a;=b " ;',
      'postgres://app:%20a%3B%3Db%20@localhost:5432/app',
    ],
    ["Host=localhost;UID=app;PWD='a;''b=c'", 'postgres://app:a%3B%27b%3Dc@localhost:5432/postgres'],
    ['Host=[::1];Username="a""b";Password=', 'postgres://a%22b:@[::1]:5432/postgres'],
    [
      'Host=localhost;Server=db.example;Username=old;User ID=app;Password=x=y',
      'postgres://app:x%3Dy@db.example:5432/postgres',
    ],
  ];
  for (const [input, expected] of cases) {
    assertEquals(postgres.normalizePostgresConnectionString(input), expected);
  }
});

Deno.test('Postgres normalizer preserves all five explicit TLS modes', () => {
  for (
    const [mode, expected] of [
      ['Disable', 'disable'],
      ['Prefer', 'prefer'],
      ['Require', 'require'],
      ['VerifyCA', 'verify-ca'],
      ['VerifyFull', 'verify-full'],
      ['vErIfYfUlL', 'verify-full'],
    ]
  ) {
    assertEquals(
      postgres.normalizePostgresConnectionString(`Host=db.example;SSL Mode=${mode}`),
      `postgres://postgres:@db.example:5432/postgres?sslmode=${expected}`,
    );
  }
});

Deno.test('Postgres normalizer refuses unsupported keys with a named typed reason', () => {
  for (
    const key of [
      'Trust Server Certificate',
      'TrustServerCertificate',
      'Root Certificate',
      'SSL Certificate',
      'SSL Key',
      'SSL Password',
      'Application Name',
      'Unknown',
    ]
  ) {
    const error = assertThrows(
      () => postgres.normalizePostgresConnectionString(`Host=localhost;${key}=secret-value`),
      postgres.PostgresConnectionStringError,
    );
    assertEquals(error.name, 'PostgresConnectionStringError');
    assertEquals(error.reason, 'unsupported-key');
    assertEquals(error.key, key.toLowerCase());
    assertEquals(error.message.includes('secret-value'), false);
  }
});

Deno.test('Postgres normalizer refuses unrepresentable values without dropping earlier options', () => {
  for (
    const [key, value] of [
      ['SSL Mode', 'Allow'],
      ['SSL Mode', ''],
      ['SSL Mode', 'arbitrary'],
      ['SSL Mode', 'Allow;SSL Mode=VerifyFull'],
      ['Port', '5432bad'],
      ['Port', '0'],
      ['Port', '65536'],
      ['Port', ''],
      ['Host', 'a,b'],
      ['Host', '/var/run/postgresql'],
      ['Host', 'host/path'],
      ['Host', 'host?sslmode=disable'],
      ['Host', 'user@host'],
      ['Host', 'host:5432'],
      ['Host', '[invalid]'],
      ['Host', ''],
      ['Database', ''],
      ['Database', '..'],
      ['Username', ''],
    ]
  ) {
    const error = assertThrows(
      () => postgres.normalizePostgresConnectionString(`Host=localhost;${key}=${value}`),
      postgres.PostgresConnectionStringError,
    );
    assertEquals(error.reason, 'unsupported-value');
    assertEquals(error.key, key.toLowerCase());
  }
});

Deno.test('Postgres normalizer refuses malformed syntax with a typed reason', () => {
  for (
    const input of [
      '',
      ' ; ',
      'Host',
      '=localhost',
      'Host=x;typo',
      'Host=x;Password="secret',
      'Host=x;Password="secret"trailing',
    ]
  ) {
    const error = assertThrows(
      () => postgres.normalizePostgresConnectionString(input),
      postgres.PostgresConnectionStringError,
    );
    assertEquals(error.reason, 'invalid-format');
    assertEquals(error.key, undefined);
    assertEquals(error.message.includes('secret'), false);
  }
});

Deno.test('Postgres normalizer refuses invalid credential and database encoding with a typed reason', () => {
  for (const key of ['Username', 'Password', 'Database']) {
    for (const value of ['\0', '\uD800']) {
      const error = assertThrows(
        () => postgres.normalizePostgresConnectionString(`Host=localhost;${key}=${value}`),
        postgres.PostgresConnectionStringError,
      );
      assertEquals(error.reason, 'unsupported-value');
      assertEquals(error.key, key.toLowerCase());
    }
  }
});

Deno.test('MSSQL consumes the shared ADO.NET tokenizer for quoted credentials and legacy keys', () => {
  const config = parseAdoNetConnectionString(
    'Data Source=localhost,1433;Initial Catalog=app;UID=sa;PWD="a;""b=c";TrustServerCertificate=True',
  );
  assertEquals(config.server, 'localhost');
  assertEquals(config.port, 1433);
  assertEquals(config.database, 'app');
  assertEquals(config.user, 'sa');
  assertEquals(config.password, 'a;"b=c');
  assertEquals(config.options?.trustServerCertificate, true);
});
