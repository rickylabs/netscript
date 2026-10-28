import { legacy } from '../assets/legacy.generated.ts';
import { fontRequests } from '../assets/metadata.generated.ts';
import type { RegistryItemDefinition } from '../../../registry.schema.ts';
import {
  APP_TOKEN_FILES,
  type ExportedToken,
  type TokenContextOutput,
} from '../domain/token-output.ts';
import { effectiveContexts } from './format-css.ts';

/** Serialize without the build-only resolved DTCG composites. */
export function exportedTokens(context: TokenContextOutput): Record<string, ExportedToken> {
  return Object.fromEntries(
    Object.entries(context.tokens).map(([name, token]) => {
      const { resolved: _resolved, ...entry } = token;
      return [name, entry];
    }),
  );
}

/** Ramp names and ordering come from token category metadata. */
export function tokenRamps(
  tokens: Readonly<Record<string, ExportedToken>>,
): { name: string; steps: string[] }[] {
  const groups = new Map<string, { name: string; step: number }[]>();
  for (const [name, token] of Object.entries(tokens)) {
    if (token.path[0] !== 'color') continue;
    const group = token.path[1];
    const entries = groups.get(group) ?? [];
    entries.push({ name, step: Number(token.path[2]) });
    groups.set(group, entries);
  }
  return [...groups].map(([name, entries]) => ({
    name,
    steps: entries.sort((a, b) => a.step - b.step).map((entry) => entry.name),
  }));
}

/** A small copy-source preset file controls the initial root attributes. */
export function presetConfiguration(context: TokenContextOutput): object {
  const { id, language, flavor, density, sourceDensity } = context.preset;
  return { version: 2, id, language, flavor: flavor ?? null, density, sourceDensity };
}

/** Generated font requests keep host/font choices out of the application template. */
export function formatFontImports(contexts: readonly TokenContextOutput[]): object {
  const imports: Record<string, string[]> = {};
  for (const context of effectiveContexts(contexts).filter((entry) => entry.scheme === 'light')) {
    const firstFamily = (name: string): string => {
      const value = context.tokens[name]?.resolved;
      return String(Array.isArray(value) ? value[0] : value).replace(/^'|'$/g, '').split(',')[0];
    };
    if (
      context.preset.id === 'ns-one' && firstFamily('font-sans') === 'DM Sans' &&
      firstFamily('font-mono') === 'DM Mono'
    ) {
      imports['ns-one'] = legacy.fontImports;
      continue;
    }
    const families = new Map<string, Set<number>>();
    for (const [name, token] of Object.entries(context.tokens)) {
      if (!name.startsWith('font-') || token.type !== 'fontFamily') continue;
      const value = token.resolved;
      const family =
        String(Array.isArray(value) ? value[0] : value).replace(/^'|'$/g, '').split(',')[0];
      const weights = families.get(family) ?? new Set<number>();
      const roles: Readonly<Record<string, readonly string[]>> = {
        'font-sans': ['body', 'strong', 'small'],
        'font-heading': ['display', 'heading', 'title'],
        'font-kpi': ['kpi'],
        'font-label': ['label'],
        'font-data': ['body'],
        'font-mono': ['caption'],
      };
      for (const role of roles[name] ?? ['body']) {
        weights.add(Number(context.tokens[`weight-${role}`]?.resolved ?? 400));
      }
      families.set(family, weights);
    }
    imports[context.preset.id] = [...families].sort(([a], [b]) => a < b ? -1 : 1).map(
      ([family, requested]) => {
        const supported = Object.entries(fontRequests.families).find(([name]) => name === family)
          ?.[1];
        const weights = (supported ?? [...requested]).toSorted((a, b) => a - b).join(';');
        return `https://fonts.googleapis.com/css2?family=${
          encodeURIComponent(family).replaceAll('%20', '+')
        }:wght@${weights}&display=swap`;
      },
    );
  }
  return { version: 2, imports };
}

/** Backward-compatible root fields plus the complete effective preset catalog. */
export function formatTokensJson(
  contexts: readonly TokenContextOutput[],
  defaultPreset: string,
): object {
  const unique = effectiveContexts(contexts);
  const selected = (scheme: string): TokenContextOutput =>
    unique.find((entry) => entry.preset.id === defaultPreset && entry.scheme === scheme)!;
  const root = exportedTokens(selected('light'));
  const tokens = defaultPreset === 'ns-one'
    ? Object.fromEntries(Object.entries(root).filter(([name]) => name in legacy.tokens))
    : root;
  const presets: Record<string, object> = {};
  for (const context of unique) {
    if (context.scheme !== 'light') continue;
    const values = (entry: TokenContextOutput): Record<string, string> =>
      Object.fromEntries(Object.entries(entry.tokens).map(([name, token]) => [name, token.value]));
    const dark = unique.find((entry) =>
      entry.preset.id === context.preset.id && entry.scheme === 'dark'
    )!;
    presets[context.preset.id] = {
      ...presetConfiguration(context),
      schemes: { light: values(context), dark: values(dark) },
    };
  }
  const definitions = Object.fromEntries(
    Object.entries(root).map((
      [name, token],
    ) => [name, { type: token.type, cssVar: token.cssVar, path: token.path }]),
  );
  return {
    version: 2,
    generatedBy: 'Style Dictionary 5.7.1',
    defaultPreset,
    tokens,
    themes: { dark: exportedTokens(selected('dark')) },
    ramps: tokenRamps(tokens),
    allRamps: tokenRamps(root),
    definitions,
    presets,
    inputs: contexts.map((context) => ({
      theme: context.preset.id,
      scheme: context.scheme,
      requestedDensity: context.requestedDensity,
      effectiveDensity: context.preset.density,
      sourceDensity: context.preset.sourceDensity,
    })),
    deferredDensities: ['dense', 'airy', 'chunky'],
  };
}

/** Every theme item selects configuration while sharing the same built web artifacts. */
export function formatThemeItems(
  contexts: readonly TokenContextOutput[],
): RegistryItemDefinition[] {
  return effectiveContexts(contexts).filter((context) => context.scheme === 'light').map((
    context,
  ): RegistryItemDefinition => ({
    name: `theme-${context.preset.id}`,
    kind: 'theme',
    author: 'NetScript',
    copyOwnership: 'app-owned-after-copy',
    description:
      `${context.preset.id} language preset; fixed ${context.preset.density} density (${context.preset.sourceDensity} Figma geometry).`,
    tags: ['theme', 'tokens', context.preset.language],
    registryDependencies: ['cn', 'public-types'],
    files: [
      { source: 'registry/theme/styles.css', target: '@assets/styles.css' },
      ...['theme-bridge.css', 'tokens.json', 'fonts.json'].map((file) => ({
        source: `registry/theme/${file}`,
        target: `@assets/${file}`,
      })),
      { source: `registry/theme/presets/${context.preset.id}.css`, target: '@assets/tokens.css' },
      // A registry source has one target; the configured CSS is already installed as tokens.css.
      ...APP_TOKEN_FILES.filter((file) =>
        file.startsWith('presets/') && file !== `presets/${context.preset.id}.css`
      ).map((file) => ({
        source: `registry/theme/${file}`,
        target: `static/${file}`,
      })),
      {
        source: `registry/theme/presets/${context.preset.id}.json`,
        target: '@assets/theme-preset.json',
      },
    ],
    meta: { preset: presetConfiguration(context) },
  }));
}
