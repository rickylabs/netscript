import { assert, assertEquals, assertRejects, assertThrows } from 'jsr:@std/assert@^1';
import { codeConnectFiles, validateReceipt } from '../src/code-connect.ts';
import type { ImportReceipt } from '../src/contract.ts';
import { generateLibrary } from '../src/generate.ts';
import { importLibrary } from '../src/native/import-library.ts';
import { fixtureCatalog, fixtureInput } from './fixture.ts';
import { MockFigma } from './mock-figma.ts';

function evaluateTemplate(
  source: string,
  properties: Readonly<Record<string, string>>,
): { example: string; id: string } {
  const execute = new Function(
    'figma',
    source.replace("import figma from 'figma';", '').replace('export default', 'return'),
  );
  return execute({
    selectedInstance: {
      getEnum: (name: string, mapping: Readonly<Record<string, string>>) => {
        const value = properties[name];
        if (!Object.hasOwn(mapping, value)) {
          throw new Error(`Unknown Figma property value: ${name}/${value}`);
        }
        return mapping[value];
      },
    },
    code: (strings: TemplateStringsArray, ...values: readonly unknown[]) =>
      strings.map((s, i) => s + String(values[i] ?? '')).join(''),
  });
}

Deno.test('maintained templates preserve scoped data attributes for every variant and exact source identity', async () => {
  const sources = fixtureInput();
  const bundle = generateLibrary(sources);
  const api = new MockFigma(sources.collections);
  const receipt = await importLibrary(api, bundle, sources, {
    provenance: 'fixture',
    fileKey: api.fileKey,
    signal: new AbortController().signal,
  });
  await assertRejects(() => codeConnectFiles(bundle, receipt, sources), Error, 'Fixture receipt');
  const preview = await codeConnectFiles(bundle, receipt, sources, { dryRun: true });
  assert(!Object.keys(preview).some((name) => name.endsWith('.figma.ts')));
  const source = preview['example-button.figma.preview.ts'];
  assert(
    source.startsWith(`// url=https://www.figma.com/design/${api.fileKey}/NetScript?node-id=`),
  );
  assert(source.includes('// source=components/fixture-button.tsx'));
  assert(source.includes('// component=example-button'));
  for (const variant of bundle.components[0].variants) {
    const rendered = evaluateTemplate(source, variant.attributes);
    assert(
      rendered.example.includes(
        `<div data-part="root" data-state="${variant.attributes['data-state']}">`,
      ),
    );
    assert(
      rendered.example.includes(
        `<div data-part="label" data-size="${variant.attributes['data-size']}"></div>`,
      ),
    );
    assert(rendered.example.includes('<!-- pseudo: data-part="decoration" -->'));
    assertEquals(rendered.id, 'netscript/style-fixture/example-button');
  }
  assertThrows(
    () => evaluateTemplate(source, { 'data-size': 'UNKNOWN', 'data-state': 'rest' }),
    Error,
    'Unknown Figma property',
  );
  // Structurally valid host-reported provenance exercises output formatting, not editor attestation.
  const reported: ImportReceipt = { ...receipt, provenance: 'figma-editor' };
  const files = await codeConnectFiles(bundle, reported, sources);
  assert(files['example-button.figma.ts']);
  assertEquals(JSON.parse(files['figma.config.json']), {
    codeConnect: { include: ['*.figma.ts'], label: 'HTML', language: 'html' },
  });
  const mappings = JSON.parse(files['mappings.json']);
  assertEquals(
    mappings.mappings.map((
      m: { item: string; registryItem: string; source: string },
    ) => [m.item, m.registryItem, m.source]),
    [['example-button', 'fixture-button', 'components/fixture-button.tsx']],
  );
});

Deno.test('receipt coverage rejects stale hashes and missing, unknown, duplicate or mismatched references', async () => {
  const sources = fixtureInput();
  const bundle = generateLibrary(sources);
  const api = new MockFigma(sources.collections);
  const receipt = await importLibrary(api, bundle, sources, {
    provenance: 'fixture',
    fileKey: api.fileKey,
    signal: new AbortController().signal,
  });
  const good: ImportReceipt = { ...receipt, provenance: 'figma-editor' };
  const cases: readonly [unknown, string][] = [
    [{ ...good, bundleHash: '0'.repeat(64) }, 'Stale receipt'],
    [{ ...good, components: [] }, 'components'],
    [{ ...good, components: [...good.components, good.components[0]] }, 'Duplicate receipt'],
    [
      { ...good, components: [{ ...good.components[0], registryItem: 'wrong-item' }] },
      'mismatched receipt item',
    ],
    [
      { ...good, components: [{ ...good.components[0], item: 'unknown-item' }] },
      'mismatched receipt item',
    ],
    [
      { ...good, components: [{ ...good.components[0], nodeId: good.pageId }] },
      'Duplicate receipt',
    ],
    [{ ...good, components: [{ ...good.components[0], nodeId: 'not-a-node' }] }, 'nodeId'],
    [{ ...good, fileKey: 'https://wrong.invalid' }, 'fileKey'],
  ];
  for (const [bad, reason] of cases) {
    await assertRejects(() => validateReceipt(bad, bundle), Error, reason);
  }
});

Deno.test('HTML enum interpolation escapes markup rather than emitting arbitrary attribute text', async () => {
  const base = fixtureInput();
  const catalog = fixtureCatalog();
  const sources = {
    ...base,
    catalog: {
      ...catalog,
      components: catalog.components.map((c, i) =>
        i === 0 ? { ...c, attributes: { 'data-state': { values: ['<quoted " &'] } } } : c
      ),
    },
  };
  const bundle = generateLibrary(sources);
  const api = new MockFigma(sources.collections);
  const receipt = await importLibrary(api, bundle, sources, {
    provenance: 'fixture',
    fileKey: api.fileKey,
    signal: new AbortController().signal,
  });
  const files = await codeConnectFiles(bundle, receipt, sources, { dryRun: true });
  const rendered = evaluateTemplate(
    files['example-button.figma.preview.ts'],
    bundle.components[0].variants[0].attributes,
  );
  assert(rendered.example.includes('data-state="&lt;quoted &quot; &amp;"'));
});
