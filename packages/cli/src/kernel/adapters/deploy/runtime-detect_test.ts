import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals } from 'jsr:@std/assert@^1';

import {
  detectServiceOs,
  fullServiceNameForOs,
  serviceConfigFileName,
  serviceConfigPath,
} from './runtime-detect.ts';

describe('deploy runtime-detect', () => {
  it('honors an explicit OS over the host', () => {
    assertEquals(detectServiceOs('windows'), 'windows');
    assertEquals(detectServiceOs('linux'), 'linux');
  });

  it('falls back to the host OS when none is given', () => {
    const expected = Deno.build.os === 'windows' ? 'windows' : 'linux';
    assertEquals(detectServiceOs(), expected);
  });

  it('builds OS-appropriate full service names', () => {
    assertEquals(fullServiceNameForOs('windows', 'orders'), 'NetScript.orders');
    assertEquals(fullServiceNameForOs('linux', 'orders'), 'netscript-orders.service');
  });

  it('builds OS-appropriate config file names', () => {
    assertEquals(serviceConfigFileName('windows', 'orders'), 'orders.xml');
    assertEquals(serviceConfigFileName('linux', 'orders'), 'orders.service');
  });

  it('joins config paths per OS', () => {
    assertEquals(
      serviceConfigPath('windows', '/install/config', 'orders').replaceAll('\\', '/'),
      '/install/config/orders.xml',
    );
    assertEquals(
      serviceConfigPath('linux', '/install/config', 'orders').replaceAll('\\', '/'),
      '/install/config/orders.service',
    );
  });
});
