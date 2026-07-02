/**
 * @module templates/aspire/generate-aspire-config_test
 */

import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { describe, it } from 'jsr:@std/testing@^1/bdd';

import { generateTsAspireConfig } from './generate-aspire-config.ts';

describe('generateTsAspireConfig', () => {
  it('lets Aspire choose per-process dashboard and telemetry ports', () => {
    const config = JSON.parse(generateTsAspireConfig()) as {
      profiles: {
        https: {
          applicationUrl: string;
          environmentVariables: Record<string, string>;
        };
      };
    };

    assertEquals(config.profiles.https.applicationUrl, 'https://localhost:0;http://localhost:0');
    assertEquals(
      config.profiles.https.environmentVariables.ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL,
      'http://localhost:0',
    );
    assertEquals(
      config.profiles.https.environmentVariables.ASPIRE_RESOURCE_SERVICE_ENDPOINT_URL,
      'https://localhost:0',
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

  it('does not pin the profile to the base Aspire infra ports', () => {
    const config = JSON.parse(generateTsAspireConfig()) as {
      profiles: {
        https: {
          applicationUrl: string;
          environmentVariables: Record<string, string>;
        };
      };
    };
    const profile = config.profiles.https;
    const values = [
      profile.applicationUrl,
      profile.environmentVariables.ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL,
      profile.environmentVariables.ASPIRE_RESOURCE_SERVICE_ENDPOINT_URL,
    ].join(';');

    assert(!values.includes(':18888'));
    assert(!values.includes(':4318'));
    assert(!values.includes(':18891'));
  });

  it('includes all required DB integration packages for multi-engine projects', () => {
    const config = JSON.parse(generateTsAspireConfig({
      dbEngines: ['postgres', 'mysql', 'mssql', 'sqlite'],
    })) as {
      packages?: Record<string, string>;
    };

    assert(config.packages);
    assertEquals(config.packages['Aspire.Hosting.PostgreSQL'], '13.4.6');
    assertEquals(config.packages['Aspire.Hosting.MySql'], '13.4.6');
    assertEquals(config.packages['Aspire.Hosting.SqlServer'], '13.4.6');
    assert(!('sqlite' in config.packages));
  });

  it('includes the browser logs integration package by default', () => {
    const config = JSON.parse(generateTsAspireConfig()) as {
      packages?: Record<string, string>;
    };

    assert(config.packages);
    assertEquals(
      config.packages['Aspire.Hosting.Browsers'],
      '13.4.6-preview.1.26319.6',
    );
  });
});
