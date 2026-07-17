import { assertEquals, assertThrows } from '@std/assert';
import { OPENCODE_TOOL } from '../config/versions.ts';
import {
  assertProtectedWebExposure,
  isLoopbackHostname,
  opencodeWebArguments,
} from './opencode-web.ts';

Deno.test('OpenCode web argv carries configured host, port, discovery, and repeated CORS', () => {
  assertEquals(
    opencodeWebArguments({
      hostname: 'host.test',
      port: 4096,
      mdns: true,
      mdnsDomain: 'agent.test',
      cors: ['https://one.test', 'https://two.test'],
    }),
    [
      'web',
      '--hostname',
      'host.test',
      '--port',
      '4096',
      '--mdns',
      '--mdns-domain',
      'agent.test',
      '--cors',
      'https://one.test',
      '--cors',
      'https://two.test',
    ],
  );
});

Deno.test('OpenCode web recognizes only explicit loopback hostnames', () => {
  assertEquals(isLoopbackHostname(OPENCODE_TOOL.webDefaultHostname), true);
  assertEquals(isLoopbackHostname('localhost'), true);
  assertEquals(isLoopbackHostname('::1'), true);
  assertEquals(isLoopbackHostname('0.0.0.0'), false);
});

Deno.test('OpenCode web requires a password for LAN or mDNS exposure', () => {
  assertThrows(
    () => assertProtectedWebExposure({ hostname: '0.0.0.0', port: 0 }, {}),
    Error,
    'OPENCODE_SERVER_PASSWORD',
  );
  assertThrows(
    () =>
      assertProtectedWebExposure({
        hostname: OPENCODE_TOOL.webDefaultHostname,
        port: 0,
        mdns: true,
      }, {}),
    Error,
    'OPENCODE_SERVER_PASSWORD',
  );
});

Deno.test('OpenCode web permits protected remote exposure and local loopback', () => {
  assertProtectedWebExposure(
    { hostname: '0.0.0.0', port: 0, mdns: true },
    { OPENCODE_SERVER_PASSWORD: 'opaque' },
  );
  assertProtectedWebExposure({ hostname: OPENCODE_TOOL.webDefaultHostname, port: 0 }, {});
});
