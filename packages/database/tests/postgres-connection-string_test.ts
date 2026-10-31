import { assertEquals, assertThrows } from '@std/assert';
import * as postgres from '../connection-strings/postgres.ts';
import {
  AdoNetConnectionStringSyntaxError,
  parseAdoNetConnectionString,
} from '../adapters/mssql.adapter.ts';

Deno.test('Postgres normalizer preserves both URI schemes and TLS query bytes', () => {
  for (
    const input of [
      'postgres://app:p%40ss@db.example:5432/app?sslmode=verify-full&sslrootcert=%2Fca.pem',
      'postgresql://app:secret@localhost/app?sslmode=verify-ca#fragment',
      'POSTGRESQL://app:secret@localhost/app?sslmode=require',
      'postgres://app:secret@localhost/app?sslmode=require&sslmode=disable',
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
      'Server=db.example;User ID=app;Password=x=y',
      'postgres://app:x%3Dy@db.example:5432/postgres',
    ],
  ];
  for (const [input, expected] of cases) {
    assertEquals(postgres.normalizePostgresConnectionString(input), expected);
  }
});

Deno.test('Postgres normalizer preserves explicit TLS policies across Npgsql and libpq spellings', () => {
  for (
    const [mode, expected] of [
      ['Disable', 'disable'],
      ['Prefer', 'prefer'],
      ['Require', 'require'],
      ['VerifyCA', 'verify-ca'],
      ['VerifyFull', 'verify-full'],
      ['vErIfYfUlL', 'verify-full'],
      ['verify-ca', 'verify-ca'],
      ['verify-full', 'verify-full'],
      ['VeRiFy-Ca', 'verify-ca'],
      ['VeRiFy-FuLl', 'verify-full'],
    ]
  ) {
    assertEquals(
      postgres.normalizePostgresConnectionString(`Host=db.example;SSL Mode=${mode}`),
      `postgres://postgres:@db.example:5432/postgres?sslmode=${expected}`,
    );
  }
});

Deno.test('Postgres normalizer canonicalizes decimal ports within the valid range', () => {
  for (const [input, expected] of [['05432', '5432'], ['00001', '1'], ['065535', '65535']]) {
    assertEquals(
      postgres.normalizePostgresConnectionString(`Port=${input}`),
      `postgres://postgres:@localhost:${expected}/postgres`,
    );
  }
});

const duplicateSecret = 'sensitive;="\'@/% bytes';
const quotedDuplicateSecret = `"${duplicateSecret.replaceAll('"', '""')}"`;
const duplicateOptions = [
  { key: 'host', aliases: ['Host', 'Server'], values: ['first.example', 'second.example'] },
  { key: 'port', aliases: ['Port'], values: ['5432', '5433'] },
  { key: 'database', aliases: ['Database', 'DB'], values: ['first', 'second'] },
  {
    key: 'username',
    aliases: ['Username', 'User ID', 'User Name', 'UserId', 'UID'],
    values: ['first', 'second'],
  },
  {
    key: 'password',
    aliases: ['Password', 'Pwd', 'PSW'],
    values: [quotedDuplicateSecret, 'other'],
  },
  { key: 'sslmode', aliases: ['SSL Mode', 'SslMode'], values: ['Require', 'Disable'] },
];

// Every accepted spelling is crossed with every alias in both orders, including itself.
for (const { key, aliases, values } of duplicateOptions) {
  for (const first of aliases) {
    for (const second of aliases) {
      for (const casing of ['original', 'case-variant']) {
        for (const repeated of [true, false]) {
          const secondKey = casing === 'original' ? second : second.toUpperCase();
          Deno.test(`Postgres duplicate refusal: ${first}/${second} ${casing} identical=${repeated}`, () => {
            const credentials = key === 'password' ? '' : `Password=${quotedDuplicateSecret};`;
            const input = `${credentials}${first}=${values[0]};${secondKey}=${
              values[repeated ? 0 : 1]
            }`;
            assertDuplicateRefusal(input, key);
          });
        }
      }
    }
  }
}

for (
  const [name, input, key] of [
    ['TLS downgrade', 'Host=h;SSL Mode=Require;SslMode=Disable', 'sslmode'],
    ['trimmed aliases', ' Host =h; SeRvEr =other', 'host'],
    ['empty password', 'Password=;Pwd=', 'password'],
    ['invalid second TLS mode', 'SSL Mode=Require;SslMode=Allow', 'sslmode'],
    ['invalid second port', 'Port=5432;Port=bad', 'port'],
    ['quoted single escape', "Password='a;''b=c';Pwd=other", 'password'],
    ['quoted double escape', 'Password="a;""b=c";Pwd=other', 'password'],
  ]
) {
  Deno.test(`Postgres duplicate refusal: ${name}`, () => assertDuplicateRefusal(input, key));
}

/** Check the complete refusal surface so logging or serializing it cannot reveal values. */
function assertDuplicateRefusal(input: string, key: string): void {
  const error = assertThrows(
    () => postgres.normalizePostgresConnectionString(input),
    postgres.PostgresConnectionStringError,
  );
  assertEquals(error.name, 'PostgresConnectionStringError');
  assertEquals(error.reason, 'duplicate-key');
  assertEquals(error.key, key);
  assertEquals(error.message, 'Cannot normalize PostgreSQL connection string: duplicate-key.');
  assertEquals(error.cause, undefined);
  const diagnostics = [error.message, error.stack, String(error), JSON.stringify(error)].join('\n');
  for (const secret of [duplicateSecret, encodeURIComponent(duplicateSecret), "a;'b=c", 'a;"b=c']) {
    assertEquals(diagnostics.includes(secret), false);
  }
  assertEquals(diagnostics.includes(input), false);
}

Deno.test('Postgres normalizer keeps option-like text inside quoted values', () => {
  assertEquals(
    postgres.normalizePostgresConnectionString(
      'Host=h;Password="secret;Host=other;SSL Mode=Disable;""quoted""";SSL Mode=Require',
    ),
    'postgres://postgres:secret%3BHost%3Dother%3BSSL%20Mode%3DDisable%3B%22quoted%22@h:5432/postgres?sslmode=require',
  );
});

Deno.test('Postgres normalizer supports Npgsql aliases and bare IPv6 without loading a driver', async () => {
  for (const userKey of ['User Name', 'UserId']) {
    assertEquals(
      postgres.normalizePostgresConnectionString(`Host=::1;${userKey}=app;PSW=secret;DB=app`),
      'postgres://app:secret@[::1]:5432/app',
    );
  }
  const result = await new Deno.Command('deno', {
    args: [
      'info',
      '--no-config',
      '--no-lock',
      '--no-remote',
      '--no-npm',
      new URL('../connection-strings/postgres.ts', import.meta.url).href,
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
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
      () =>
        postgres.normalizePostgresConnectionString(
          `${key === 'Host' ? '' : 'Host=localhost;'}${key}=${value}`,
        ),
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

Deno.test('MSSQL malformed inputs throw the exported credential-safe syntax error', () => {
  for (const input of ['Host', 'Server=x;Password="secret', 'Server=x;Password="secret"bad']) {
    const error = assertThrows(
      () => parseAdoNetConnectionString(input),
      AdoNetConnectionStringSyntaxError,
    );
    assertEquals(error.name, 'AdoNetConnectionStringSyntaxError');
    assertEquals(error.message.includes('secret'), false);
  }
});
