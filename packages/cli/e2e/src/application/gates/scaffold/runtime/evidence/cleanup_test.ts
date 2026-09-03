import { assertEquals } from '@std/assert';

import { inspectAllContainers } from './cleanup.ts';

Deno.test('a container removed between docker list and inspect is already removed', async () => {
  const id = '7ab8913455fa';
  const calls: string[] = [];

  const containers = await inspectAllContainers((command, args) => {
    calls.push([command, ...args].join(' '));
    if (args[0] === 'ps') {
      return Promise.resolve({ code: 0, stdout: `${id}\n`, stderr: '' });
    }
    return Promise.resolve({
      code: 1,
      stdout: '',
      stderr: `Error: No such object: ${id}\n`,
    });
  });

  assertEquals(containers, []);
  assertEquals(calls, ['docker ps -aq', `docker inspect ${id}`]);
});
