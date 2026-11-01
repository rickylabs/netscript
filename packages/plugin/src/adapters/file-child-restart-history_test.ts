import { assertEquals, assertThrows } from '@std/assert';
import { FileChildRestartHistory } from './file-child-restart-history.ts';
import type { ChildRestartHistory } from '../domain/child-health.ts';

const RECORD: ChildRestartHistory = {
  active: true,
  failed: true,
  processId: 1,
  restartCount: 3,
  restarts: [10, 20, 30],
  crashLooping: true,
};

Deno.test('file history survives adapter replacement and ignores interrupted temporary writes', async () => {
  const root = await Deno.makeTempDir();
  const path = `${root}/nested/child.json`;
  try {
    const history = new FileChildRestartHistory(path);
    assertEquals(history.read(), undefined);
    history.write(RECORD);
    await Deno.writeTextFile(`${path}.tmp`, '{');
    // A stale replacement can come from an earlier run with a less restrictive umask.
    if (Deno.build.os !== 'windows') await Deno.chmod(`${path}.tmp`, 0o644);
    const replacement = new FileChildRestartHistory(path);
    const record = replacement.read();
    assertEquals(record?.restartCount, 3);
    assertEquals(record?.restarts, RECORD.restarts);
    assertEquals(record?.failed, true);
    replacement.write({ ...RECORD, failed: false });
    assertEquals(history.read()?.failed, false);
    if (Deno.build.os !== 'windows') assertEquals((await Deno.stat(path)).mode! & 0o777, 0o600);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('invalid, oversized and unwritable histories fail closed', async () => {
  const root = await Deno.makeTempDir();
  const path = `${root}/child.json`;
  try {
    const history = new FileChildRestartHistory(path);
    for (
      const invalid of [
        '{',
        '{}',
        JSON.stringify({ ...RECORD, version: 2 }),
        JSON.stringify({ ...RECORD, version: 1, restartCount: -1 }),
        JSON.stringify({ ...RECORD, version: 1, secret: 'should-not-be-stored' }),
      ]
    ) {
      await Deno.writeTextFile(path, invalid);
      assertThrows(() => history.read());
    }
    await Deno.writeTextFile(path, ' '.repeat(1_048_577));
    assertThrows(() => history.read(), Error, 'too large');
    assertThrows(() => new FileChildRestartHistory(`${path}/child.json`).write(RECORD));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
