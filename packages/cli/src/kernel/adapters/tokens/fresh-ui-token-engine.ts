import type {
  TokenEngineBuildOptions,
  TokenEngineDefaults,
  TokenEnginePort,
} from '../../ports/token-engine-port.ts';

/** Keep Style Dictionary and its source documents out of other command startup paths. */
export class FreshUiTokenEngine implements TokenEnginePort {
  async outputFiles(previews = false): Promise<readonly string[]> {
    const metadata = await import('@netscript/fresh-ui/token-config');
    return [...metadata.APP_TOKEN_FILES, ...(previews ? metadata.PREVIEW_TOKEN_FILES : [])];
  }

  async defaults(): Promise<TokenEngineDefaults> {
    const engine = await import('@netscript/fresh-ui/tokens');
    const sources = engine.defaultTokenSources();
    const preset = sources.resolver.modifiers.theme.default;
    if (!preset) throw new Error('The token resolver must select a default theme');
    return {
      preset,
      presets: engine.TOKEN_PRESETS.map((entry) => entry.id),
      sources: Object.fromEntries(
        Object.entries({ 'tokens.resolver.json': sources.resolver, ...sources.documents })
          .map(([name, document]) => [name, JSON.stringify(document, null, 2) + '\n']),
      ),
    };
  }

  async build(options: TokenEngineBuildOptions) {
    const engine = await import('@netscript/fresh-ui/tokens');
    const documents = { ...options.sources };
    const resolver = documents['tokens.resolver.json'];
    delete documents['tokens.resolver.json'];
    const result = await engine.buildTokens({
      preset: options.preset,
      target: 'app',
      previews: options.previews,
      sources: options.sources
        ? {
          resolver: JSON.parse(resolver),
          documents: Object.fromEntries(
            Object.entries(documents).map(([name, value]) => [name, JSON.parse(value)]),
          ),
        }
        : undefined,
      override: options.override === undefined ? undefined : JSON.parse(options.override),
    });
    return {
      preset: result.preset.id,
      files: result.files,
    };
  }
}
