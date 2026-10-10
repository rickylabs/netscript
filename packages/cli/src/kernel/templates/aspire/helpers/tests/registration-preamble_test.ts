/**
 * @module templates/aspire/helpers/registration-preamble_test
 *
 * Pins the registration preamble contract: a fully wired entry set renders the
 * complete preamble unchanged, and each unread piece is dropped on its own.
 */

import { assertEquals } from 'jsr:@std/assert@^1';
import {
  renderRegistrationPreamble,
  resolveRegistrationPreambleNeeds,
} from '../register/registration-preamble.ts';

const IMPORTS = { sdkModule: '../.aspire/modules/aspire.mts', cacheImport: 'withCacheReference' };

Deno.test('registration preamble: a fully wired entry set renders the complete preamble', () => {
  const needs = resolveRegistrationPreambleNeeds([{ RequiresDb: true, RequiresKv: true }], true);

  assertEquals(renderRegistrationPreamble(needs, IMPORTS), {
    otlpImport: "import { OtlpProtocol } from '../.aspire/modules/aspire.mts';\n",
    compatImports: [
      '  buildDatabaseUriEnvKey,',
      '  buildDatabaseProviderEnvVars,',
      '  buildSqliteDatabaseUrl,',
      '  buildOtelEnvVars,',
      '  resolvePermissions,',
      '  resolveWorkspacePath,',
      '  withCacheReference,',
    ].join('\n'),
    infrastructureParameter: 'infrastructure',
    databaseBindings: '  const databaseEnvKey = buildDatabaseUriEnvKey(config);\n' +
      '  const databaseProviderEnv = buildDatabaseProviderEnvVars(config);\n',
  });
});

Deno.test('registration preamble: unread pieces are omitted', () => {
  const needs = resolveRegistrationPreambleNeeds([{ RequiresDb: false, RequiresKv: false }], false);

  assertEquals(renderRegistrationPreamble(needs, IMPORTS), {
    otlpImport: '',
    compatImports: '  resolvePermissions,\n  resolveWorkspacePath,',
    infrastructureParameter: '_infrastructure',
    databaseBindings: '',
  });
});

Deno.test('registration preamble: database and cache needs are derived independently', () => {
  assertEquals(
    resolveRegistrationPreambleNeeds([{ RequiresDb: true }, { RequiresKv: false }], false),
    { database: true, telemetry: false, cache: false },
  );
  const cacheOnly = resolveRegistrationPreambleNeeds([{ RequiresKv: true }], true);
  assertEquals(cacheOnly, { database: false, telemetry: true, cache: true });
  assertEquals(
    renderRegistrationPreamble(cacheOnly, IMPORTS).infrastructureParameter,
    'infrastructure',
  );
});
