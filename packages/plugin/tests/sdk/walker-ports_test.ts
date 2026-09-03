import { assertEquals, assertThrows } from '@std/assert';
import { join } from '@std/path';
import {
  AstExtractor,
  FilesystemWalker,
  MemoryManifestResolver,
  RegistryEmitter,
  runWalkerPipeline,
  startWalker,
} from '../../src/sdk/mod.ts';
import { createPluginManifestFixture } from '../../src/testing/mod.ts';

Deno.test({
  name: 'WalkerPort contract returns walked files for a root',
  permissions: { read: true, write: true },
  fn: async () => {
    const root = await Deno.makeTempDir();
    await Deno.mkdir(join(root, 'jobs'));
    await Deno.mkdir(join(root, '.data'));
    await Deno.mkdir(join(root, '.netscript'));
    await Deno.writeTextFile(join(root, 'mod.ts'), 'export const plugin = true;');
    await Deno.writeTextFile(join(root, 'jobs', 'send-email.ts'), 'export default {};');
    await Deno.writeTextFile(join(root, 'README.md'), '# ignored');
    await Deno.writeTextFile(
      join(root, '.data', 'container-output.ts'),
      'export const ignored = true;',
    );
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
      path: 'plugins.ts',
      text: `
        export const NETSCRIPT_CONTRIBUTION_BUILDERS = [
          { callee: 'defineJob', axis: 'jobs' },
          { callee: 'defineSaga', axis: 'sagas' },
          { callee: 'defineWebhook', axis: 'triggers' },
        ] as const;
      `,
    },
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

Deno.test('AstExtractor discovers a synthetic plugin-owned declaration without options', async () => {
  const contributions = await new AstExtractor().extract([
    {
      path: 'channel-sync/plugin.ts',
      text: `
        export const NETSCRIPT_CONTRIBUTION_BUILDERS = [
          { callee: 'defineChannelSync', axis: 'channel-syncs' },
        ] as const;
      `,
    },
    {
      path: 'channel-sync/sync-general.ts',
      text: `
        import { defineChannelSync } from '@acme/plugin-channel-sync-core';
        export const syncGeneral = defineChannelSync('general').build();
      `,
    },
  ]);

  assertEquals(contributions, [{
    file: 'channel-sync/sync-general.ts',
    symbol: 'syncGeneral',
    axis: 'channel-syncs',
  }]);
});

Deno.test('AstExtractor fails loudly when a contribution factory has no declaration', () => {
  assertThrows(
    () =>
      new AstExtractor().extract([{
        path: 'examples/example.ts',
        text: `
          import { defineExample } from '@acme/plugin-example-core';
          export const example = defineExample('example').build();
        `,
      }]),
    TypeError,
    'Contribution factory "defineExample" has no declared axis; run plugin sync/update or pass it through additionalBuilders',
  );
});

Deno.test('AstExtractor keeps a walk with no contribution factory calls quiet', async () => {
  assertEquals(
    await new AstExtractor().extract([{
      path: 'mod.ts',
      text: `export const value = Object.freeze({ ready: true });`,
    }]),
    [],
  );
});

Deno.test('AstExtractor discovers a synthetic third-party factory from an immutable snapshot', async () => {
  const builders = [{ callee: 'defineChannelSync', axis: 'channel-syncs' }];
  const extractor = new AstExtractor({ additionalBuilders: builders });

  builders[0].axis = 'mutated-after-construction';
  builders.push({ callee: 'defineLateBuilder', axis: 'late-builders' });

  const contributions = await extractor.extract([
    {
      path: 'channel-syncs/sync-general.ts',
      text: `
        export const syncGeneral = defineChannelSync('general').build();
        export const late = defineLateBuilder('late').build();
      `,
    },
  ]);

  assertEquals(contributions, [
    {
      file: 'channel-syncs/sync-general.ts',
      symbol: 'syncGeneral',
      axis: 'channel-syncs',
    },
  ]);
});

Deno.test('AstExtractor rejects malformed and duplicate builder configuration', () => {
  assertThrows(
    () =>
      new AstExtractor({
        additionalBuilders: [{ callee: 'define-channel-sync', axis: 'channel-syncs' }],
      }),
    TypeError,
    'Invalid contribution builder callee "define-channel-sync"',
  );
  assertThrows(
    () =>
      new AstExtractor({
        additionalBuilders: [{ callee: 'defineChannelSync', axis: '   ' }],
      }),
    TypeError,
    'Contribution builder axis for "defineChannelSync" must not be blank',
  );
  assertThrows(
    () =>
      new AstExtractor({
        additionalBuilders: [
          { callee: 'defineChannelSync', axis: 'channel-syncs' },
          { callee: 'defineChannelSync', axis: 'other-channel-syncs' },
        ],
      }),
    TypeError,
    'Duplicate contribution builder callee "defineChannelSync"',
  );
});

Deno.test('AstExtractor rejects duplicate plugin-owned declarations', () => {
  assertThrows(
    () =>
      new AstExtractor().extract([{
        path: 'plugins.ts',
        text: `
          export const NETSCRIPT_CONTRIBUTION_BUILDERS = [
            { callee: 'defineExample', axis: 'examples' },
            { callee: 'defineExample', axis: 'other-examples' },
          ] as const;
        `,
      }]),
    TypeError,
    'Duplicate contribution builder callee "defineExample"',
  );
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

Deno.test({
  name: 'startWalker discovers plugin-owned declarations for a no-options consumer',
  permissions: { read: true, write: true },
  fn: async () => {
    const root = await Deno.makeTempDir();

    try {
      await Deno.writeTextFile(
        join(root, 'plugin.ts'),
        `export const NETSCRIPT_CONTRIBUTION_BUILDERS = [{ callee: 'defineJob', axis: 'jobs' }] as const;`,
      );
      await Deno.writeTextFile(
        join(root, 'send-email.ts'),
        `import { defineJob } from '@netscript/plugin-workers-core';\nexport const sendEmail = defineJob('send-email').build();`,
      );

      const emissions = await startWalker(root);

      assertEquals(emissions.map((emission) => emission.path), [
        '.netscript/generated/jobs.registry.ts',
      ]);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  },
});

Deno.test({
  name: 'startWalker forwards third-party builder configuration',
  permissions: { read: true, write: true },
  fn: async () => {
    const root = await Deno.makeTempDir();

    try {
      await Deno.writeTextFile(
        join(root, 'channel-sync.ts'),
        `export const syncGeneral = defineChannelSync('general').build();`,
      );

      const emissions = await startWalker(root, {
        additionalBuilders: [{ callee: 'defineChannelSync', axis: 'channel-syncs' }],
      });

      assertEquals(emissions.map((emission) => emission.path), [
        '.netscript/generated/channel-syncs.registry.ts',
      ]);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  },
});
