import { assertEquals } from '@std/assert';

import type {
  RuntimeConfigStorePort,
  RuntimeOverridePointer,
  RuntimeOverrideTopic,
} from '../../../../kernel/ports/runtime-config-store-port.ts';
import {
  publishRuntimeOverride,
  rollbackRuntimeOverride,
  setRuntimeOverrideValue,
} from './manage-runtime-overrides.ts';

class MemoryRuntimeStore implements RuntimeConfigStorePort {
  pointer: RuntimeOverridePointer = {};
  readonly values = new Map<string, unknown>();

  readPointer(): Promise<RuntimeOverridePointer> {
    return Promise.resolve(this.pointer);
  }
  activate(pointer: RuntimeOverridePointer): Promise<void> {
    this.pointer = pointer;
    return Promise.resolve();
  }
  read(topic: RuntimeOverrideTopic, version: string): Promise<unknown> {
    const value = this.values.get(`${topic}:${version.replace(/^v/, '')}`);
    if (value === undefined) return Promise.reject(new Error('missing'));
    return Promise.resolve(value);
  }
  write(topic: RuntimeOverrideTopic, version: string, value: unknown): Promise<void> {
    this.values.set(`${topic}:${version.replace(/^v/, '')}`, value);
    return Promise.resolve();
  }
  versions(): Promise<readonly string[]> {
    return Promise.resolve([]);
  }
}

Deno.test('publish writes a version before atomically activating its topic pointer', async () => {
  const store = new MemoryRuntimeStore();
  await publishRuntimeOverride(store, 'features', '2026-07-12', { flags: [] });
  assertEquals(store.pointer.features, 'features/v2026-07-12.json');
  assertEquals(store.values.get('features:2026-07-12'), { flags: [] });
});

Deno.test('rollback preserves other topic pointers', async () => {
  const store = new MemoryRuntimeStore();
  store.pointer = { jobs: 'jobs/v1.json' };
  store.values.set('features:2', { flags: [] });
  await rollbackRuntimeOverride(store, 'features', '2');
  assertEquals(store.pointer, {
    version: '2',
    jobs: 'jobs/v1.json',
    features: 'features/v2.json',
  });
});

Deno.test('dashboard-style flag set and clear create immutable versions', async () => {
  const store = new MemoryRuntimeStore();
  await setRuntimeOverrideValue(
    store,
    'features',
    'checkout-v2',
    { enabled: true, rolloutPercentage: 30 },
    'set-1',
  );
  assertEquals(store.values.get('features:set-1'), {
    flags: [{ id: 'checkout-v2', enabled: true, rolloutPercentage: 30 }],
  });
  await setRuntimeOverrideValue(store, 'features', 'checkout-v2', undefined, 'clear-2');
  assertEquals(store.values.get('features:clear-2'), { flags: [] });
});
