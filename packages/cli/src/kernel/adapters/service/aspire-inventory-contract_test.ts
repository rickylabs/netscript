import { assertEquals, assertMatch, assertRejects } from '@std/assert';
import schema from '../../../../assets/schema/aspire-generated-surface.v1.json' with {
  type: 'json',
};
import { ASPIRE_SURFACE_MARKER } from '../../domain/aspire-generated-surface.ts';
import { buildAspireInventory, canonicalizeAspireOutputs } from './aspire-surface-inventory.ts';
import { checkAspireSurface } from './aspire-surface-checker.ts';

const selected = [
  { path: 'aspire/apphost.mts', content: ASPIRE_SURFACE_MARKER + 'export {};\n' },
  { path: '.netscript/aspire-cli.ts', content: ASPIRE_SURFACE_MARKER + 'export {};\n' },
  { path: 'aspire/.helpers/resource.mts', content: ASPIRE_SURFACE_MARKER + 'export {};\n' },
];

Deno.test('Aspire v1 schema covers the entire inventory including the CLI runner', async () => {
  const inventory = await buildAspireInventory(selected);
  const pattern = new RegExp(schema.properties.outputs.items.properties.path.pattern);
  assertEquals(inventory.version, schema.properties.version.const);
  for (const entry of inventory.outputs) {
    assertMatch(entry.path, pattern);
    assertMatch(entry.digest, /^sha256:[0-9a-f]{64}$/);
    assertEquals(entry.ownership, 'generated');
  }
});

for (
  const hostile of [
    { name: 'duplicate producer', files: [...selected, selected[0]] },
    {
      name: 'case-overlapping producer',
      files: [...selected, { ...selected[2], path: 'aspire/.helpers/Resource.mts' }],
    },
    { name: 'deleted AppHost producer', files: selected.slice(1) },
    {
      name: 'deleted runner producer',
      files: selected.filter((file) => file.path !== '.netscript/aspire-cli.ts'),
    },
    {
      name: 'foreign producer',
      files: [
        { ...selected[0], content: '// @netscript-generated foreign\n' },
        ...selected.slice(1),
      ],
    },
    {
      name: 'deleted producer declaration',
      files: [{ ...selected[0], content: 'export {};\n' }, ...selected.slice(1)],
    },
    ...[
      'appsettings.json',
      'aspire/.helpers/AppSettings.json',
      'aspire/.helpers/../appsettings.json',
      'aspire/.helpers/alias:resource.mts',
      'aspire/.helpers/resource.mts.',
      'aspire/.helpers/resource.mts ',
    ].map((path) => ({
      name: `authored or aliased path ${path}`,
      files: [...selected, { ...selected[0], path }],
    })),
  ]
) {
  Deno.test(`Aspire inventory fails closed for ${hostile.name} before certifying outputs`, async () => {
    await assertRejects(() => buildAspireInventory(hostile.files));
    const root = await Deno.makeTempDir();
    try {
      const authored = '  {}\n\n';
      await Deno.writeTextFile(`${root}/appsettings.json`, authored);
      const report = await checkAspireSurface(root, () => Promise.resolve(hostile.files));
      assertEquals(report.status, 'inspection-failure');
      assertEquals(report.exitCode, 1);
      assertEquals(report.outputs, []);
      assertEquals(await Deno.readTextFile(`${root}/appsettings.json`), authored);
      assertEquals(Array.from(Deno.readDirSync(root)).map((entry) => entry.name), [
        'appsettings.json',
      ]);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });
}

Deno.test('Aspire canonical generation rejects Windows appsettings aliases before formatter access', async () => {
  for (
    const path of [
      '.helpers/AppSettings.json',
      '.helpers/resource.mts.',
      '.helpers/resource.mts ',
      '.helpers/alias:resource.mts',
    ]
  ) {
    await assertRejects(
      () =>
        canonicalizeAspireOutputs('.', [{ path, content: '' }], {
          formatContent: () => {
            throw new Error('Formatter must not execute.');
          },
          formatFiles: () => {
            throw new Error('Formatter must not execute.');
          },
          formatContents: () => {
            throw new Error('Formatter must not execute.');
          },
        }),
      Error,
      'ownership violation',
    );
  }
});

Deno.test('Aspire canonical generation refuses lost ownership after formatting before writer access', async () => {
  await assertRejects(
    () =>
      canonicalizeAspireOutputs('.', [{ path: 'apphost.mts', content: 'export {};\n' }], {
        formatContent: () => Promise.resolve('export {};\n'),
        formatFiles: () => {
          throw new Error('No disk formatting permitted.');
        },
        formatContents: (files) => Promise.resolve(files.map(() => 'export {};\n')),
      }),
    Error,
    'ownership violation',
  );
});
