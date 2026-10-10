import { writeInstalledAuthFixture } from '../../../../tests/installed-auth-fixture.ts';
import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { join } from '@std/path';
import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import { DenoFileSystem } from '../runtime/file-system/deno-file-system.ts';
import { StringTemplateAdapter } from '../scaffold/template-adapter.ts';
import { Scaffolder } from '../scaffold/scaffolder.ts';
import { SCAFFOLD_WORKSPACE_CATALOG } from '../../constants/scaffold/scaffold-app-catalog.ts';
import { regenerateAspireHelpers } from '../service/workspace-mutator.ts';
import { reconcileBrowserAuth } from './browser-auth-reconciler.ts';
import { SERVICE_PUBLIC_REASON, serviceAuthTemplate } from '../service/auth-policy.ts';

const settings = {
  NetScript: {
    Name: 'shop',
    Version: '1.0.0',
    Databases: {},
    Cache: {},
    BackgroundProcessors: {},
    Tools: {},
    Apps: { web: { Type: 'app', Workdir: 'apps/web' } },
    Services: {
      users: {
        Runtime: 'deno',
        Workdir: 'services/users',
        Entrypoint: 'src/main.ts',
      },
    },
    Plugins: {
      auth: {
        Runtime: 'deno',
        Entrypoint: 'services/main.ts',
        Workdir: 'plugins/auth',
      },
    },
  },
};
const main =
  "import { defineService } from '@netscript/service';\nawait defineService(router, {\n  auth: { public: true, reason: 'Scaffold demo is public; #1382 L2 will wire the guarded auth policy' },\n  name: 'users' });\n";

Deno.test('auth scaffold is request-scoped, idempotent, and preserves authored policy and routes', async () => {
  const fs = new MemoryFileSystemAdapter();
  const root = '/workspace';
  await fs.writeFile(join(root, 'appsettings.json'), JSON.stringify(settings));
  await fs.writeFile(join(root, 'apps/web/utils.ts'), '');
  await fs.writeFile(join(root, 'services/users/src/main.ts'), main);
  await writeInstalledAuthFixture(fs, root);
  const created = await reconcileBrowserAuth(root, fs);
  assertEquals(created.length, 4);
  assertStringIncludes(
    await fs.readFile(join(root, 'apps/web/routes/auth/[action].ts')),
    "'../../../../auth/bff.ts'",
  );
  assertStringIncludes(
    await fs.readFile(join(root, 'auth/bff.ts')),
    "responseCache: { mode: 'direct-only' }",
  );
  assertStringIncludes(
    await fs.readFile(join(root, 'services/users/src/main.ts')),
    'authenticator: browserAuthenticator',
  );
  const config = JSON.parse(await fs.readFile(join(root, 'appsettings.json')));
  assertEquals(config.NetScript.Apps.web.PluginReferences, ['auth']);
  assertEquals(config.NetScript.Services.users.PluginReferences, ['auth']);
  assertEquals(await reconcileBrowserAuth(root, fs), []);
  await fs.writeFile(
    join(root, 'apps/web/routes/auth/[action].ts'),
    '// custom route',
  );
  await fs.writeFile(
    join(root, 'services/users/src/main.ts'),
    main.replace(/auth: .*?,\n/, 'auth: customPolicy,\n'),
  );
  await reconcileBrowserAuth(root, fs);
  assertEquals(
    await fs.readFile(join(root, 'apps/web/routes/auth/[action].ts')),
    '// custom route',
  );
  assertStringIncludes(
    await fs.readFile(join(root, 'services/users/src/main.ts')),
    'auth: customPolicy',
  );
});

Deno.test('helper regeneration leaves scaffold policies and authored inputs unchanged', async () => {
  const root = await Deno.makeTempDir();
  const fs = new DenoFileSystem();
  const templates = new StringTemplateAdapter(fs);
  try {
    const repo = new URL('../../../../../../', import.meta.url);
    await fs.writeFile(
      join(root, 'deno.json'),
      JSON.stringify({
        catalog: SCAFFOLD_WORKSPACE_CATALOG,
        imports: {
          '@netscript/config': new URL('packages/config/mod.ts', repo).href,
        },
      }),
    );
    await fs.writeFile(
      join(root, 'netscript.config.ts'),
      "import { defineConfig } from '@netscript/config';\nexport default defineConfig({ name: 'shop', databases: { config: [] }, plugins: [] });",
    );
    await fs.writeFile(
      join(root, 'appsettings.json'),
      JSON.stringify({
        NetScript: {
          ...settings.NetScript,
          Apps: { web: { ...settings.NetScript.Apps.web, PluginReferences: ['auth'] } },
          Services: { users: { ...settings.NetScript.Services.users, PluginReferences: ['auth'] } },
        },
      }),
    );
    await fs.createDir(join(root, 'aspire'));
    await fs.writeFile(join(root, 'apps/web/utils.ts'), '');
    await fs.writeFile(join(root, 'services/users/src/main.ts'), main);
    await writeInstalledAuthFixture(fs, root);
    // No runtime plugin module is needed by this isolated helper-generator fixture.
    await fs.writeFile(
      join(root, 'netscript.config.ts'),
      "import { defineConfig } from '@netscript/config';\nexport default defineConfig({ name: 'shop', databases: { config: [] }, plugins: [] });",
    );
    const authored = [
      'appsettings.json',
      'netscript.config.ts',
      'services/users/src/main.ts',
      'apps/web/utils.ts',
    ];
    const before = await Promise.all(authored.map((path) => fs.readFile(join(root, path))));
    const written = await regenerateAspireHelpers(
      root,
      fs,
      new Scaffolder(templates, fs),
      templates,
    );
    assertEquals(written.includes(join(root, 'auth/bff.ts')), false);
    assertEquals(await Promise.all(authored.map((path) => fs.readFile(join(root, path)))), before);
    assertEquals(await fs.exists(join(root, 'apps/web/routes/auth/[action].ts')), false);
    assertEquals(await fs.exists(join(root, 'auth/service.ts')), false);
    assertStringIncludes(
      await fs.readFile(join(root, 'aspire/.helpers/register-apps.mts')),
      'services__auth__http__0',
    );
    assertStringIncludes(
      await fs.readFile(join(root, 'aspire/.helpers/register-services.mts')),
      'extractPluginReferences(entry)',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('browser auth rewrites a custom entrypoint and rejects drift in the scaffold opt-out', async () => {
  const fs = new MemoryFileSystemAdapter();
  const root = '/workspace';
  const config = structuredClone(settings);
  config.NetScript.Services.users.Entrypoint = 'server.ts';
  await fs.writeFile(join(root, 'appsettings.json'), JSON.stringify(config));
  const path = join(root, 'services/users/server.ts');
  await fs.writeFile(path, main);
  await writeInstalledAuthFixture(fs, root);
  assert((await reconcileBrowserAuth(root, fs)).includes(path));
  assertStringIncludes(await fs.readFile(path), 'authenticator: browserAuthenticator');
  await fs.writeFile(path, main.replace('#1382 L2', '#1382 changed'));
  await assertRejects(
    () => reconcileBrowserAuth(root, fs),
    TypeError,
    'scaffold public policy with an unchanged reason',
  );
});

for (
  const [index, policy] of [
    serviceAuthTemplate().authPolicy,
    `auth :\t{ public : true , reason :\r\n '${SERVICE_PUBLIC_REASON}' } ,`,
    `auth:\n{\npublic:true,reason: "${SERVICE_PUBLIC_REASON}"\n},`,
    `auth: {
    public: true,
    reason: '${SERVICE_PUBLIC_REASON}',
  },`,
    `auth: {
    public: true,
    reason:
      '${SERVICE_PUBLIC_REASON}',
  },`,
  ].entries()
) {
  Deno.test(`browser auth reconciles scaffold whitespace variant ${index}`, async () => {
    const fs = new MemoryFileSystemAdapter();
    const root = '/workspace';
    const path = join(root, 'services/users/src/main.ts');
    await fs.writeFile(join(root, 'appsettings.json'), JSON.stringify(settings));
    await fs.writeFile(join(root, 'apps/web/utils.ts'), '');
    await fs.writeFile(path, `await defineService(router, {\n  ${policy}\n  name: 'users' });\n`);
    await writeInstalledAuthFixture(fs, root);
    assert((await reconcileBrowserAuth(root, fs)).includes(path));
    assertStringIncludes(await fs.readFile(path), 'authenticator: browserAuthenticator');
    assertStringIncludes(await fs.readFile(path), 'createContractAuthorizer(router)');
    assertEquals(await reconcileBrowserAuth(root, fs), []);
    const custom =
      `await defineService(router, { auth: { public: true, reason: 'Owner-authored policy' } });`;
    await fs.writeFile(path, custom);
    await reconcileBrowserAuth(root, fs);
    assertEquals(await fs.readFile(path), custom);
  });
}

Deno.test('browser auth preserves the scaffold public opt-out when auth is disabled', async () => {
  const fs = new MemoryFileSystemAdapter();
  const root = '/workspace';
  const path = join(root, 'services/users/src/main.ts');
  const config = {
    ...settings,
    NetScript: {
      ...settings.NetScript,
      Plugins: { auth: { ...settings.NetScript.Plugins.auth, Enabled: false } },
    },
  };
  const publicMain = `await defineService(router, { ${serviceAuthTemplate().authPolicy} });`;
  await fs.writeFile(join(root, 'appsettings.json'), JSON.stringify(config));
  await fs.writeFile(join(root, 'apps/web/utils.ts'), '');
  await fs.writeFile(path, publicMain);
  await writeInstalledAuthFixture(fs, root);
  const installed = JSON.parse(await fs.readFile(join(root, 'appsettings.json')));
  installed.NetScript.Plugins.auth.Enabled = false;
  await fs.writeFile(join(root, 'appsettings.json'), JSON.stringify(installed));
  assertEquals(await reconcileBrowserAuth(root, fs), []);
  assertEquals(await fs.readFile(path), publicMain);
  assertEquals(await fs.exists(join(root, 'auth/service.ts')), false);
});
