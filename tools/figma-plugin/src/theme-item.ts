import { registryJson } from '../../../packages/fresh-ui/src/registry/assets/registry.generated.ts';
import { FRESH_UI_REGISTRY_CONTENT } from '../../../packages/fresh-ui/registry.generated.ts';
import type { RegistryItem } from '../../../packages/fresh-ui/src/registry/registry-contract.ts';
import { TOKEN_PRESETS } from '../../../packages/fresh-ui/src/tokens/domain/token-presets.ts';
import { exportFigmaTokenBundle } from '../../../packages/fresh-ui/src/tokens/adapters/figma/figma-round-trip.ts';
import type { FigmaCollection } from '../../../packages/fresh-ui/src/tokens/domain/token-contract.ts';

/** Build a portable source theme; the CLI compiles it through the existing token engine. */
export function themeItem(
  collections: readonly FigmaCollection[],
  preset: string,
): RegistryItem & { readonly $schema: string } {
  const selection = TOKEN_PRESETS.find((entry) => entry.id === preset);
  const baseline = registryJson.items.find((entry) => entry.name === `theme-${preset}`);
  if (!selection || !baseline) throw new Error(`Unknown registered token preset: ${preset}`);
  const files = (baseline.files ?? []).filter((file) =>
    file.target === '@assets/styles.css' || file.target?.startsWith('.agents/skills/')
  ).map((file) => {
    const path = file.path.startsWith('packages/fresh-ui/')
      ? file.path.slice('packages/fresh-ui/'.length)
      : `../../${file.path}`;
    const content = FRESH_UI_REGISTRY_CONTENT[file.path] ?? FRESH_UI_REGISTRY_CONTENT[path];
    if (typeof content !== 'string') {
      throw new Error(`Missing embedded theme document: ${file.path}`);
    }
    return { ...file, content };
  });
  return {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: `theme-figma-${preset}`,
    type: 'registry:theme',
    title: `Figma ${preset}`,
    description: 'Figma-owned values using code-owned token names.',
    files,
    meta: { netscript: { version: 1, preset, figma: exportFigmaTokenBundle(collections) } },
  };
}
