/**
 * @module templates/aspire/generate-aspire-config_test
 */

import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { describe, it } from 'jsr:@std/testing@^1/bdd';

import { generateTsAspireConfig } from './generate-aspire-config.ts';

describe('generateTsAspireConfig', () => {
  it('configures the Aspire dashboard OTLP HTTP endpoint for Deno exporters', () => {
    const config = JSON.parse(generateTsAspireConfig()) as {
      profiles: {
        https: {
          environmentVariables: Record<string, string>;
        };
      };
    };

    assertEquals(
      config.profiles.https.environmentVariables.ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL,
      'http://localhost:4318',
    );
    assertEquals(
      config.profiles.https.environmentVariables.ASPIRE_ALLOW_UNSECURED_TRANSPORT,
      'true',
    );
    assertEquals(
      config.profiles.https.environmentVariables.ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS,
      'true',
    );
    assert(!('ASPIRE_DASHBOARD_OTLP_ENDPOINT_URL' in config.profiles.https.environmentVariables));
  });

  it('includes all required DB integration packages for multi-engine projects', () => {
    const config = JSON.parse(generateTsAspireConfig({
      dbEngines: ['postgres', 'mysql', 'mssql', 'sqlite'],
    })) as {
      packages?: Record<string, string>;
    };

    assert(config.packages);
    assertEquals(config.packages['Aspire.Hosting.PostgreSQL'], '13.2.2');
    assertEquals(config.packages['Aspire.Hosting.MySql'], '13.2.2');
    assertEquals(config.packages['Aspire.Hosting.SqlServer'], '13.2.2');
    assert(!('sqlite' in config.packages));
  });
});
