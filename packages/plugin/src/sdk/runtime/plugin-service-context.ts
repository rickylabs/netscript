/** Context supplied to a plugin service at runtime. */
export interface PluginServiceContext {
  /** Optional service name when supplied by the host runtime. */
  readonly serviceName?: string;
  /** Optional project root when supplied by the host runtime. */
  readonly projectRoot?: string;
  /** Host database accessor for plugin-owned services. */
  readonly db: {
    /** Resolve the active database client. */
    getClient(): Promise<unknown>;
  };
  /** Workspace contract modules supplied by the host. */
  readonly contracts: unknown;
  /** Host key-value adapter. */
  readonly kv: unknown;
  /** Plugin logger supplied by the host. */
  readonly logger: unknown;
  /** Environment variables captured by the host. */
  readonly env: Readonly<Record<string, string>>;
}
