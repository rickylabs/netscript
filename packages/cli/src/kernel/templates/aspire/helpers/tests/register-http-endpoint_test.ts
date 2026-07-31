/**
 * @module templates/aspire/helpers/register-http-endpoint_test
 *
 * Regression guard for #952 — a pinned Aspire **host** port cannot be
 * randomised by `aspire start --isolated`, so two workspaces scaffolded from
 * the same template collide by construction. These tests assert the *absence*
 * of a pin on the paths `netscript init` produces, and the presence of one only
 * where a config entry opts in.
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { generateRegisterServices } from '../register/generate-register-services.ts';
import { generateRegisterPlugins } from '../register/generate-register-plugins.ts';
import { generateRegisterApps } from '../register/generate-register-apps.ts';
import {
  renderHttpEndpointCall,
  renderHttpEndpointOptions,
  resolveHostPort,
} from '../register/render-http-endpoint.ts';
import * as fixtures from './generators-test-support.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

const serviceOptions = {
  services: {},
  version: '1.0.0',
  denoDefaults: fixtures.MINIMAL_DENO_DEFAULTS,
};

const pluginOptions = {
  plugins: {},
  version: '1.0.0',
  denoDefaults: fixtures.MINIMAL_DENO_DEFAULTS,
};

const appOptions = {
  apps: {},
  version: '1.0.0',
  denoDefaults: fixtures.MINIMAL_DENO_DEFAULTS,
};

describe('resolveHostPort', () => {
  it('should return undefined when the entry pins nothing', () => {
    assertEquals(resolveHostPort({}), undefined);
  });

  it('should prefer HostPort over the deprecated Port alias', () => {
    assertEquals(resolveHostPort({ HostPort: 3005, Port: 3000 }), 3005);
  });

  it('should still read the deprecated Port alias so existing configs keep working', () => {
    assertEquals(resolveHostPort({ Port: 3000 }), 3000);
  });
});

describe('renderHttpEndpointOptions', () => {
  it('should omit port entirely when nothing is pinned', () => {
    assertEquals(renderHttpEndpointOptions({}), "{ env: 'PORT' }");
  });

  it('should emit the pinned host port when one is configured', () => {
    assertEquals(renderHttpEndpointOptions({ HostPort: 3005 }), "{ port: 3005, env: 'PORT' }");
  });

  it('should always name the PORT env var so the process learns its target port', () => {
    assertStringIncludes(renderHttpEndpointCall({}), "env: 'PORT'");
    assertStringIncludes(renderHttpEndpointCall({ HostPort: 8080 }), "env: 'PORT'");
  });
});

describe('generateRegisterServices host ports', () => {
  it('should pin no host port for a service that configures none', () => {
    const output = generateRegisterServices({
      ...serviceOptions,
      services: { users: fixtures.UNPINNED_SERVICE },
    });
    assertStringIncludes(output, ".withHttpEndpoint({ env: 'PORT' });");
    assert(
      !output.includes('withHttpEndpoint({ port:'),
      'a scaffolded service must not pin a host port — it defeats `aspire start --isolated`',
    );
  });

  it('should pin the host port a service opts into via HostPort', () => {
    const output = generateRegisterServices({
      ...serviceOptions,
      services: { users: fixtures.HOST_PINNED_SERVICE },
    });
    assertStringIncludes(output, ".withHttpEndpoint({ port: 3005, env: 'PORT' });");
  });

  it('should keep honouring the deprecated Port alias unchanged', () => {
    const output = generateRegisterServices({
      ...serviceOptions,
      services: { users: fixtures.MINIMAL_SERVICE },
    });
    assertStringIncludes(output, ".withHttpEndpoint({ port: 3000, env: 'PORT' });");
  });

  it('should wire cross-references through getEndpoint regardless of pinning', () => {
    const output = generateRegisterServices({
      ...serviceOptions,
      services: { users: fixtures.UNPINNED_SERVICE, orders: fixtures.SERVICE_WITH_REFS },
    });
    assertStringIncludes(output, "getEndpoint('http')");
  });
});

describe('generateRegisterPlugins host ports', () => {
  it('should pin no host port for a plugin that configures none', () => {
    const output = generateRegisterPlugins({
      ...pluginOptions,
      plugins: { auth: fixtures.UNPINNED_PLUGIN },
    });
    assertStringIncludes(output, ".withHttpEndpoint({ env: 'PORT' });");
    assert(!output.includes('withHttpEndpoint({ port:'));
  });

  it('should keep honouring a configured plugin port', () => {
    const output = generateRegisterPlugins({
      ...pluginOptions,
      plugins: { auth: fixtures.MINIMAL_PLUGIN },
    });
    assertStringIncludes(output, ".withHttpEndpoint({ port: 4400, env: 'PORT' });");
  });
});

describe('generateRegisterApps host ports', () => {
  it('should still register an endpoint for a web app that pins no host port', () => {
    const output = generateRegisterApps({
      ...appOptions,
      apps: { frontend: fixtures.UNPINNED_APP },
    });
    assertStringIncludes(output, ".withHttpEndpoint({ env: 'PORT' });");
    assert(
      !output.includes('withHttpEndpoint({ port:'),
      'a scaffolded app must not pin a host port',
    );
  });

  it('should keep honouring a configured app port', () => {
    const output = generateRegisterApps({
      ...appOptions,
      apps: { frontend: fixtures.MINIMAL_APP },
    });
    assertStringIncludes(output, ".withHttpEndpoint({ port: 8000, env: 'PORT' });");
  });

  it('should leave a portless task app without an HTTP endpoint, as before', () => {
    const output = generateRegisterApps({
      ...appOptions,
      apps: { seed: fixtures.UNPINNED_TASK_APP },
    });
    assert(!output.includes('withHttpEndpoint('));
  });
});
