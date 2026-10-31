/**
 * DTCG 2025.10 token building for CLI and design tooling. Not a browser import.
 *
 * @example
 * ```ts
 * import { buildTokens } from '@netscript/fresh-ui/tokens';
 * const build = await buildTokens({ preset: 'studio-utility' });
 * console.log(build.files['tokens.css']);
 * ```
 * @module
 */
export { buildTokens } from './src/tokens/adapters/style-dictionary.ts';
export { defaultTokenSources } from './src/tokens/adapters/default-token-sources.ts';
export type { TokenSources } from './src/tokens/domain/resolve-tokens.ts';
export { APP_TOKEN_FILES, PREVIEW_TOKEN_FILES } from './src/tokens/domain/token-output.ts';
export type {
  BuiltToken,
  ExportedToken,
  TokenBuildOptions,
  TokenBuildResult,
  TokenContextOutput,
} from './src/tokens/domain/token-output.ts';
export type {
  DesignToken,
  ResolverSource,
  TokenDensity,
  TokenDerivation,
  TokenDocument,
  TokenMetadata,
  TokenMixDerivation,
  TokenPreset,
  TokenResolver,
  TokenScheme,
  TokenShadowDerivation,
  TokenValue,
} from './src/tokens/domain/token-contract.ts';
export { TOKEN_PRESETS } from './src/tokens/domain/token-presets.ts';
export { TOKEN_DENSITIES, TOKEN_SCHEMES } from './src/tokens/domain/token-contract.ts';

export { figmaTokenSources } from './src/tokens/adapters/figma/figma-token-sources.ts';
export type { FigmaCollection, FigmaVariable } from './src/tokens/domain/token-contract.ts';
export {
  exportFigmaTokenBundle,
  importFigmaTokenBundle,
} from './src/tokens/adapters/figma/figma-round-trip.ts';
export type { FigmaTokenBundle } from './src/tokens/domain/figma/figma-token-bundle.ts';
export { assertFigmaTokenNames } from './src/tokens/adapters/figma/figma-token-names.ts';
