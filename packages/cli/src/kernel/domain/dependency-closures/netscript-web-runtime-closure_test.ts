import { assertEquals, assertStringIncludes, assertThrows } from 'jsr:@std/assert@^1';
import {
  assertCoherentNetScriptWebRuntimeImports,
  NETSCRIPT_WEB_RUNTIME_EXPORTS,
  netScriptWebRuntimeSpecifiers,
} from './netscript-web-runtime-closure.ts';
import { NETSCRIPT_RELEASE_VERSION } from '../../constants/jsr-specifiers.ts';

const CANARY_VERSION = '0.0.6-canary.3';

function jsr(packageName: string, version: string, subpath = ''): string {
  return `jsr:@netscript/${packageName}@${version}${subpath}`;
}

Deno.test('accepts coherent exact stable and canary closures', () => {
  for (const version of [NETSCRIPT_RELEASE_VERSION, CANARY_VERSION]) {
    assertCoherentNetScriptWebRuntimeImports({
      '@netscript/fresh': jsr('fresh', version),
      '@netscript/fresh/defer/island': jsr('fresh', version, '/defer/island'),
      '@netscript/sdk': jsr('sdk', version),
      '@netscript/sdk/query': jsr('sdk', version, '/query'),
      '@netscript/telemetry': jsr('telemetry', version),
    });
  }
});

Deno.test('rejects a split root and subpath with every involved version', () => {
  const error = assertThrows(
    () =>
      assertCoherentNetScriptWebRuntimeImports({
        '@netscript/fresh': jsr('fresh', NETSCRIPT_RELEASE_VERSION),
        '@netscript/fresh/defer/island': jsr('fresh', CANARY_VERSION, '/defer/island'),
        '@netscript/sdk': jsr('sdk', NETSCRIPT_RELEASE_VERSION),
      }),
    Error,
    'NetScript dependency closure is incoherent.',
  );
  assertStringIncludes(error.message, '@netscript/fresh@0.0.5');
  assertStringIncludes(error.message, '@netscript/fresh@0.0.6-canary.3/defer/island');
  assertStringIncludes(error.message, 'different exact versions: 0.0.5, 0.0.6-canary.3');
});

Deno.test('fails closed on a non-exact closure member', () => {
  const error = assertThrows(
    () =>
      assertCoherentNetScriptWebRuntimeImports({
        '@netscript/fresh': jsr('fresh', `^${NETSCRIPT_RELEASE_VERSION}`),
        '@netscript/sdk': jsr('sdk', NETSCRIPT_RELEASE_VERSION),
      }),
    Error,
  );
  assertStringIncludes(error.message, '@netscript/fresh uses non-exact version "^0.0.5"');
  assertStringIncludes(error.message, 'pin this member exactly');
});

Deno.test('accepts a coherent local closure and rejects a mixed origin', () => {
  assertCoherentNetScriptWebRuntimeImports({
    '@netscript/fresh': '../../packages/fresh/mod.ts',
    '@netscript/fresh/defer/island': '../../packages/fresh/src/application/defer/island.ts',
    '@netscript/sdk': '../../packages/sdk/mod.ts',
  });
  const error = assertThrows(
    () =>
      assertCoherentNetScriptWebRuntimeImports({
        '@netscript/fresh': '../../packages/fresh/mod.ts',
        '@netscript/sdk': jsr('sdk', NETSCRIPT_RELEASE_VERSION),
      }),
    Error,
  );
  assertStringIncludes(error.message, 'mix local and JSR module identities');
});

Deno.test('closure export lists stay in parity with Fresh and SDK manifests', async () => {
  const fresh = JSON.parse(
    await Deno.readTextFile(new URL('../../../../../fresh/deno.json', import.meta.url)),
  );
  const sdk = JSON.parse(
    await Deno.readTextFile(new URL('../../../../../sdk/deno.json', import.meta.url)),
  );
  assertEquals(Object.keys(fresh.exports), [...NETSCRIPT_WEB_RUNTIME_EXPORTS['@netscript/fresh']]);
  assertEquals(Object.keys(sdk.exports), [...NETSCRIPT_WEB_RUNTIME_EXPORTS['@netscript/sdk']]);
});

Deno.test('fresh-ui is intentionally outside the cache-provider closure', () => {
  const specifiers = netScriptWebRuntimeSpecifiers();
  assertEquals(specifiers.some((specifier) => specifier.startsWith('@netscript/fresh-ui')), false);
});
