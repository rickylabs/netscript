import StyleDictionary from 'npm:style-dictionary@5.7.1';
import type { Config } from 'npm:style-dictionary@5.7.1/types';
import legacy from '../../../tokens/legacy.json' with { type: 'json' };
import figmaIndex from '../../../tokens/figma/index.json' with { type: 'json' };
import roleRegistry from '../../../tokens/role-manifest.json' with { type: 'json' };
import { assertRegisteredTokenNames } from '../domain/check-token-names.ts';
import {
  assertSemanticAliases,
  assertTokenReferences,
  resolveTokenSources,
} from '../domain/resolve-tokens.ts';
import { TOKEN_DENSITIES, TOKEN_SCHEMES } from '../domain/token-contract.ts';
import type {
  TokenBuildOptions,
  TokenBuildResult,
  TokenContextOutput,
} from '../domain/token-output.ts';
import { TOKEN_PRESETS, tokenPreset } from '../domain/token-presets.ts';
import { defaultTokenSources } from './default-token-sources.ts';
import { validateDtcgSources } from './dtcg-validation.ts';
import { formatTokenContext } from './format-context.ts';
import { effectiveContexts, formatThemeBridge, formatTokensCss } from './format-css.ts';
import {
  formatFontImports,
  formatThemeItems,
  formatTokensJson,
  presetConfiguration,
} from './format-data.ts';
import { figmaCollections } from './figma-collections.ts';
import { formatFigmaCollection, formatFigmaPreset } from './format-figma.ts';

const json = (value: unknown): string => JSON.stringify(value, null, 2) + '\n';

/**
 * Build every requested context with SD, then run SD formats for all deliverables.
 * No IO occurs here; CLI and package scripts own their output directories.
 */
export async function buildTokens(options: TokenBuildOptions = {}): Promise<TokenBuildResult> {
  const sources = options.sources ?? defaultTokenSources();
  const preset = tokenPreset(options.preset ?? 'ns-one');
  validateDtcgSources(
    options.override
      ? { ...sources, documents: { ...sources.documents, 'app-override': options.override } }
      : sources,
  );
  const axes = {
    theme: TOKEN_PRESETS.map((entry) => entry.id),
    scheme: TOKEN_SCHEMES,
    density: TOKEN_DENSITIES,
  };
  for (const [axis, expected] of Object.entries(axes)) {
    const actual = Object.keys(sources.resolver.modifiers[axis]?.contexts ?? {}).sort();
    if (JSON.stringify(actual) !== JSON.stringify([...expected].sort())) {
      throw new Error(`Resolver ${axis} contexts must match the registered public contexts`);
    }
  }
  if (Object.keys(sources.resolver.modifiers).some((axis) => !(axis in axes))) {
    throw new Error('Resolver has an unregistered modifier');
  }
  const contexts: TokenContextOutput[] = [];
  for (const language of TOKEN_PRESETS) {
    for (const scheme of TOKEN_SCHEMES) {
      for (const density of TOKEN_DENSITIES) {
        const document = resolveTokenSources(
          sources,
          { theme: language.id, scheme, density },
          options.override,
        );
        assertSemanticAliases({ semantic: document.semantic, context: document.context });
        assertTokenReferences(document);
        assertRegisteredTokenNames(document, roleRegistry);
        const dictionary = new StyleDictionary({
          tokens: document,
          usesDtcg: true,
          log: { verbosity: 'silent', errors: { brokenReferences: 'throw' } },
          hooks: {
            formats: {
              'netscript/context': ({ dictionary }) =>
                formatTokenContext(dictionary, document, {
                  preset: language,
                  scheme,
                  requestedDensity: density,
                }),
            },
          },
          platforms: { resolved: { transforms: [], files: [{ format: 'netscript/context' }] } },
        });
        const [formatted] = await dictionary.formatPlatform('resolved');
        contexts.push(formatted.output as TokenContextOutput);
      }
    }
  }
  const selected = contexts.find((context) =>
    context.preset.id === preset.id && context.scheme === 'light'
  )!;
  const formats: NonNullable<Config['hooks']>['formats'] = {
    'netscript/css': () => formatTokensCss(contexts, preset.id),
    'netscript/bridge': () => formatThemeBridge(selected, legacy.bridge),
    'netscript/json': () => json(formatTokensJson(contexts, preset.id)),
    'netscript/fonts': () => json(formatFontImports(contexts)),
    'netscript/preset': () => json(presetConfiguration(selected)),
    'netscript/themes': () => json(formatThemeItems(contexts)),
  };
  const files = [
    { destination: 'tokens.css', format: 'netscript/css' },
    { destination: 'theme-bridge.css', format: 'netscript/bridge' },
    { destination: 'tokens.json', format: 'netscript/json' },
    { destination: 'fonts.json', format: 'netscript/fonts' },
    { destination: 'theme-preset.json', format: 'netscript/preset' },
    { destination: 'theme-items.json', format: 'netscript/themes' },
  ];
  for (const context of effectiveContexts(contexts).filter((entry) => entry.scheme === 'light')) {
    const name = `netscript/preset/${context.preset.id}`;
    formats[name] = () => json(presetConfiguration(context));
    files.push({ destination: `presets/${context.preset.id}.json`, format: name });
    const figma = `netscript/figma/${context.preset.id}`;
    formats[figma] = () => json(formatFigmaPreset(contexts, context.preset.id));
    files.push({ destination: `figma/${context.preset.id}.json`, format: figma });
  }
  const collections = figmaCollections();
  for (const [index, collection] of collections.entries()) {
    const name = `netscript/figma-source/${index}`;
    formats[name] = () => json(formatFigmaCollection(collection));
    const entry = figmaIndex.collections.find((entry) =>
      entry.collection === collection.collection
    )!;
    files.push({ destination: `figma/${entry.file}`, format: name });
  }
  formats['netscript/figma-index'] = () =>
    json({
      ...figmaIndex,
      collections: [
        ...figmaIndex.collections,
        ...TOKEN_PRESETS.map((entry) => ({
          collection: `NetScript ${entry.id}`,
          file: `${entry.id}.json`,
          modes: ['Light', 'Dark'],
          variableCount: Object.keys(
            contexts.find((context) => context.preset.id === entry.id)!.tokens,
          ).length,
        })),
      ],
    });
  files.push({ destination: 'figma/index.json', format: 'netscript/figma-index' });
  const engine = new StyleDictionary({
    tokens: { version: { $type: 'number', $value: 2 } },
    usesDtcg: true,
    log: { verbosity: 'silent' },
    hooks: { formats },
    platforms: { outputs: { transforms: [], files } },
  });
  const rendered = await engine.formatPlatform('outputs');
  const output: Record<string, string> = {};
  for (const file of rendered) {
    if (!file.destination || typeof file.output !== 'string') {
      throw new Error('SD returned an invalid output file');
    }
    output[file.destination] = file.output;
  }
  return { files: output, contexts, preset };
}
