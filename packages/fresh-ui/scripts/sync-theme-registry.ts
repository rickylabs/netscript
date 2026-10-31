import type { RegistryItemDefinition } from '../registry.schema.ts';
import type { Registry, RegistryItem } from '../src/registry/registry-contract.ts';
import { TOKEN_PRESETS } from '../src/tokens/domain/token-presets.ts';

// The engine owns the preset file inventory; authored registry metadata must follow it.
const root = new URL('../', import.meta.url);
const registry: Registry = JSON.parse(await Deno.readTextFile(new URL('registry.json', root)));
const themes: RegistryItemDefinition[] = JSON.parse(
  await Deno.readTextFile(new URL('registry/theme/theme-items.json', root)),
);
const expectedNames = TOKEN_PRESETS.map((preset) => `theme-${preset.id}`).sort();
if (JSON.stringify(themes.map((theme) => theme.name).sort()) !== JSON.stringify(expectedNames)) {
  throw new Error('Generated theme inventory must match the registered presets');
}
const generated = new Map<string, RegistryItem>();
for (const theme of themes) {
  const preset = TOKEN_PRESETS.find((preset) => theme.name === `theme-${preset.id}`)!;
  const language = preset.id === 'ns-one' ? 'studio' : preset.language;
  // Token-only additions have no component spec/preview yet; keep them outside the site theme catalogue.
  let documentation = `docs/design-system/themes/${language}`;
  try {
    await Deno.stat(new URL(`../../${documentation}/DESIGN.md`, root));
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
    documentation = `docs/design-system/token-presets/${language}`;
  }
  generated.set(theme.name, {
    ...registry.items.find((item) => item.name === theme.name),
    name: theme.name,
    author: theme.author,
    description: theme.description,
    type: 'registry:theme',
    registryDependencies: theme.registryDependencies,
    meta: {
      preset: theme.meta?.preset,
      netscript: { kind: theme.kind, copyOwnership: theme.copyOwnership, tags: theme.tags },
    },
    files: [
      ...theme.files.map((file) => ({
        path: `packages/fresh-ui/${file.source}`,
        type: file.source.endsWith('.json') ? 'registry:theme' as const : 'registry:file' as const,
        target: file.target,
      })),
      ...['DESIGN.md', 'SKILL.md'].map((file) => ({
        path: `${documentation}/${file}`,
        type: 'registry:file' as const,
        target: `.agents/skills/fresh-ui-theme-${preset.id}/${file}`,
      })),
    ],
  });
}
const items = registry.items.map((item) => {
  const theme = generated.get(item.name);
  if (theme) {
    generated.delete(item.name);
    return theme;
  }
  if (item.name !== 'theme-previews') return item;
  return {
    ...item,
    files: TOKEN_PRESETS.map((preset) => ({
      path: `packages/fresh-ui/registry/theme/presets/${preset.id}.css`,
      type: 'registry:file' as const,
      target: `static/presets/${preset.id}.css`,
    })),
  };
});
items.push(...generated.values());
const expected = JSON.stringify({ ...registry, items }, null, 2) + '\n';
if (Deno.args.includes('--check')) {
  if (expected !== await Deno.readTextFile(new URL('registry.json', root))) {
    throw new Error('Stale authored theme registry; run deno task tokens:build');
  }
} else await Deno.writeTextFile(new URL('registry.json', root), expected);
console.log(
  `Theme registry ${
    Deno.args.includes('--check') ? 'checked' : 'synchronized'
  }: ${themes.length} presets.`,
);
