import type { TokenBuildOptions } from '@netscript/fresh-ui/tokens';

/** Bundled inputs and the web output contract, loaded only for token commands. */
export interface TokenEngineDefaults {
  readonly preset: string;
  readonly presets: readonly string[];
  readonly sources: Readonly<Record<string, string>>;
  readonly outputFiles: readonly string[];
}

/** Build tokens through the public Fresh UI tooling entrypoint. */
export interface TokenEnginePort {
  defaults(): Promise<TokenEngineDefaults>;
  build(options: TokenBuildOptions): Promise<{
    readonly preset: string;
    readonly files: Readonly<Record<string, string>>;
  }>;
}
