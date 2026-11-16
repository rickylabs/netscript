import { assertEquals, assertRejects } from '@std/assert';

import { inspectAllContainers } from './cleanup.ts';

Deno.test('a container removed between docker list and inspect is already removed', async () => {
  const id = '7ab8913455fa';
  const calls: string[][] = [];

  const inspection = await inspectAllContainers((command, args) => {
    calls.push([command, ...args]);
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
  assertEquals(calls, [['docker', 'ps', '-aq'], ['docker', 'inspect', id]]);
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

Deno.test('native lowercase vanished-object errors preserve stderr precedence and later survivors', async () => {
  const missing = '4a29f3bc7954';
  const survivor = { Id: 'ab1234567890', State: { Running: true } };
  const result = await inspectAllContainers((_command, args) =>
    Promise.resolve(
      args[0] === 'ps'
        ? { code: 0, stdout: `${missing}\n${survivor.Id}\n`, stderr: '' }
        : args[1] === missing
        ? { code: 1, stdout: '[]\n', stderr: `error: no such object: ${missing}\n` }
        : { code: 0, stdout: JSON.stringify([survivor]), stderr: '' },
    )
  );
  assertEquals(result, { containers: [survivor], vanishedContainerIds: [missing] });
});

Deno.test('removal diagnostics must identify exactly this object on every nonempty line', async () => {
  const id = '7ab8913455fa';
  for (
    const failure of [
      `Error: No such object: ${id}\npermission denied\n`,
      `warning: No such object: ${id}\n`,
      `Error: No such object: ${id}0\n`,
      `Error: No such object: x${id}\n`,
      'Error: No such object: different\n',
      'permission denied\n',
      'daemon unavailable\n',
      '',
    ]
  ) {
    await assertRejects(
      () =>
        inspectAllContainers((_command, args) =>
          Promise.resolve(
            args[0] === 'ps'
              ? { code: 0, stdout: id, stderr: '' }
              : { code: 1, stdout: '', stderr: failure },
          )
        ),
      Error,
      `docker inspect ${id} failed`,
    );
  }
});

Deno.test('successful inspections still require valid array JSON', async () => {
  for (const text of ['{', '{}']) {
    await assertRejects(() =>
      inspectAllContainers((_command, args) =>
        Promise.resolve(
          { code: 0, stdout: args[0] === 'ps' ? '7ab8913455fa' : text, stderr: '' },
        )
      )
    );
  }
});
