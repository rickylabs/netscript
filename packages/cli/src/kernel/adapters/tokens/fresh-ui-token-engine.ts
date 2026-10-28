import type { TokenBuildOptions } from '@netscript/fresh-ui/tokens';
import type { TokenEngineDefaults, TokenEnginePort } from '../../ports/token-engine-port.ts';

/** Keep Style Dictionary and its source documents out of other command startup paths. */
export class FreshUiTokenEngine implements TokenEnginePort {
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
      outputFiles: engine.APP_TOKEN_FILES,
    };
  }

  async build(options: TokenBuildOptions) {
    const engine = await import('@netscript/fresh-ui/tokens');
    const result = await engine.buildTokens(options);
    return {
      preset: result.preset.id,
      files: Object.fromEntries(engine.APP_TOKEN_FILES.map((name) => [name, result.files[name]])),
    };
  }
}
