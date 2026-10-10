import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { join } from '@std/path';
import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import { DenoFileSystem } from '../runtime/file-system/deno-file-system.ts';
import { StringTemplateAdapter } from '../scaffold/template-adapter.ts';
import { Scaffolder } from '../scaffold/scaffolder.ts';
import { SCAFFOLD_WORKSPACE_CATALOG } from '../../constants/scaffold/scaffold-app-catalog.ts';
import { regenerateAspireHelpers } from '../service/workspace-mutator.ts';
import { reconcileBrowserAuth } from './browser-auth-reconciler.ts';

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

Deno.test('helper regeneration after auth install or service add emits the BFF topology', async () => {
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
      JSON.stringify(settings),
    );
    await fs.createDir(join(root, 'aspire'));
    await fs.writeFile(join(root, 'apps/web/utils.ts'), '');
    await fs.writeFile(join(root, 'services/users/src/main.ts'), main);
    const written = await regenerateAspireHelpers(
      root,
      fs,
      new Scaffolder(templates, fs),
      templates,
    );
    assert(written.includes(join(root, 'auth/bff.ts')));
    assert(await fs.exists(join(root, 'apps/web/routes/auth/[action].ts')));
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
  assert((await reconcileBrowserAuth(root, fs)).includes(path));
  assertStringIncludes(await fs.readFile(path), 'authenticator: browserAuthenticator');
  await fs.writeFile(path, main.replace('#1382 L2', '#1382 changed'));
  await assertRejects(
    () => reconcileBrowserAuth(root, fs),
    TypeError,
    'exact #1382 scaffold public policy',
  );
});
