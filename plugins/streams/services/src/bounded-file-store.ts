/** Native durable-streams compatibility adapter; remove when upstream bounds its I/O. @module */

import {
  DurableStreamTestServer,
  FileBackedStreamStore,
  type Stream,
  type TestServerOptions,
} from '@durable-streams/server';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { BoundedSegmentLog, type SegmentFile, type SegmentFiles } from './bounded-segment-log.ts';
import { type NativeStreamMetadata, SlidingStreamAccess } from './sliding-stream-access.ts';

const SCAN_HOOK = 'scanFileForTrueOffset';
const READ_HOOK = 'readMessagesFromSegmentFile';
const EXPIRY_HOOK = 'isExpired';
const STREAM_VIEW_HOOK = 'streamMetaToStream';
const DELETE_HOOK = 'deleteWithCascade';
const APPEND_HANDLER = 'handleAppend';
const access = new WeakMap<FileBackedStreamStore, SlidingStreamAccess>();

function nativeHook<Args extends unknown[], Result>(
  name: string,
): (this: FileBackedStreamStore, ...args: Args) => Result {
  const original: unknown = Object.getOwnPropertyDescriptor(FileBackedStreamStore.prototype, name)
    ?.value;
  if (typeof original !== 'function') {
    throw new Error(`Unsupported durable-streams storage API: missing ${name}`);
  }
  return original as (this: FileBackedStreamStore, ...args: Args) => Result;
}

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

/** Creates a native LMDB store with bounded segment I/O and deferred sliding TTL renewals. */
export function createBoundedFileBackedStreamStore(dataDir: string): FileBackedStreamStore {
  // Upstream exposes neither a store-injection option nor protected I/O hooks. Install
  // the TS-private virtual hooks only on our subclass, before native recovery runs.
  nativeHook(SCAN_HOOK);
  nativeHook(READ_HOOK);
  const isExpired = nativeHook<[NativeStreamMetadata], boolean>(EXPIRY_HOOK);
  const toStream = nativeHook<[NativeStreamMetadata], Stream>(STREAM_VIEW_HOOK);
  const deleteWithCascade = nativeHook<[string], void>(DELETE_HOOK);
  const log = new BoundedSegmentLog(segmentFiles);
  class BoundedStore extends FileBackedStreamStore {
    #closing: Promise<void> | undefined;

    override touchAccess(path: string): void {
      access.get(this)?.touch(path);
    }

    override async appendWithProducer(
      ...args: Parameters<FileBackedStreamStore['appendWithProducer']>
    ): Promise<Awaited<ReturnType<FileBackedStreamStore['appendWithProducer']>>> {
      const result = await super.appendWithProducer(...args);
      if (result.producerResult?.status === 'duplicate') {
        await access.get(this)?.renewDuplicate(args[0]);
      }
      return result;
    }

    override async closeStreamWithProducer(
      ...args: Parameters<FileBackedStreamStore['closeStreamWithProducer']>
    ): Promise<Awaited<ReturnType<FileBackedStreamStore['closeStreamWithProducer']>>> {
      const result = await super.closeStreamWithProducer(...args);
      if (result?.producerResult?.status === 'duplicate') {
        await access.get(this)?.renewDuplicate(args[0]);
      }
      return result;
    }

    override clear(): void {
      super.clear();
      access.get(this)?.clear();
    }

    override close(): Promise<void> {
      return this.#closing ??= this.#closeStore();
    }

    async #closeStore(): Promise<void> {
      try {
        await access.get(this)?.close();
      } finally {
        await super.close();
      }
    }
  }
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
    [EXPIRY_HOOK]: {
      value(this: BoundedStore, meta: NativeStreamMetadata): boolean {
        return isExpired.call(this, access.get(this)?.current(meta) ?? meta);
      },
    },
    [STREAM_VIEW_HOOK]: {
      value(this: BoundedStore, meta: NativeStreamMetadata): Stream {
        return toStream.call(this, access.get(this)?.current(meta) ?? meta);
      },
    },
    [DELETE_HOOK]: {
      value(this: BoundedStore, path: string): void {
        deleteWithCascade.call(this, path);
        access.get(this)?.forget(path);
      },
    },
  });
  const store = new BoundedStore({ dataDir });
  try {
    access.set(
      store,
      new SlidingStreamAccess(Reflect.get(store, 'db'), (error) => {
        console.error('[streams] Could not persist sliding TTL renewals; retrying', error);
      }),
    );
    return store;
  } catch (error) {
    void store.close().catch((failure: unknown) => {
      console.error('[streams] Could not close incompatible file-backed store', failure);
    });
    throw error;
  }
}

/** Composes the native server with bounded durable storage when a data directory is provided. */
export function createStreamsServer(options: TestServerOptions): DurableStreamTestServer {
  if (!options.dataDir) return new DurableStreamTestServer(options);
  const handler: unknown = Object.getOwnPropertyDescriptor(
    DurableStreamTestServer.prototype,
    APPEND_HANDLER,
  )?.value;
  if (typeof handler !== 'function') {
    throw new Error(`Unsupported durable-streams storage API: missing ${APPEND_HANDLER}`);
  }
  const handleAppend = handler as (
    this: DurableStreamTestServer,
    path: string,
    request: IncomingMessage,
    response: ServerResponse,
  ) => Promise<void>;
  const dataDir = options.dataDir;
  class BoundedServer extends DurableStreamTestServer {
    override readonly store: FileBackedStreamStore;

    constructor() {
      // The base must not construct the old store, whose constructor buffers recovery.
      super({ ...options, dataDir: undefined });
      this.store = createBoundedFileBackedStreamStore(dataDir);
    }
  }
  Object.defineProperty(BoundedServer.prototype, APPEND_HANDLER, {
    value(this: BoundedServer, path: string, request: IncomingMessage, response: ServerResponse) {
      return access.get(this.store)!.appendRequest(
        path,
        () => handleAppend.call(this, path, request, response),
      );
    },
  });
  return new BoundedServer();
}

/** Gate a file-backed read until the latest access visible to its response is committed. */
export function waitForFileStreamRead(
  server: DurableStreamTestServer,
  path: string,
): Promise<void> | undefined {
  return server.store instanceof FileBackedStreamStore
    ? access.get(server.store)?.waitForRead(path)
    : undefined;
}
