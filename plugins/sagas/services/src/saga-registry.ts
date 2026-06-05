import { getKv } from '@netscript/kv';
import type { SagaDefinition } from '@netscript/plugin-sagas-core/domain';

const SAGA_REGISTRY_PREFIX = ['saga', 'registry'] as const;

/** Saga metadata stored in KV for API service reads. */
export type SagaMetadata = Readonly<{
  id: string;
  name: string;
  topic: string;
  handledMessageTypes: readonly string[];
  registeredAt: string;
  enabled: boolean;
}>;

/** Filter options accepted when listing saga metadata. */
export type SagaMetadataFilter = Readonly<{
  topic?: string;
}>;

/** Register saga definitions in shared KV metadata for the API service. */
export async function registerSagaDefinitions(
  definitions: readonly SagaDefinition[],
  now: () => Date = () => new Date(),
): Promise<number> {
  const kv = await getKv();
  const registeredAt = now().toISOString();
  await Promise.all(
    definitions.map((definition) =>
      kv.set([...SAGA_REGISTRY_PREFIX, String(definition.id)], toMetadata(definition, registeredAt))
    ),
  );
  return definitions.length;
}

/** List registered saga metadata from shared KV. */
export async function listSagaMetadata(
  filter: SagaMetadataFilter = {},
): Promise<readonly SagaMetadata[]> {
  const kv = await getKv();
  const sagas: SagaMetadata[] = [];
  const entries = kv.list<SagaMetadata>({ prefix: [...SAGA_REGISTRY_PREFIX] });

  for await (const entry of entries) {
    if (!entry.value) continue;
    if (filter.topic && entry.value.topic !== filter.topic) continue;
    sagas.push(entry.value);
  }

  return Object.freeze(sagas);
}

/** Read a single saga metadata entry by id. */
export async function getSagaMetadata(id: string): Promise<SagaMetadata | undefined> {
  const kv = await getKv();
  const entry = await kv.get<SagaMetadata>([...SAGA_REGISTRY_PREFIX, id]);
  return entry?.value ?? undefined;
}

function toMetadata(definition: SagaDefinition, registeredAt: string): SagaMetadata {
  return Object.freeze({
    id: String(definition.id),
    name: String(definition.id),
    topic: 'default',
    handledMessageTypes: Object.freeze([...definition.handledMessageTypes].map(String)),
    registeredAt,
    enabled: true,
  });
}
