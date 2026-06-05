import {
  HmacSha256WebhookVerifier,
  MemoryWebhookVerifier,
} from '@netscript/plugin-triggers-core/adapters';
import type { WebhookDefinition } from '@netscript/plugin-triggers-core/domain';
import type {
  ProcessableTriggerDefinition,
  TriggerEventStorePort,
  TriggerProcessorPort,
} from '@netscript/plugin-triggers-core/ports';
import { createTriggerIngress } from '@netscript/plugin-triggers-core/runtime';
import { TRIGGERS_API_DEFAULT_PORT, TRIGGERS_API_SERVICE_NAME } from '../../src/constants.ts';
import {
  KvTriggerEventStore,
  openTriggerRuntimeKv,
} from '../../src/runtime/kv-trigger-runtime-stores.ts';
import { loadProjectTriggerDefinitions } from '../../src/runtime/project-trigger-registry.ts';
import { createRuntimeTriggerProcessor } from '../../src/runtime/trigger-runtime-processor.ts';
import { createTriggersHttpRouter } from './router.ts';

export type TriggersServiceOptions = Readonly<{
  port?: number;
  definitions?: readonly ProcessableTriggerDefinition[];
  eventStore?: TriggerEventStorePort;
  processor?: TriggerProcessorPort;
  kv?: Deno.Kv;
}>;

/** Start the triggers HTTP ingress service. */
export async function startTriggersService(
  options: TriggersServiceOptions = {},
): Promise<Deno.HttpServer> {
  const port = options.port ?? Number(Deno.env.get('PORT') ?? TRIGGERS_API_DEFAULT_PORT);
  const kv = options.kv ??
    (options.eventStore === undefined || options.processor === undefined
      ? await openTriggerRuntimeKv()
      : undefined);
  const eventStore = options.eventStore ?? new KvTriggerEventStore({ kv: kv as Deno.Kv });
  const processor = options.processor ?? await createRuntimeTriggerProcessor({ kv });
  const hmacVerifier = new HmacSha256WebhookVerifier({
    signatureHeader: 'x-hub-signature-256',
  });
  const memoryVerifier = new MemoryWebhookVerifier();
  const definitions = (options.definitions ?? []).filter(isWebhookDefinition);
  const ingress = createTriggerIngress({
    definitions,
    eventStore,
    processor,
    verifier: hmacVerifier,
    selectVerifier: (definition) => definition.verifier === 'memory' ? memoryVerifier : undefined,
    resolveSecret: (definition) =>
      definition.secretEnv === undefined ? undefined : Deno.env.get(definition.secretEnv),
  });
  const app = createTriggersHttpRouter({ eventStore, ingress });

  return Deno.serve({
    port,
    onListen: () => undefined,
  }, app.fetch);
}

/** Start the triggers HTTP ingress service using the generated project registry. */
export async function startProjectTriggersService(
  options: TriggersServiceOptions = {},
): Promise<Deno.HttpServer> {
  return await startTriggersService({
    ...options,
    definitions: options.definitions ?? await loadProjectTriggerDefinitions(),
  });
}

if (import.meta.main) {
  await startProjectTriggersService({
    port: Number(Deno.env.get('PORT') ?? TRIGGERS_API_DEFAULT_PORT),
  });
}

export { TRIGGERS_API_DEFAULT_PORT, TRIGGERS_API_SERVICE_NAME };

function isWebhookDefinition(
  definition: ProcessableTriggerDefinition,
): definition is WebhookDefinition<string, never, never> {
  return definition.kind === 'webhook';
}
