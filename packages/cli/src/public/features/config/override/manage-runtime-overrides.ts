import type {
  RuntimeConfigStorePort,
  RuntimeOverridePointer,
  RuntimeOverrideTopic,
} from '../../../../kernel/ports/runtime-config-store-port.ts';

/** Result of activating a runtime override version. */
export interface RuntimeOverrideResult {
  readonly topic: RuntimeOverrideTopic;
  readonly version: string;
  readonly pointer: RuntimeOverridePointer;
}

/** Publish a topic payload and atomically activate its version. */
export async function publishRuntimeOverride(
  store: RuntimeConfigStorePort,
  topic: RuntimeOverrideTopic,
  version: string,
  value: unknown,
): Promise<RuntimeOverrideResult> {
  await store.write(topic, version, value);
  return await rollbackRuntimeOverride(store, topic, version);
}

/** Atomically activate an existing topic version. */
export async function rollbackRuntimeOverride(
  store: RuntimeConfigStorePort,
  topic: RuntimeOverrideTopic,
  version: string,
): Promise<RuntimeOverrideResult> {
  await store.read(topic, version);
  const pointer = {
    ...await store.readPointer(),
    version,
    [topic]: `${topic}/v${normalizeVersion(version)}.json`,
  };
  await store.activate(pointer);
  return { topic, version: normalizeVersion(version), pointer };
}

/** Read the active payload for a topic. */
export async function getActiveRuntimeOverride(
  store: RuntimeConfigStorePort,
  topic: RuntimeOverrideTopic,
): Promise<unknown | undefined> {
  const path = (await store.readPointer())[topic];
  if (!path) return undefined;
  const version = path.split('/').pop()?.replace(/^v/, '').replace(/\.json$/, '');
  return version ? await store.read(topic, version) : undefined;
}

/** Set or clear a dotted entry inside a topic's active payload. */
export async function setRuntimeOverrideValue(
  store: RuntimeConfigStorePort,
  topic: RuntimeOverrideTopic,
  id: string,
  patch: Readonly<Record<string, unknown>> | undefined,
  version: string,
): Promise<RuntimeOverrideResult> {
  const current = await getActiveRuntimeOverride(store, topic);
  const collectionKey = topic === 'features' ? 'flags' : topic === 'tasks' ? 'tasks' : 'overrides';
  const payload = asRecord(current);
  const values = Array.isArray(payload[collectionKey])
    ? [...payload[collectionKey] as Record<string, unknown>[]]
    : [];
  const index = values.findIndex((entry) => entry.id === id);
  if (patch === undefined) {
    if (index >= 0) values.splice(index, 1);
  } else {
    const next = { ...(index >= 0 ? values[index] : {}), id, ...patch };
    if (index >= 0) values[index] = next;
    else values.push(next);
  }
  return await publishRuntimeOverride(store, topic, version, {
    ...payload,
    [collectionKey]: values,
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function normalizeVersion(version: string): string {
  return version.replace(/^v/, '').replace(/\.json$/, '');
}
