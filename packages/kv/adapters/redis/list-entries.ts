/** Bounded ordered listing and single-pass watch discovery over Redis SCAN. @module */

import { BinaryHeap } from '@std/data-structures';
import { createPackageLogger } from '@netscript/logger';
import type { Redis } from 'ioredis';
import { compareKeys } from '../../application/keys.ts';
import type { KvEntry, KvKey, KvListOptions } from '../../types/common.ts';
import { decodeEnvelope } from './codec.ts';
import { keyToRedisKey, redisKeyToKey } from './serialization.ts';
import { REDIS_MGET_BATCH_SIZE, REDIS_SCAN_COUNT, type StoredValue } from './types.ts';

type ListClient = Pick<Redis, 'scan' | 'mget'>;

interface Candidate {
  redisKey: string;
  key: KvKey;
}

const logger = createPackageLogger('kv');

/** Match descendants literally, even when a namespace or prefix contains Redis glob syntax. */
function prefixPattern(prefix: KvKey, namespace: string): string {
  return `${keyToRedisKey(prefix, namespace).replace(/[\\*?[\]]/g, '\\$&')}:*`;
}

/** Walk a complete SCAN cycle; COUNT bounds requested work, not the server's reply size. */
async function* scanBatches(client: ListClient, pattern: string): AsyncIterable<string[]> {
  let cursor = '0';
  do {
    const [next, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', REDIS_SCAN_COUNT);
    cursor = next;
    yield keys;
  } while (cursor !== '0');
}

/** Fetch only selected candidates; missing or malformed values do not consume a result slot. */
async function* readEntries<T>(
  client: ListClient,
  candidates: Candidate[],
): AsyncIterable<KvEntry<T>> {
  const values = await client.mget(...candidates.map((candidate) => candidate.redisKey));
  for (const [index, candidate] of candidates.entries()) {
    const data = values[index];
    if (data === null) continue;
    let stored: StoredValue<T>;
    try {
      stored = decodeEnvelope<StoredValue<T>>(data);
      // Access inside the guard also rejects null/undefined envelopes.
      stored = { value: stored.value, versionstamp: stored.versionstamp };
    } catch {
      logger.warn('Skipping malformed Redis KV entry during list()', {
        redisKey: candidate.redisKey,
      });
      continue;
    }
    yield { key: candidate.key, value: stored.value, versionstamp: stored.versionstamp };
  }
}

/** Select globally ordered windows with O(batch size) retained keys, including unlimited lists. */
export async function* listEntries<T>(
  client: ListClient,
  namespace: string,
  options: KvListOptions,
): AsyncIterable<KvEntry<T>> {
  const limit = options.limit ?? Infinity;
  const direction = options.reverse ? -1 : 1;
  const compare = (a: Candidate, b: Candidate): number => direction * compareKeys(a.key, b.key);
  const pattern = prefixPattern(options.prefix, namespace);
  let boundary: KvKey | undefined;
  let count = 0;

  while (count < limit) {
    const capacity = Math.min(limit - count, REDIS_MGET_BATCH_SIZE);
    // The worst retained key is at the root, so each better key can replace it in O(log K).
    const selected = new BinaryHeap<Candidate>((a, b) => compare(b, a));
    const names = new Set<string>();
    for await (const keys of scanBatches(client, pattern)) {
      for (const redisKey of keys) {
        if (names.has(redisKey)) continue;
        const key = redisKeyToKey(redisKey, namespace);
        if (options.start && compareKeys(key, options.start) <= 0) continue;
        if (options.end && compareKeys(key, options.end) >= 0) continue;
        if (boundary && direction * compareKeys(key, boundary) <= 0) continue;
        const candidate = { redisKey, key };
        if (selected.length >= capacity) {
          if (compare(candidate, selected.peek()!) >= 0) continue;
          names.delete(selected.pop()!.redisKey);
        }
        selected.push(candidate);
        names.add(redisKey);
      }
    }

    const candidates = selected.toArray().sort(compare);
    if (candidates.length === 0) return;
    // Advance past examined keys even when every selected value expired or failed decoding.
    boundary = candidates[candidates.length - 1].key;
    for await (const entry of readEntries<T>(client, candidates)) {
      count++;
      yield entry;
    }
    if (candidates.length < capacity) return;
  }
}

/** Discover watch values in one unordered pass, avoiding repeated ordered-list selection scans. */
export async function* scanEntries<T>(
  client: ListClient,
  namespace: string,
  prefix: KvKey,
): AsyncIterable<KvEntry<T>> {
  for await (const keys of scanBatches(client, prefixPattern(prefix, namespace))) {
    for (let offset = 0; offset < keys.length; offset += REDIS_MGET_BATCH_SIZE) {
      const candidates = keys.slice(offset, offset + REDIS_MGET_BATCH_SIZE).map((redisKey) => ({
        redisKey,
        key: redisKeyToKey(redisKey, namespace),
      }));
      yield* readEntries<T>(client, candidates);
    }
  }
}
