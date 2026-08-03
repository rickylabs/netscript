/** Maximum length of each human-readable command descriptor field. */
export const MAX_COMMAND_DESCRIPTOR_LENGTH = 512;

/** Bounded machine-readable description of one CLI verb. */
export interface CommandDescriptor {
  /** Space-separated command path such as `db migrate`. */ readonly path: string;
  /** Bounded command purpose. */ readonly description: string;
  /** Bounded positional argument and flag summary. */ readonly usage: string;
}

/** Supplies the CLI command catalog from an outer registry. */
export interface CommandCatalogPort {
  /** Enumerate the currently available CLI verbs. */
  listCommands(): Promise<readonly CommandDescriptor[]>;
}
