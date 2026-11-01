/** Searchable metadata for an item in the configured UI registry. */
export interface UiRegistryItemSummary {
  /** Stable registry item id. */
  readonly name: string;
  /** Portable registry:* item category. */
  readonly type: string;
  /** Optional human-readable label. */
  readonly title?: string;
  /** Optional short description. */
  readonly description?: string;
}

/** Registry reads supplied by the host; this port never installs files. */
export interface UiRegistryCatalogPort {
  /** Enumerate available item metadata, without file contents. */
  list(): Promise<readonly UiRegistryItemSummary[]>;
  /** Return one portable item with embedded file contents, or undefined when absent. */
  view(reference: string): Promise<Readonly<Record<string, unknown>> | undefined>;
}
