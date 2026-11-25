/** Leaves a real file-backed companion at a requested durability checkpoint. @module */

import { abortable } from 'jsr:@std/async@1/abortable';
import { FileBackedStreamStore } from '@durable-streams/server';
import { startExpiryCompanion } from './expiry-companion.ts';

const [dataDir, mode, epoch] = Deno.args;
const path = '/retained';
const options = { ttlSeconds: 1, contentType: 'text/plain' };
let now = Number(epoch);
Date.now = () => now;

if (mode === 'native') {
  const store = new FileBackedStreamStore({ dataDir });
  await store.create(path, options);
  now += 900;
  store.touchAccess(path);
} else {
  const companion = await startExpiryCompanion(dataDir);
  await companion.store.create(path, options);
  now += 900;
  const db = Reflect.get(companion.store, 'db') as {
    putSync(key: string, value: unknown): boolean;
    transactionAsync(callback: () => void): Promise<void>;
  };
  const started = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const transaction = db.transactionAsync.bind(db);
  let writes = 0;
  db.transactionAsync = async (callback) => {
    writes++;
    started.resolve();
    await release.promise;
    await transaction(callback);
  };
  const url = companion.base + path;
  if (mode === 'bare close' || mode === 'repeated bare close') {
    const putSync = db.putSync.bind(db);
    let synchronousWrites = 0;
    db.putSync = (key, value) => {
      synchronousWrites++;
      return putSync(key, value);
    };
    const close = async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'stream-closed': 'true' },
        signal: AbortSignal.timeout(5_000),
      });
      if (response.status !== 204) throw new Error(`Bare close returned ${response.status}`);
    };
    const repeated = mode === 'repeated bare close';
    if (repeated) {
      now -= 890;
      await close();
      now += 890;
    }
    await close();
    if (writes !== 0 || synchronousWrites !== (repeated ? 2 : 1)) {
      throw new Error('Expected each close renewal to use its one native metadata write');
    }
  } else if (mode === 'append') {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'confirmed',
      signal: AbortSignal.timeout(5_000),
    });
    if (response.status !== 204 || writes !== 0) {
      throw new Error('Expected a confirmed append in its native metadata transaction');
    }
  } else {
    let completed = false;
    const read = fetch(url, { signal: AbortSignal.timeout(10_000) }).then(async (response) => {
      if (response.status !== 200) throw new Error(`GET returned ${response.status}`);
      await response.arrayBuffer();
      completed = true;
    });
    void read.catch(() => undefined);
    await abortable(started.promise, AbortSignal.timeout(5_000));
    if (completed) throw new Error('The sparse access completed before its blocked renewal');
    if (mode === 'graceful') {
      const stopping = companion.stop();
      release.resolve();
      await stopping;
      await read.catch(() => undefined);
    } else if (mode === 'completed') {
      release.resolve();
      await read;
    }
  }
}

console.log('RENEWAL_CHECKPOINT');
if (mode !== 'graceful') {
  // The parent sends SIGKILL here. Holding stdin prevents implicit process exit.
  for await (const _chunk of Deno.stdin.readable) { /* No commands are expected. */ }
}
