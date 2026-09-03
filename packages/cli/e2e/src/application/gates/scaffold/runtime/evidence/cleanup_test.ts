import { assertEquals, assertRejects } from '@std/assert';

import { inspectAllContainers } from './cleanup.ts';

Deno.test('a container removed between docker list and inspect is already removed', async () => {
  const id = '7ab8913455fa';
  const calls: string[] = [];

  const inspection = await inspectAllContainers((command, args) => {
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

  assertEquals(inspection, { containers: [], vanishedContainerIds: [id] });
  assertEquals(calls, ['docker ps -aq', `docker inspect ${id}`]);
});

Deno.test('an inspect failure other than same-id removal still fails cleanup', async () => {
  const id = '7ab8913455fa';

  await assertRejects(
    () =>
      inspectAllContainers((_command, args) =>
        Promise.resolve(
          args[0] === 'ps'
            ? { code: 0, stdout: `${id}\n`, stderr: '' }
            : { code: 1, stdout: '', stderr: 'permission denied\n' },
        )
      ),
    Error,
    `docker inspect ${id} failed (1): permission denied`,
  );
});
