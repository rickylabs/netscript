import { assertEquals } from 'jsr:@std/assert@^1';
import type { DeployConfig } from '@netscript/config';

import { resolveDenoDeployTarget } from './deploy-config-resolvers.ts';

Deno.test('resolveDenoDeployTarget: empty config defaults prod to false with no fields', () => {
  assertEquals(resolveDenoDeployTarget(undefined), {
    org: undefined,
    app: undefined,
    prod: false,
    entrypoint: undefined,
    envFile: undefined,
  });
});

Deno.test('resolveDenoDeployTarget: reads deploy.targets[deno-deploy] from config', () => {
  const deploy = {
    targets: {
      'deno-deploy': {
        org: 'acme',
        app: 'orders',
        prod: true,
        entrypoint: 'main.ts',
        envFile: '.env.production',
      },
    },
  } as unknown as DeployConfig;

  assertEquals(resolveDenoDeployTarget(deploy), {
    org: 'acme',
    app: 'orders',
    prod: true,
    entrypoint: 'main.ts',
    envFile: '.env.production',
  });
});

Deno.test('resolveDenoDeployTarget: CLI flag overrides win over config', () => {
  const deploy = {
    targets: {
      'deno-deploy': { org: 'acme', app: 'orders', prod: false },
    },
  } as unknown as DeployConfig;

  assertEquals(
    resolveDenoDeployTarget(deploy, { app: 'orders-staging', prod: true }),
    {
      org: 'acme',
      app: 'orders-staging',
      prod: true,
      entrypoint: undefined,
      envFile: undefined,
    },
  );
});

Deno.test('resolveDenoDeployTarget: flags alone work with no config section', () => {
  assertEquals(
    resolveDenoDeployTarget(undefined, { org: 'acme', app: 'orders' }),
    {
      org: 'acme',
      app: 'orders',
      prod: false,
      entrypoint: undefined,
      envFile: undefined,
    },
  );
});
