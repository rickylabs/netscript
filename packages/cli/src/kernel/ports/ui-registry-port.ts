/** Fetch registry JSON or source bytes without exposing resolved authentication to callers. */
export interface UiRegistryTransportPort {
  /** Resolve environment placeholders only at the network edge and never forward them on redirects. */
  read(
    url: string,
    headers: Readonly<Record<string, string>>,
    signal?: AbortSignal,
  ): Promise<string>;
}

/** Validate physical paths in addition to the application's lexical containment checks. */
export interface UiRegistryPathPort {
  /** Refuse existing symlinks that would escape the selected root, including parent directories. */
  assertContained(root: string, path: string): Promise<void>;
}
