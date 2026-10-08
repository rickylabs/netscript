/** Native durable-streams compatibility adapter; remove when upstream bounds its I/O. @module */

import {
  DurableStreamTestServer,
  FileBackedStreamStore,
  type TestServerOptions,
} from '@durable-streams/server';
import { BoundedSegmentLog, type SegmentFile, type SegmentFiles } from './bounded-segment-log.ts';

const SCAN_HOOK = 'scanFileForTrueOffset';
const READ_HOOK = 'readMessagesFromSegmentFile';

const segmentFiles: SegmentFiles = {
  open(path: string): SegmentFile {
    const file = Deno.openSync(path, { read: true });
    try {
      const stat = file.statSync();
      return {
        size: stat.size,
        identity: `${stat.dev}:${stat.ino}:${stat.birthtime?.getTime()}`,
        modified: stat.mtime?.getTime() ?? 0,
        readAt(buffer, position) {
          file.seekSync(position, Deno.SeekMode.Start);
          return file.readSync(buffer) ?? 0;
        },
        close() {
          file.close();
        },
      };
    } catch (error) {
      file.close();
      throw error;
    }
  },
};

/** Creates a native LMDB store whose recovery and segment reads use bounded framing I/O. */
export function createBoundedFileBackedStreamStore(dataDir: string): FileBackedStreamStore {
  // Upstream exposes neither a store-injection option nor protected I/O hooks. Install
  // the two TS-private virtual hooks only on our subclass, BEFORE native recovery runs.
  for (const hook of [SCAN_HOOK, READ_HOOK]) {
    if (
      typeof Object.getOwnPropertyDescriptor(FileBackedStreamStore.prototype, hook)?.value !==
        'function'
    ) {
      throw new Error(`Unsupported durable-streams storage API: missing ${hook}`);
    }
  }
  const log = new BoundedSegmentLog(segmentFiles);
  class BoundedStore extends FileBackedStreamStore {}
  Object.defineProperties(BoundedStore.prototype, {
    [SCAN_HOOK]: {
      value: (path: string): string => log.scan(path),
    },
    [READ_HOOK]: {
      value: (path: string, start: number, base: number, cap?: number) => {
        try {
          return log.read(path, start, base, cap);
        } catch (error) {
          // Native reads of a missing segment are empty. Other I/O failures must
          // propagate rather than fabricate offsets or silently return partial data.
          if (error instanceof Deno.errors.NotFound) return [];
          throw error;
        }
      },
    },
  });
  return new BoundedStore({ dataDir });
}

/** Composes the native server with bounded durable storage when a data directory is provided. */
export function createStreamsServer(options: TestServerOptions): DurableStreamTestServer {
  if (!options.dataDir) return new DurableStreamTestServer(options);
  const dataDir = options.dataDir;
  class BoundedServer extends DurableStreamTestServer {
    override readonly store: FileBackedStreamStore;

    constructor() {
      // The base must not construct the old store, whose constructor buffers recovery.
      super({ ...options, dataDir: undefined });
      this.store = createBoundedFileBackedStreamStore(dataDir);
    }
  }
  return new BoundedServer();
}
