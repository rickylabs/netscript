/** Starts the real front and exposes its owned file store for fault injection in tests. @module */

import { DurableStreamTestServer, FileBackedStreamStore } from '@durable-streams/server';
import { networkInterfaces } from 'node:os';
import { startStreamsService } from '../../service.ts';

/** Return the normal HTTP address and the native store used by this one companion. */
export async function startExpiryCompanion(dataDir: string): Promise<{
  base: string;
  store: FileBackedStreamStore;
  stop(): Promise<void>;
}> {
  const hostname = Object.values(networkInterfaces()).flat()
    .find((entry) => entry?.internal && entry.family === 'IPv4')?.address;
  if (!hostname) throw new Error('An internal IPv4 interface is required');
  const prior = Deno.env.get('STREAMS_DATA_DIR');
  const start = DurableStreamTestServer.prototype.start;
  let store: FileBackedStreamStore | undefined;
  DurableStreamTestServer.prototype.start = function () {
    if (this.store instanceof FileBackedStreamStore) store = this.store;
    return start.call(this);
  };
  try {
    Deno.env.set('STREAMS_DATA_DIR', dataDir);
    const running = await startStreamsService({
      auth: { public: true, reason: 'Isolated Streams expiry tests' },
      serve: { hostname, port: 0, handleSignals: false },
    });
    if (!store) {
      await running.stop();
      throw new Error('Expected a file-backed store');
    }
    return { base: `http://${hostname}:${running.addr.port}`, store, stop: () => running.stop() };
  } finally {
    DurableStreamTestServer.prototype.start = start;
    if (prior === undefined) Deno.env.delete('STREAMS_DATA_DIR');
    else Deno.env.set('STREAMS_DATA_DIR', prior);
  }
}
