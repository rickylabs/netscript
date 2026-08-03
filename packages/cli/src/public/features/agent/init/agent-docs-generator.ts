/** Complete offline documentation generation, ready for atomic-style installation. */
export interface AgentDocsGeneration {
  readonly files: Readonly<Record<string, string>>;
  readonly frameworkVersion: string;
  readonly proseFileCount: number;
  readonly apiPackageCount: number;
  readonly apiExportCount: number;
}

/** Adapter port that builds version-locked docs before the installer writes any docs file. */
export interface AgentDocsGenerator {
  generate(projectRoot: string): Promise<AgentDocsGeneration>;
}
