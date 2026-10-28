import { Ajv } from 'npm:ajv@8.20.0';
import type { RegistryItemDefinition, RegistryManifest } from '../../registry.schema.ts';
import type { Registry } from './registry-contract.ts';

type LegacyItem = Omit<RegistryItemDefinition, 'name' | 'files' | 'description'>;
type LegacyRoot = Omit<RegistryManifest, 'items'>;
const ajv = new Ajv({ strict: false });
const legacyItem = ajv.compile<LegacyItem>({
  type: 'object',
  required: ['kind', 'copyOwnership', 'tags'],
  properties: {
    kind: { enum: ['theme', 'style', 'component', 'island', 'block', 'lib', 'hook', 'support'] },
    copyOwnership: { const: 'app-owned-after-copy' },
    tags: { type: 'array', items: { type: 'string' } },
    layer: { enum: [2, 3] },
    css: {
      type: 'array',
      items: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string' },
          layer: { enum: ['base', 'components', 'utilities'] },
        },
      },
    },
  },
});
const legacyRoot = ajv.compile<LegacyRoot>({
  type: 'object',
  required: ['name', 'version', 'packageName', 'model', 'tokenSourceStrategy', 'collections'],
  properties: {
    name: { type: 'string' },
    version: { type: 'string' },
    packageName: { type: 'string' },
    model: { const: 'copy-based-registry' },
    tokenSourceStrategy: { const: 'style-dictionary-dtcg-source' },
    collections: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'description', 'items'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          items: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
});

/** Project canonical JSON authoring onto the original scaffold manifest without changing copies. */
export function legacyRegistryManifest(registry: Registry): RegistryManifest {
  const metadata = registry.meta;
  if (!legacyRoot(metadata)) throw new Error('Invalid Fresh UI legacy registry metadata');
  const items: RegistryItemDefinition[] = [];
  for (const item of registry.items) {
    const legacy = item.meta?.netscript;
    if (legacy === undefined) continue;
    if (!legacyItem(legacy)) throw new Error(`Invalid legacy registry metadata: ${item.name}`);
    items.push({
      ...legacy,
      name: item.name,
      description: item.description ?? '',
      title: item.title,
      author: item.author,
      // Theme skills belong to the v2 installer; preserve the legacy scaffold's copy contract.
      files: (item.files ?? []).filter((file) =>
        !(item.type === 'registry:theme' &&
          file.target?.startsWith('.agents/skills/fresh-ui-theme-'))
      ).map((file) => ({
        source: file.path.startsWith('packages/fresh-ui/')
          ? file.path.slice('packages/fresh-ui/'.length)
          : `../../${file.path}`,
        target: file.target ?? file.path,
      })),
      registryDependencies: item.registryDependencies ? [...item.registryDependencies] : undefined,
      dependencies: item.dependencies ? [...item.dependencies] : undefined,
      cssVars: item.cssVars,
      docs: item.docs,
      categories: item.categories ? [...item.categories] : undefined,
      meta: item.meta,
    });
  }
  return { ...metadata, items };
}
