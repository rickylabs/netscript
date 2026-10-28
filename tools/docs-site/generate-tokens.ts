import { AA_TEXT_CONTRAST, contrastRatio } from './contrast.ts';

/** Resolve the docs Utility context from the provenance-recorded Figma export. */
export interface FigmaVariable {
  name: string;
  type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  codeSyntax?: string;
  values: Record<string, string | number | boolean | { alias: string }>;
}

export interface FigmaCollection {
  collection: string;
  modes: string[];
  variables: FigmaVariable[];
}

export const UTILITY_MODES: Readonly<Record<string, string>> = {
  Primitives: 'Value',
  Theme: 'Studio',
  'Theme set': 'A',
  'Theme B': 'Bloom',
  'Studio flavor': 'Utility',
  'Base gray': 'Neutral',
  'Base accent': 'Ink',
  Density: 'Compact',
};

const SOURCE = new URL('./figma-variables/', import.meta.url);
const OUTPUT = new URL('../../docs/site/styles/tokens.css', import.meta.url);
const FAVICON = new URL('../../docs/site/favicon.svg', import.meta.url);
const SCHEMES = ['light', 'dark'] as const;
const GEOMETRY_COLOUR_COLLISIONS = new Set([
  '--ns-studio-table-cell-rule',
  '--ns-studio-topbar-rule',
  '--ns-studio-table-head-rule',
  '--ns-studio-table-row-rule',
]);
const FOREIGN_PACK =
  /^(?:liquid|tactile|bloom|cupertino|fluent|pixel|tonal|glass|brutal|ledger|filigrane|signal)\//;
const WEIGHTS: Readonly<Record<string, number>> = {
  Regular: 400,
  Medium: 500,
  SemiBold: 600,
  'Semi Bold': 600,
  Bold: 700,
};
// Existing docs consumers use the original spacing/type vocabulary. Resolve it
// through the exported Utility density and type roles rather than a second scale.
const COMPATIBILITY_ROLES: Readonly<Record<string, string>> = {
  '--ns-space-px': 'calc(var(--ns-inline-gap) / 8)',
  '--ns-space-0-5': 'calc(var(--ns-inline-gap) / 4)',
  '--ns-space-1': 'calc(var(--ns-inline-gap) / 2)',
  '--ns-space-2': 'var(--ns-inline-gap)',
  '--ns-space-3': 'var(--ns-control-padding-x)',
  '--ns-space-4': 'var(--ns-card-padding)',
  '--ns-space-6': 'var(--ns-page-padding-x)',
  '--ns-space-8': 'calc(var(--ns-card-padding) * 2)',
  '--ns-space-10': 'calc(var(--ns-inline-gap) * 5)',
  '--ns-text-xs': 'var(--ns-text-label)',
  '--ns-text-sm': 'var(--ns-text-small)',
  '--ns-text-base': 'var(--ns-text-body)',
  '--ns-text-lg': 'var(--ns-studio-prose-lede-size)',
  '--ns-leading-snug': 'var(--ns-leading-strong)',
  '--ns-leading-normal': 'var(--ns-leading-small)',
  '--ns-leading-relaxed': 'var(--ns-studio-prose-lede-line)',
  '--ns-tracking-wide': 'var(--ns-tracking-label)',
  '--ns-measure': 'var(--ns-studio-prose-measure)',
};

/** Resolve aliases in their target collection's context; reject cycles and missing data. */
export function resolveVariable(
  collections: readonly FigmaCollection[],
  reference: string,
  modes: Readonly<Record<string, string>>,
  trail: readonly string[] = [],
): string | number | boolean {
  if (trail.includes(reference)) {
    throw new Error(`Cyclic Figma alias: ${[...trail, reference].join(' → ')}`);
  }
  const slash = reference.indexOf('/');
  const collectionName = reference.slice(0, slash);
  const name = reference.slice(slash + 1);
  const collection = collections.find((entry) => entry.collection === collectionName);
  const variable = collection?.variables.find((entry) => entry.name === name);
  if (!collection || !variable) throw new Error(`Missing Figma variable: ${reference}`);
  const mode = modes[collectionName];
  if (!mode || !Object.hasOwn(variable.values, mode)) {
    throw new Error(`Missing Figma mode: ${reference} / ${mode}`);
  }
  const value = variable.values[mode];
  return typeof value === 'object'
    ? resolveVariable(collections, value.alias, modes, [...trail, reference])
    : value;
}

function cssValue(variable: FigmaVariable, value: string | number | boolean): string {
  if (typeof value === 'number') {
    const rounded = Math.round(value * 1000) / 1000;
    const unitless = /(?:opacity|alpha|icon\/stroke|weight)/.test(variable.name);
    return `${rounded}${unitless ? '' : 'px'}`;
  }
  if (typeof value === 'boolean') throw new Error(`Boolean is not a CSS token: ${variable.name}`);
  if (variable.codeSyntax?.includes('--ns-weight-')) {
    const weight = WEIGHTS[value];
    if (!weight) throw new Error(`Unknown Figma font weight: ${value}`);
    return String(weight);
  }
  if (variable.name.startsWith('font/')) {
    return `${JSON.stringify(value)}, ${/mono/i.test(value) ? 'monospace' : 'sans-serif'}`;
  }
  return value;
}

/** Emit semantic roles only, with Scheme colours taking precedence over geometry names. */
export function generateTokens(collections: readonly FigmaCollection[]): string {
  const blocks = SCHEMES.map((scheme) => {
    const modes = { ...UTILITY_MODES, Scheme: scheme === 'light' ? 'Light' : 'Dark' };
    const tokens = new Map<string, string>();
    const owners = new Map<string, string>();
    for (const collectionName of ['Theme', 'Density', 'Studio flavor', 'Scheme']) {
      const collection = collections.find((entry) => entry.collection === collectionName);
      if (!collection) throw new Error(`Missing collection: ${collectionName}`);
      for (const variable of collection.variables) {
        if (!variable.codeSyntax || variable.type === 'BOOLEAN') continue;
        if (collectionName === 'Scheme' && FOREIGN_PACK.test(variable.name)) continue;
        const property = variable.codeSyntax.match(/^var\((--ns-[a-z0-9-]+)\)$/)?.[1];
        if (!property) throw new Error(`Invalid CSS code syntax: ${variable.name}`);
        const previous = owners.get(property);
        if (
          previous && !(GEOMETRY_COLOUR_COLLISIONS.has(property) &&
            previous.startsWith('Studio flavor/') && collectionName === 'Scheme')
        ) {
          throw new Error(
            `CSS token collision: ${property} (${previous}, ${collectionName}/${variable.name})`,
          );
        }
        owners.set(property, `${collectionName}/${variable.name}`);
        const value = resolveVariable(collections, `${collectionName}/${variable.name}`, modes);
        tokens.set(property, cssValue(variable, value));
      }
    }
    for (const [property, value] of Object.entries(COMPATIBILITY_ROLES)) {
      if (tokens.has(property)) throw new Error(`CSS token collision: ${property} (compatibility)`);
      for (const [, reference] of value.matchAll(/var\((--ns-[\w-]+)\)/g)) {
        if (!tokens.has(reference)) throw new Error(`Missing compatibility role: ${reference}`);
      }
      tokens.set(property, value);
    }
    // Docs adapter: preserve syntax roles and select the exported ramp step required on surfaces.
    for (
      const [role, ramp] of Object.entries({
        keyword: 'violet',
        function: 'blue',
        type: 'teal',
        number: 'orange',
      })
    ) {
      const backgrounds = ['code/bg', 'surface/bg', 'surface/surface'].map((name) =>
        String(resolveVariable(collections, `Scheme/${name}`, modes))
      );
      let colour = tokens.get(`--ns-code-syntax-${role}`)!;
      if (backgrounds.some((bg) => contrastRatio(colour, bg) < AA_TEXT_CONTRAST)) {
        colour = String(resolveVariable(
          collections,
          `Primitives/color/${ramp}/${scheme[0]}/12`,
          modes,
        ));
      }
      if (backgrounds.some((bg) => contrastRatio(colour, bg) < AA_TEXT_CONTRAST)) {
        throw new Error(`API kind ${role} fails AA in ${scheme}`);
      }
      tokens.set(`--ns-studio-api-kind-${role}-text`, colour);
    }
    const declarations = [...tokens].sort(([a], [b]) => a.localeCompare(b, 'en'))
      .map(([name, value]) => `  ${name}: ${value};`).join('\n');
    return `${
      scheme === 'light' ? ':root,\n' : ''
    }:root[data-scheme="${scheme}"] {\n  color-scheme: ${scheme};\n${declarations}\n}`;
  });
  return `/* Generated by tools/docs-site/generate-tokens.ts. Do not edit values.\n * Figma export 2026-10-28: Studio / Utility / Neutral / Ink / Compact.\n * Source and provenance: tools/docs-site/figma-variables/. */\n\n${
    blocks.join('\n\n')
  }\n`;
}

/** A standalone favicon embeds only its generated semantic roles, then consumes those roles. */
export function generateFavicon(collections: readonly FigmaCollection[]): string {
  const roles = SCHEMES.map((scheme) => {
    const modes = { ...UTILITY_MODES, Scheme: scheme === 'light' ? 'Light' : 'Dark' };
    const brand = resolveVariable(collections, 'Scheme/studio/signal/brand', modes);
    const foreground = resolveVariable(collections, 'Scheme/studio/primary/fg', modes);
    const declarations =
      `:root{--ns-studio-signal-brand:${brand};--ns-studio-primary-fg:${foreground}}`;
    return scheme === 'light' ? declarations : `@media(prefers-color-scheme:dark){${declarations}}`;
  });
  return `<!-- Generated token layer and logo by tools/docs-site/generate-tokens.ts. -->\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><style>${
    roles.join('')
  }</style><path fill="var(--ns-studio-signal-brand)" d="M0 0h32v32H0z"/><path fill="var(--ns-studio-primary-fg)" d="M8 24V8h4l8 11V8h4v16h-4L12 13v11z"/></svg>\n`;
}

/** Load every collection named by the export manifest. */
export async function loadCollections(): Promise<FigmaCollection[]> {
  const index: { collections: { file: string }[] } = JSON.parse(
    await Deno.readTextFile(new URL('index.json', SOURCE)),
  );
  return await Promise.all(
    index.collections.map(async ({ file }) =>
      JSON.parse(await Deno.readTextFile(new URL(file, SOURCE))) as FigmaCollection
    ),
  );
}

if (import.meta.main) {
  const collections = await loadCollections();
  const css = generateTokens(collections);
  const favicon = generateFavicon(collections);
  if (Deno.args.includes('--check')) {
    if (await Deno.readTextFile(OUTPUT) !== css) {
      throw new Error('Docs tokens are stale; regenerate with tools/docs-site/generate-tokens.ts');
    }
    if (await Deno.readTextFile(FAVICON) !== favicon) {
      throw new Error('Docs favicon tokens are stale');
    }
    console.log('Utility token freshness: PASS');
  } else {
    await Deno.writeTextFile(OUTPUT, css);
    await Deno.writeTextFile(FAVICON, favicon);
    console.log('Generated Utility Light and Dark tokens');
  }
}
