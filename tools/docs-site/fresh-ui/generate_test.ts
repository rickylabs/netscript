import { assert, assertEquals, assertThrows } from '@std/assert';
import { documentedItems } from './generate.ts';
import { assertCatalogFresh } from './check.ts';
import { implementationProps, typeText } from './read-props.ts';
import { supportedPreset } from './builder.ts';
import { builderPage, referencePages } from './render.ts';
import { encodeUiPreset } from '../../../packages/cli/src/kernel/domain/ui/ui-preset.ts';
import type { ComponentCatalog, ComponentPage } from './catalog.ts';

const page: ComponentPage = {
  name: 'new-control',
  symbol: 'NewControl',
  source: 'packages/fresh-ui/registry/components/ui/new-control.tsx',
  description: 'A newly registered control',
  example: '<NewControl />',
  props: [],
  signatures: [],
  cssTokens: [],
};
const catalog: ComponentCatalog = {
  inputHash: 'current',
  componentCssSources: [],
  components: [page],
  presets: [{
    id: 'studio-utility',
    code: '',
    language: 'studio',
    flavor: 'utility',
    accent: 'Ink',
    density: 'Compact',
    values: {},
  }],
};

Deno.test('new registry items generate pages without a maintained page list', () => {
  const items = documentedItems([{ name: 'new-control', type: 'registry:component' }, {
    name: 'new-block',
    type: 'registry:block',
  }, { name: 'theme', type: 'registry:theme' }]);
  assertEquals(items.map((i) => i.name), ['new-block', 'new-control']);
  const pages = referencePages(catalog);
  assert(
    pages.some((p) =>
      p.url === '/design-system/components/new-control/' &&
      p.content.includes('netscript ui:add new-control')
    ),
  );
});

Deno.test('generated pages link editing to their real generator source', async () => {
  for (const page of [builderPage(catalog), ...referencePages(catalog)]) {
    assertEquals(page.edit_source, '/design-system/components.page.ts');
    const source = new URL('../../../docs/site' + page.edit_source, import.meta.url);
    assert((await Deno.stat(source)).isFile);
  }
});

Deno.test('freshness rejects a changed source digest and a newly added registry item', () => {
  assertCatalogFresh(catalog, ['new-control'], 'current');
  assertThrows(
    () => assertCatalogFresh(catalog, ['new-control'], 'changed'),
    Error,
    'inputs changed',
  );
  assertThrows(
    () => assertCatalogFresh(catalog, ['new-control', 'next-control'], 'current'),
    Error,
    'coverage is stale',
  );
});

Deno.test('builder accepts existing CLI codes and rejects unshipped styles/fonts/icons', () => {
  assertEquals(
    supportedPreset(
      encodeUiPreset({ version: 1, theme: 'studio-utility', style: 'style-utility' }),
      catalog,
    ),
    'studio-utility',
  );
  for (
    const choice of [
      { version: 1 as const, theme: 'unknown' },
      { version: 1 as const, theme: 'studio-utility', style: 'fake-style' },
      { version: 1 as const, theme: 'studio-utility', font: 'fake-font' },
      { version: 1 as const, theme: 'studio-utility', iconLibrary: 'fake-icons' },
    ]
  ) {
    assertThrows(() => supportedPreset(encodeUiPreset(choice), catalog));
  }
  assertThrows(() => supportedPreset('ns1_broken', catalog));
});

Deno.test('native deno doc provides actual optional props and closed union types', async () => {
  const path = new URL(
    '../../../packages/fresh-ui/registry/components/ui/button.tsx',
    import.meta.url,
  );
  const result = await new Deno.Command(Deno.execPath(), {
    args: ['doc', '--json', '--private', path.href],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assert(result.success, new TextDecoder().decode(result.stderr));
  const docs = JSON.parse(new TextDecoder().decode(result.stdout));
  const props = implementationProps(docs.nodes[path.href]);
  assert(props.some((p) => p.name === 'children' && !p.optional && p.type === 'Renderable'));
  assert(props.some((p) => p.name === 'variant' && p.optional && p.type === 'ButtonVariant'));
  assert(props.some((p) => p.name === 'href' && !p.optional && p.type === 'string'));
  assertEquals(
    typeText({
      kind: 'union',
      value: [{ kind: 'literal', value: { kind: 'string', string: 'small' } }, {
        kind: 'literal',
        value: { kind: 'string', string: 'large' },
      }],
    }),
    '"small" | "large"',
  );
});
