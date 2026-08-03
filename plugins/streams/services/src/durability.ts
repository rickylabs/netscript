/** Result of checking durable stream storage configuration. */
export type StorageDurabilityInfo = {
  /** Whether data storage is file-backed and durable across process restarts. */
  readonly durable: boolean;
  /** Human-readable status or warning message describing storage durability. */
  readonly message: string;
  /** Configured data directory if specified. */
  readonly dataDir?: string;
};

/**
 * Evaluates storage durability for the streams service based on `STREAMS_DATA_DIR`.
 *
 * Unset or empty `dataDir` defaults to in-memory, non-durable storage.
 */
export function describeStorageDurability(dataDir: string | undefined): StorageDurabilityInfo {
  if (dataDir && dataDir.trim() !== '') {
    return {
      durable: true,
      dataDir,
      message: `Streams service storage is durable (file-backed at ${dataDir}).`,
    };
  }
  return {
    durable: false,
    message:
      `Streams service storage is non-durable (in-memory). Set STREAMS_DATA_DIR=<path> to enable file-backed durable storage.`,
  };
}
