import { assert, assertEquals, assertRejects } from '@std/assert';
import { createStorageHealthCheck, describeStorageDurability } from './durability.ts';

Deno.test('storage: unset is explicitly ephemeral and cannot claim durability', async () => {
  const info = await describeStorageDurability(undefined);
  assertEquals(info.mode, 'memory');
  assertEquals(info.durable, false);
  assertEquals(info.probe, 'not-applicable');
  assertEquals((await createStorageHealthCheck(info).check()).storage, info);
});

Deno.test('storage: file mode is reported only after an executed write/read probe', async () => {
  const dir = await Deno.makeTempDir();
  try {
    const info = await describeStorageDurability(dir);
    assertEquals(info.mode, 'file');
    assertEquals(info.durable, true);
    assertEquals(info.probe, 'passed');
    assertEquals(info.dataDir, dir);
    assertEquals(Array.from(Deno.readDirSync(dir)), []);
    const health = await createStorageHealthCheck(info).check();
    assertEquals(health.storage.mode, 'file');
    assertEquals(health.storage.dataDir, undefined);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test('storage: empty, missing and non-directory opt-ins fail without claiming file mode', async () => {
  await assertRejects(() => describeStorageDurability('   '));
  const dir = await Deno.makeTempDir();
  try {
    const missing = await assertRejects(
      () => describeStorageDurability(`${dir}/missing`),
      Error,
      'STREAMS_DATA_DIR must name an existing directory.',
    );
    assert(missing.cause instanceof Deno.errors.NotFound);
    await Deno.writeTextFile(`${dir}/file`, 'not a directory');
    await assertRejects(() => describeStorageDurability(`${dir}/file`));
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test({
  name: 'storage: an unwritable directory fails the probe without claiming durability',
  ignore: Deno.build.os === 'windows' || Deno.uid() === 0,
  async fn() {
    const dir = await Deno.makeTempDir();
    try {
      await Deno.chmod(dir, 0o500);
      await assertRejects(() => describeStorageDurability(dir), Deno.errors.PermissionDenied);
    } finally {
      await Deno.chmod(dir, 0o700);
      await Deno.remove(dir);
    }
  },
});
