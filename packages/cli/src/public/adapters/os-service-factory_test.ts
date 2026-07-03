import { assertEquals } from 'jsr:@std/assert@^1';
import { assertInstanceOf } from 'jsr:@std/assert@^1';

import type { ProcessPort } from '../../kernel/ports/process-port.ts';
import { detectServiceOs, fullServiceNameForOs } from '../../kernel/adapters/deploy/runtime-detect.ts';
import { createOsServicePort } from './os-service-factory.ts';
import { ServyOsServiceAdapter } from './servy-os-service.ts';
import { SystemdOsServiceAdapter } from './systemd-os-service.ts';

// OS-routing e2e-lite (F-DEPLOY-2): the OS decision (`detectServiceOs`), the
// OS-appropriate naming (`fullServiceNameForOs`), and the port construction
// (`createOsServicePort`) must agree — Windows routes to the servy adapter and
// systemd naming stays out of it; Linux routes to the systemd adapter.

const stubProcess: ProcessPort = {
  exec: () => Promise.resolve({ code: 0, stdout: '', stderr: '' }),
};

Deno.test('createOsServicePort routes windows to the servy adapter', () => {
  const port = createOsServicePort('windows', { process: stubProcess });
  assertInstanceOf(port, ServyOsServiceAdapter);
});

Deno.test('createOsServicePort routes linux to the systemd adapter', () => {
  const port = createOsServicePort('linux', { process: stubProcess });
  assertInstanceOf(port, SystemdOsServiceAdapter);
});

Deno.test('OS routing is coherent from explicit OS → naming → adapter', () => {
  const cases = [
    { os: 'windows', name: 'NetScript.orders', adapter: ServyOsServiceAdapter },
    { os: 'linux', name: 'netscript-orders.service', adapter: SystemdOsServiceAdapter },
  ] as const;

  for (const { os, name, adapter } of cases) {
    // The explicit OS wins over the host, so this test is host-independent.
    assertEquals(detectServiceOs(os), os);
    assertEquals(fullServiceNameForOs(os, 'orders'), name);
    assertInstanceOf(createOsServicePort(os, { process: stubProcess }), adapter);
  }
});
