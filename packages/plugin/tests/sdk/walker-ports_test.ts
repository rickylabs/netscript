import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import {
  AstExtractor,
  FilesystemWalker,
  MemoryManifestResolver,
  RegistryEmitter,
  runWalkerPipeline,
} from '../../src/sdk/mod.ts';
import { createPluginManifestFixture } from '../../src/testing/mod.ts';

Deno.test({
  name: 'WalkerPort contract returns walked files for a root',
  permissions: { read: true, write: true },
  fn: async () => {
    const root = await Deno.makeTempDir();
    await Deno.mkdir(join(root, 'jobs'));
    await Deno.mkdir(join(root, '.netscript'));
    await Deno.writeTextFile(join(root, 'mod.ts'), 'export const plugin = true;');
    await Deno.writeTextFile(join(root, 'jobs', 'send-email.ts'), 'export default {};');
    await Deno.writeTextFile(join(root, 'README.md'), '# ignored');
    await Deno.writeTextFile(
      join(root, '.netscript', 'generated.ts'),
      'export const ignored = true;',
    );

    const walker = new FilesystemWalker();
    const files = await walker.walk(root);

    assertEquals(files.map((file) => file.path.replaceAll('\\', '/')), [
      'jobs/send-email.ts',
      'mod.ts',
    ]);
  },
});

Deno.test('ExtractorPort contract returns contribution candidates from files', async () => {
  const extractor = new AstExtractor();

  const contributions = await extractor.extract([
    {
      path: 'jobs/send-email.ts',
      text: `
        import { defineJob } from '@netscript/plugin-workers-core';
        export const sendEmail = defineJob('send-email').build();
      `,
    },
    {
      path: 'sagas/register-user.ts',
      text: `
        import { defineSaga } from '@netscript/plugin-sagas-core';
        export default defineSaga('register-user').build();
      `,
    },
    {
      path: 'triggers/new-user.ts',
      text: `
        import { defineWebhook } from '@netscript/plugin-triggers-core';
        const example = "export const fake = defineJob('fake')";
        export const newUserWebhook = defineWebhook('new-user', async () => ({}));
      `,
    },
  ]);

  assertEquals(contributions, [
    { file: 'jobs/send-email.ts', symbol: 'sendEmail', axis: 'jobs' },
    { file: 'sagas/register-user.ts', symbol: 'default', axis: 'sagas' },
    { file: 'triggers/new-user.ts', symbol: 'newUserWebhook', axis: 'triggers' },
  ]);
});

Deno.test('EmitterPort contract emits a registry artifact', async () => {
  const emitter = new RegistryEmitter();
  const emissions = await emitter.emit([{ file: 'plugin.ts', symbol: 'default', axis: 'service' }]);

  assertEquals(emissions.map((emission) => emission.path), [
    '.netscript/generated/service.registry.ts',
  ]);
});

Deno.test('ManifestResolverPort contract resolves optional manifests', async () => {
  const manifest = createPluginManifestFixture({ version: '0.1.0' });
  const resolver = new MemoryManifestResolver(manifest);

  assertEquals(await resolver.resolve('/workspace'), manifest);
});

Deno.test({
  name: 'runWalkerPipeline composes walker extractor and emitter ports',
  permissions: { read: true, write: true },
  fn: async () => {
    const emissions = await runWalkerPipeline({
      root: await Deno.makeTempDir(),
      walker: new FilesystemWalker(),
      extractor: new AstExtractor(),
      emitter: new RegistryEmitter(),
    });

    assertEquals(emissions, []);
  },
});
