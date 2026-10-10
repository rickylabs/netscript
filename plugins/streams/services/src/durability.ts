/** Startup storage verification and health reporting for the streams service. @module */

import type { HealthCheck } from '@netscript/service';

/** Storage facts established before the streams listener starts. */
export type StorageDurabilityInfo = {
  /** Active storage backend; memory is explicitly ephemeral. */
  readonly mode: 'memory' | 'file';
  /** Whether the backend supports replay across an orderly process restart. */
  readonly durable: boolean;
  /** Whether the startup write/read probe succeeded (file mode only). */
  readonly probe: 'not-applicable' | 'passed';
  /** Human-readable status without exposing the local data path. */
  readonly message: string;
  /** Verified data directory, passed unchanged to the native store. */
  readonly dataDir?: string;
};

/** Health check whose detailed result exposes the verified storage contract. */
export interface StreamsStorageHealthCheck extends HealthCheck {
  /** Return startup storage facts through the service's detailed health serializer. */
  check(): Promise<{ healthy: boolean; storage: StorageDurabilityInfo }>;
}

/**
 * Verify configured storage before claiming file mode. An unset directory selects
 * memory; an empty, missing, non-directory or unwritable configured path fails.
 * Operators provision the directory explicitly; there is no fallback to memory.
 */
export async function describeStorageDurability(
  dataDir: string | undefined,
): Promise<StorageDurabilityInfo> {
  if (dataDir === undefined) {
    return {
      mode: 'memory',
      durable: false,
      probe: 'not-applicable',
      message: 'Streams storage is ephemeral; events are lost on process restart.',
    };
  }
  if (dataDir.trim() === '') throw new Error('STREAMS_DATA_DIR must name an existing directory.');
  let directory: Deno.FileInfo;
  try {
    directory = await Deno.stat(dataDir);
  } catch (cause) {
    if (!(cause instanceof Deno.errors.NotFound)) throw cause;
    throw new Error('STREAMS_DATA_DIR must name an existing directory.', { cause });
  }
  if (!directory.isDirectory) {
    throw new Error('STREAMS_DATA_DIR must name an existing directory.');
  }
  const path = `${dataDir}/.netscript-storage-probe-${crypto.randomUUID()}`;
  const expected = new TextEncoder().encode('netscript-streams-storage-probe');
  const file = await Deno.open(path, { createNew: true, write: true, read: true });
  try {
    let written = 0;
    while (written < expected.length) written += await file.write(expected.subarray(written));
    await file.sync();
    await file.seek(0, Deno.SeekMode.Start);
    const actual = new Uint8Array(expected.length + 1);
    let read = 0;
    while (read < actual.length) {
      const count = await file.read(actual.subarray(read));
      if (count === null) break;
      read += count;
    }
    if (read !== expected.length || !expected.every((byte, index) => byte === actual[index])) {
      throw new Error('STREAMS_DATA_DIR startup write/read probe failed.');
    }
  } finally {
    file.close();
    await Deno.remove(path);
  }
  return {
    mode: 'file',
    durable: true,
    probe: 'passed',
    dataDir,
    message:
      'Streams file storage passed the startup write/read probe; orderly restart replay is supported.',
  };
}

/** Publish only startup-verified facts, omitting the local directory from health. */
export function createStorageHealthCheck(
  storage: StorageDurabilityInfo,
): StreamsStorageHealthCheck {
  const { dataDir: _dataDir, ...reported } = storage;
  return {
    name: 'streams-storage',
    check: () => Promise.resolve({ healthy: true, storage: reported }),
  };
}
