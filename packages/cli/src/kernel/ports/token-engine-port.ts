/** Raw DTCG documents keep compiler implementation types outside the CLI port. */
export interface TokenEngineBuildOptions {
  readonly preset?: string;
  readonly sources?: Readonly<Record<string, string>>;
  readonly override?: string;
  readonly previews?: boolean;
}

/** Bundled inputs and the web output contract, loaded only for token commands. */
export interface TokenEngineDefaults {
  readonly preset: string;
  readonly presets: readonly string[];
  readonly sources: Readonly<Record<string, string>>;
}

/** Build tokens through the public Fresh UI tooling entrypoint. */
export interface TokenEnginePort {
  /** Convert validated Figma transport with the public shared importer, without filesystem IO. */
  figmaSources?(bundle: unknown): Promise<Readonly<Record<string, string>>>;
  outputFiles(previews?: boolean): Promise<readonly string[]>;
  defaults(): Promise<TokenEngineDefaults>;
  build(options: TokenEngineBuildOptions): Promise<{
    readonly preset: string;
    readonly files: Readonly<Record<string, string>>;
  }>;
}
