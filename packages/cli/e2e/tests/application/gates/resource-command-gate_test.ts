import { assertEquals } from '@std/assert';
import { resourceCommandContract } from '../../../src/application/gates/scaffold/runtime/resource-command-gate.ts';

Deno.test('resource-command gate owns typed db command background restart describe and skip receipt', () => {
  assertEquals(resourceCommandContract(), {
    id: 'runtime.resource-command',
    typedDatabase: ['resource', '<db>-cli', 'migrate', '--timeout', '60'],
    background: [
      ['resource', 'workers', 'restart'],
      ['resource', 'sagas', 'restart'],
      ['resource', 'triggers', 'restart'],
    ],
    describe: ['describe', '--follow', '--format', 'Json'],
    skipWhenStartReceiptAbsent: true,
  });
});
