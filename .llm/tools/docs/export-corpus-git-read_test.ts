import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import {
  generatorGitCommand,
  guardGeneratorWrite,
  parseExportCorpusOptions,
} from './export-corpus-git-read.ts';

const root = '/synthetic/repository';
const wrapper = '/synthetic/tools/approved-read';
const clean = { success: true, code: 0, stdout: new Uint8Array(), stderr: new Uint8Array() };

Deno.test('explicit Git delegation composes the exact resolved source guard without raw fallback', async () => {
  const calls: unknown[] = [];
  await guardGeneratorWrite(root, { allowDirty: false, gitReadWrapper: wrapper }, (command) => {
    calls.push(command);
    return Promise.resolve(clean);
  });
  assertEquals(calls, [{
    executable: wrapper,
    args: [root, '--', 'status', '--porcelain', '--', 'packages', 'plugins'],
    cwd: root,
    strict: true,
  }]);
  assertEquals(generatorGitCommand(root), {
    executable: 'git',
    args: ['status', '--porcelain', '--', 'packages', 'plugins'],
    cwd: root,
    strict: false,
  });
});

for (const reason of ['spawn refusal', 'timeout', 'permission refusal']) {
  Deno.test(`approved reader ${reason} fails closed and never invokes fallback`, async () => {
    let calls = 0;
    await assertRejects(
      () =>
        guardGeneratorWrite(root, { allowDirty: false, gitReadWrapper: wrapper }, () => {
          calls++;
          throw new Error(reason);
        }),
      Error,
      'Approved Git read did not confirm',
    );
    assertEquals(calls, 1);
  });
}
Deno.test('approved reader nonzero is refusal rather than unverified success', async () => {
  let calls = 0;
  await assertRejects(
    () =>
      guardGeneratorWrite(root, { allowDirty: false, gitReadWrapper: wrapper }, () => {
        calls++;
        return Promise.resolve({ ...clean, success: false, code: 2 });
      }),
    Error,
    'Approved Git read refused',
  );
  assertEquals(calls, 1);
});
Deno.test('approved read preserves the committed package/plugin guard and rejects bypass', async () => {
  await assertRejects(
    () =>
      guardGeneratorWrite(
        root,
        { allowDirty: false, gitReadWrapper: wrapper },
        () =>
          Promise.resolve({
            ...clean,
            stdout: new TextEncoder().encode(' M packages/example/mod.ts\n'),
          }),
      ),
    Error,
    'read set is dirty',
  );
  await assertRejects(
    () =>
      guardGeneratorWrite(
        root,
        { allowDirty: true, gitReadWrapper: wrapper },
        () => Promise.resolve(clean),
      ),
    Error,
    'cannot be combined',
  );
});
Deno.test('generator flags reject unknown first arguments and ambiguous wrapper/bypass combinations', () => {
  assertEquals(parseExportCorpusOptions([]), {
    check: false,
    allowDirty: false,
    gitReadWrapper: undefined,
  });
  assertEquals(parseExportCorpusOptions(['--git-read-wrapper', wrapper]), {
    check: false,
    allowDirty: false,
    gitReadWrapper: wrapper,
  });
  for (
    const args of [
      ['--unknown'],
      ['--git-read-wrapper'],
      ['--git-read-wrapper', '--check'],
      ['--git-read-wrapper', wrapper, '--git-read-wrapper', wrapper],
      ['--check', '--allow-dirty'],
      ['--git-read-wrapper', wrapper, '--allow-dirty'],
    ]
  ) {
    assertThrows(() => parseExportCorpusOptions(args));
  }
});
