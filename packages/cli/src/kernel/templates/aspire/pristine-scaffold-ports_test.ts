/**
 * @module templates/aspire/pristine-scaffold-ports_test
 *
 * End-to-end regression guard for #952, across the seam the defect crossed: the
 * `appsettings.json` a pristine `netscript init` writes, fed into the register
 * generators that consume it. The unit tests either side of that seam both
 * passed while the defect shipped, because each was asserting its own half.
 *
 * A pristine scaffold must produce an AppHost that pins no host port, so
 * `aspire start --isolated` can place two workspaces on one machine.
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assert, assertEquals } from 'jsr:@std/assert@^1';
import type { AppEntry, NetScriptConfig, ServiceEntry } from '@netscript/aspire/types';
import { generateAppsettings } from './generate-appsettings.ts';
import { generateRegisterServices } from './helpers/register/generate-register-services.ts';
import { generateRegisterApps } from './helpers/register/generate-register-apps.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../application/registries/template-registry.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

const DENO_DEFAULTS = {
  Permissions: ['--allow-net', '--allow-env', '--allow-read', '--allow-sys'],
  WatchMode: false,
};

/** Parses the appsettings a pristine `netscript init` writes. */
function pristineConfig(): NetScriptConfig {
  const parsed = JSON.parse(
    generateAppsettings({
      name: 'alpha-app',
      appName: 'dashboard',
      service: { name: 'users' },
    }),
  ) as { NetScript: NetScriptConfig };
  return parsed.NetScript;
}

describe('pristine scaffold host ports (#952)', () => {
  it('should write no host port for the example service or the app', () => {
    const config = pristineConfig();
    const service = config.Services.users as ServiceEntry;
    const app = config.Apps.dashboard as AppEntry;

    assertEquals(service.HostPort, undefined);
    assertEquals(service.Port, undefined);
    assertEquals(app.HostPort, undefined);
    assertEquals(app.Port, undefined);
  });

  it('should generate a service registration that pins nothing', () => {
    const config = pristineConfig();
    const output = generateRegisterServices({
      services: config.Services,
      version: config.Version,
      denoDefaults: DENO_DEFAULTS,
    });

    assert(
      !output.includes('withHttpEndpoint({ port:'),
      'register-services.mts pinned a host port — `aspire start --isolated` cannot randomise it',
    );
    assert(output.includes(".withHttpEndpoint({ env: 'PORT' })"));
  });

  it('resolves the database resource afresh instead of persisting an allocated endpoint (#1202)', () => {
    const config = pristineConfig();
    const firstAllocation = 'postgres://localhost:50101/alpha';
    const secondAllocation = 'postgres://localhost:50202/alpha';
    const output = generateRegisterServices({
      services: config.Services,
      version: config.Version,
      denoDefaults: DENO_DEFAULTS,
      databaseEngine: 'Postgres',
    });

    assert(output.includes("resource.withEnvironment('DATABASE_URL', infrastructure.primaryDatabase)"));
    assert(output.includes('.withReference(infrastructure.primaryDatabase)'));
    assert(output.includes('.waitFor(infrastructure.primaryDatabase)'));
    assert(!output.includes(firstAllocation));
    assert(!output.includes(secondAllocation));
    assert(!output.includes("getEndpoint('tcp')"));
  });

  it('should generate an app registration that pins nothing but still serves HTTP', () => {
    const config = pristineConfig();
    const output = generateRegisterApps({
      apps: config.Apps,
      version: config.Version,
      denoDefaults: DENO_DEFAULTS,
    });

    assert(!output.includes('withHttpEndpoint({ port:'));
    assert(
      output.includes(".withHttpEndpoint({ env: 'PORT' })"),
      'the app must still get an endpoint — it is a web server',
    );
  });

  it('should still pin when the developer asks for it', () => {
    const parsed = JSON.parse(
      generateAppsettings({
        name: 'alpha-app',
        appName: 'dashboard',
        service: { name: 'users', hostPort: 3005 },
      }),
    ) as { NetScript: NetScriptConfig };

    const output = generateRegisterServices({
      services: parsed.NetScript.Services,
      version: parsed.NetScript.Version,
      denoDefaults: DENO_DEFAULTS,
    });
    assert(output.includes(".withHttpEndpoint({ port: 3005, env: 'PORT' })"));
  });
});
