import { assert, assertEquals, assertNotEquals, assertRejects, assertThrows } from '@std/assert';
import { join } from '@std/path';
import {
  ensureInstallationSecretFile,
  installationSecretPermissions,
  registerInstallationSecret,
} from './installation-secret-file.ts';

async function fixture(use: (root: string) => Promise<void>): Promise<void> {
  const root = await Deno.makeTempDir();
  const previous = Deno.env.get('NETSCRIPT_INSTALLATION_SECRET_FILE');
  Deno.env.delete('NETSCRIPT_INSTALLATION_SECRET_FILE');
  try {
    await use(root);
  } finally {
    if (previous !== undefined) {
      Deno.env.set('NETSCRIPT_INSTALLATION_SECRET_FILE', previous);
    }
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test('installation provisioning creates once per project, with restrictive permissions', () =>
  fixture(async (root) => {
    const file = ensureInstallationSecretFile(root);
    assertEquals(file, join(root, '.data', 'aspire-secrets', 'installation.secret'));
    const material = await Deno.readTextFile(file);
    assertEquals(material.length, 64);
    assertEquals(ensureInstallationSecretFile(root), file);
    assertEquals(await Deno.readTextFile(file), material);
    const another = ensureInstallationSecretFile(
      join(root, 'other-installation'),
    );
    assertNotEquals(another, file);
    assertNotEquals(await Deno.readTextFile(another), material);
    if (Deno.build.os !== 'windows') {
      assertEquals((await Deno.stat(file)).mode! & 0o777, 0o600);
      assertEquals(
        (await Deno.stat(join(root, '.data', 'aspire-secrets'))).mode! & 0o777,
        0o700,
      );
    }
  }));

Deno.test('installation provisioning stays in the project with an unusable home and survives a project move', () =>
  fixture(async (root) => {
    const project = join(root, 'project');
    const foreignHome = join(root, 'unusable-home');
    await Deno.writeTextFile(foreignHome, 'a home that cannot contain a directory');
    const previousHome = Deno.env.get('HOME');
    Deno.env.set('HOME', foreignHome);
    try {
      const file = ensureInstallationSecretFile(project);
      const material = await Deno.readTextFile(file);
      const moved = join(root, 'moved-project');
      await Deno.rename(project, moved);
      const movedFile = ensureInstallationSecretFile(moved);
      assertEquals(await Deno.readTextFile(movedFile), material);
      assertEquals(await Deno.readTextFile(foreignHome), 'a home that cannot contain a directory');
      assertEquals(Array.from(Deno.readDirSync(root), (entry) => entry.name).sort(), [
        'moved-project',
        'unusable-home',
      ]);
    } finally {
      if (previousHome === undefined) Deno.env.delete('HOME');
      else Deno.env.set('HOME', previousHome);
    }
  }));

Deno.test('installation provisioning gives a path-free remedy for unusable files and directories', () =>
  fixture(async (root) => {
    const directory = join(root, '.data', 'aspire-secrets');
    await Deno.mkdir(join(root, '.data'));
    await Deno.writeTextFile(directory, 'not a directory');
    const error = assertThrows(() => ensureInstallationSecretFile(root));
    assert(String(error).includes('NETSCRIPT_INSTALLATION_SECRET_FILE'));
    assert(String(error).includes('mode 0700'));
    assert(String(error).includes('mode 0600'));
    assert(!String(error).includes(root));
    await Deno.remove(directory);
    await Deno.mkdir(directory, { mode: 0o700 });
    if (Deno.build.os !== 'windows') {
      await Deno.chmod(directory, 0o755);
      const permissionError = assertThrows(() => ensureInstallationSecretFile(root));
      assert(String(permissionError).includes('mode 0700'));
      assert(!String(permissionError).includes(root));
    }
  }));

Deno.test('installation provisioning preserves rotation and fails for missing explicit references', () =>
  fixture(async (root) => {
    const file = ensureInstallationSecretFile(root);
    const rotated = 'rotated-secret-material-'.repeat(3);
    await Deno.writeTextFile(file, rotated);
    const parameters: string[] = [];
    const builder = {
      addParameter(_name: string, options: { value: string; secret: boolean }) {
        assertEquals(options.secret, true);
        parameters.push(options.value);
        return Promise.resolve(undefined);
      },
    };
    assertEquals(
      await registerInstallationSecret(builder, root),
      file,
    );
    assertEquals(parameters, [rotated]);
    await Deno.remove(file);
    assertThrows(() => ensureInstallationSecretFile(root, { file }));
    assertEquals(parameters.length, 1);
  }));

Deno.test('installation provisioning refuses hostile files without revealing contents or paths', () =>
  fixture(async (root) => {
    const sentinel = 'HOSTILE_DISCLOSURE_SENTINEL';
    const directory = join(root, sentinel);
    await Deno.mkdir(directory, { mode: 0o700 });
    const file = join(directory, sentinel);
    for (
      const material of [
        sentinel,
        sentinel.repeat(200),
        new Uint8Array(40).fill(0xff),
      ]
    ) {
      await Deno.writeFile(
        file,
        typeof material === 'string' ? new TextEncoder().encode(material) : material,
        { mode: 0o600 },
      );
      const error = assertThrows(() => ensureInstallationSecretFile(root, { file }));
      assert(!String(error).includes(sentinel));
      assert(!String(error).includes(root));
      assert(error instanceof Error);
      assertEquals(error.cause, undefined);
    }
    await Deno.writeTextFile(file, sentinel.repeat(3));
    if (Deno.build.os !== 'windows') {
      await Deno.chmod(file, 0o644);
      assertThrows(() => ensureInstallationSecretFile(root, { file }));
      await Deno.chmod(file, 0o600);
      const symlink = join(directory, 'link');
      await Deno.symlink(file, symlink);
      assertThrows(() => ensureInstallationSecretFile(root, { file: symlink }));
    }
    const error = await assertRejects(() =>
      registerInstallationSecret(
        {
          addParameter(_name, options) {
            throw new Error(options.value);
          },
        },
        root,
        { file },
      )
    );
    assert(!String(error).includes(sentinel));
  }));

Deno.test('installation file carrier extends scoped permissions without narrowing existing grants', () => {
  assertEquals(
    installationSecretPermissions([
      '--allow-net',
      '--allow-read=./config',
      '--allow-env=PORT',
    ], '/owner/secret'),
    [
      '--allow-net',
      '--allow-read=./config,/owner/secret',
      '--allow-env=PORT,NETSCRIPT_INSTALLATION_SECRET_FILE',
    ],
  );
  assertEquals(
    installationSecretPermissions(
      ['--allow-read', '--allow-env'],
      '/owner/secret',
    ),
    ['--allow-read', '--allow-env'],
  );
  assertEquals(installationSecretPermissions(['-A'], '/owner/secret'), ['-A']);
  assertEquals(installationSecretPermissions(['--allow-read'], undefined), [
    '--allow-read',
  ]);
});
