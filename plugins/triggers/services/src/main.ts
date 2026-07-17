/**
 * Triggers service entrypoint.
 *
 * Converged thin connector: serves the type-sound triggers v1 oRPC contract via
 * the mandated `createPluginService(router, {...}).serve()` surface (mirroring
 * the reference auth connector), fronts the raw HMAC webhook ingress as a
 * `rawRoutes` entry (it verifies a signature over the raw request bytes, which
 * is incompatible with oRPC Zod parsing), and lets `withHealth`/`withServiceInfo`
 * own `/health`, `/health/live`, `/health/ready`, and the service-info root.
 *
 * Unlike auth/workers (which receive a host-provided `PluginServiceContext`),
 * the triggers API is launched as a direct `deno run services/src/main.ts` by
 * the Aspire contribution and has no host DB; it self-bootstraps its runtime
 * context (project trigger definitions, KV-backed event store, ingress) in the
 * `import.meta.main` block below.
 *
 * @module
 */

// Register Redis/Garnet KV adapter - must run before any getKv() call.
import '@netscript/kv/redis';

import type { Context } from 'hono';
import type { ServiceBuilder } from '@netscript/service';
import { createPluginService } from '@netscript/plugin/service';
import {
  HmacSha256WebhookVerifier,
  MemoryWebhookVerifier,
} from '@netscript/plugin-triggers-core/adapters';
import {
  createKvTriggerEnabledStateStore,
  KvTriggerEventStore,
  openTriggerRuntimeKv,
} from '@netscript/plugin-triggers-core/stores';
import type {
  TriggerEvent,
  TriggerEventId,
  TriggerEventStatus,
  WebhookDefinition,
} from '@netscript/plugin-triggers-core/domain';
import type {
  ProcessableTriggerDefinition,
  TriggerEnabledStatePort,
  TriggerEventListOptions,
  TriggerEventStorePort,
  TriggerEventSubscriptionPort,
  TriggerIngressPort,
  TriggerIngressRequest,
  TriggerIngressResponse,
  TriggerProcessorPort,
} from '@netscript/plugin-triggers-core/ports';
import {
  createEventSubscription,
  createManualDispatcher,
  createTriggerIngress,
  createWebhookTestDelivery,
  type ManualDispatcher,
  type WebhookTestDelivery,
} from '@netscript/plugin-triggers-core/runtime';
import { TRIGGERS_API_DEFAULT_PORT, TRIGGERS_API_SERVICE_NAME } from '../../src/constants.ts';
import { PLUGIN_PACKAGE_VERSION } from '../../src/package-metadata.generated.ts';
import type { KvStore } from '@netscript/kv';
import { loadProjectTriggerDefinitions } from '../../src/runtime/project-trigger-registry.ts';
import { createRuntimeTriggerProcessor } from '../../src/runtime/trigger-runtime-processor.ts';
import { router } from './router.ts';
import type { TriggerServiceContext } from './routers/v1-types.ts';
import { acceptWebhook, listTriggerEvents, WEBHOOK_PATH_PREFIX } from './raw-trigger-routes.ts';

export {
  TRIGGER_ACTION_KINDS,
  TRIGGER_BACKFILL_POLICIES,
  TRIGGER_DURABILITY_TIERS,
  TRIGGER_EVENT_STATUSES,
  TRIGGER_KINDS,
  TRIGGER_RESERVED_KINDS,
  TRIGGER_RUNTIME_KINDS,
} from '@netscript/plugin-triggers-core/domain';
export type {
  CronExpression,
  DeferAction,
  EnqueueJobAction,
  EnqueueJobOptions,
  FileWatchDefinition,
  FileWatchLifecycle,
  FileWatchStabilityThreshold,
  FileWatchTriggerPayload,
  JobDefinition,
  JobId,
  ManualTriggerDefinition,
  ManualTriggerPayload,
  QueueTriggerDefinition,
  QueueTriggerPayload,
  RuntimeTriggerDefinition,
  ScheduledTriggerDefinition,
  ScheduledTriggerPayload,
  ScheduledTriggerSpec,
  StreamTriggerDefinition,
  StreamTriggerPayload,
  TriggerActionResult,
  TriggerBackfillPolicy,
  TriggerBackfillSpec,
  TriggerCircuitBreakerSpec,
  TriggerConcurrencySpec,
  TriggerContext,
  TriggerDeduplicationSpec,
  TriggerDefinition,
  TriggerDefinitionBase,
  TriggerDurabilityTier,
  TriggerEvent,
  TriggerEventId,
  TriggerEventStatus,
  TriggerHandler,
  TriggerId,
  TriggerKind,
  TriggerKnownKind,
  TriggerPayload,
  TriggerReservedKind,
  TriggerRetryPolicy,
  TriggerRuntimeKind,
  WebhookDefinition,
  WebhookId,
  WebhookTriggerPayload,
  WebhookVerifierKind,
} from '@netscript/plugin-triggers-core/domain';
export type {
  ProcessableTriggerDefinition,
  TriggerEventListOptions,
  TriggerEventStorePort,
  TriggerProcessorPort,
  TriggerProcessorStopOptions,
  TriggerProcessResult,
} from '@netscript/plugin-triggers-core/ports';
export type { TriggerServiceContext } from './routers/v1-types.ts';

/** Connector version, single-sourced from the triggers package `deno.json`. */
const VERSION: string = PLUGIN_PACKAGE_VERSION;

/** Legacy event-list path preserved for scaffold runtime smoke gates. */
const LEGACY_EVENTS_PATH = '/api/v1/events' as const;

/** Options for assembling the triggers service runtime context. */
export type TriggersServiceOptions = Readonly<{
  /** HTTP port for the front listener. Defaults to `PORT` env or the plugin default. */
  port?: number;
  /** Trigger definitions; defaults to the generated project registry. */
  definitions?: readonly ProcessableTriggerDefinition[];
  /** Event store; defaults to a KV-backed store. */
  eventStore?: TriggerEventStorePort;
  /** Enabled-state store; defaults to a KV-backed override store. */
  enabledState?: TriggerEnabledStatePort;
  /** Trigger processor backing the ingress; defaults to the runtime processor. */
  processor?: TriggerProcessorPort;
  /** Manual-fire dispatcher; defaults to eventStore + processor. */
  manualDispatcher?: ManualDispatcher;
  /** Webhook test-delivery helper; defaults to the configured ingress. */
  webhookTestDelivery?: WebhookTestDelivery;
  /** In-process event subscription port; defaults to a single-replica hub. */
  eventSubscription?: TriggerEventSubscriptionPort;
  /** Pre-opened KV adapter; defaults to the runtime KV. */
  kv?: KvStore;
}>;
type TriggerServiceContextSource = TriggerServiceContext | (() => TriggerServiceContext);

/** Assemble the triggers service runtime context from the supplied or default ports. */
export async function createTriggersServiceContext(
  options: TriggersServiceOptions = {},
): Promise<TriggerServiceContext> {
  // Open KV only when a default event store or processor must be constructed;
  // when both are supplied no KV is needed. Resolving to a concrete `KvStore`
  // when needed keeps the store constructor cast-free.
  const definitions = options.definitions ?? await loadProjectTriggerDefinitions();
  const needsKv = options.eventStore === undefined || options.enabledState === undefined ||
    options.processor === undefined;
  const kv: KvStore | undefined = needsKv ? options.kv ?? await openTriggerRuntimeKv() : options.kv;
  const eventStore = options.eventStore ??
    new KvTriggerEventStore({ kv: requireKv(kv) });
  const enabledState = options.enabledState ??
    createKvTriggerEnabledStateStore({ kv: requireKv(kv) });
  const eventSubscription = options.eventSubscription ?? createEventSubscription();
  const processor = options.processor ??
    await createRuntimeTriggerProcessor({ kv, eventSubscription, enabledState });
  const manualDispatcher = options.manualDispatcher ??
    createManualDispatcher({ eventStore, processor });
  const hmacVerifier = new HmacSha256WebhookVerifier({
    signatureHeader: 'x-hub-signature-256',
  });
  const memoryVerifier = new MemoryWebhookVerifier();
  const ingress = createTriggerIngress({
    definitions: definitions.filter(isWebhookDefinition),
    eventStore,
    processor,
    verifier: hmacVerifier,
    selectVerifier: (definition) => definition.verifier === 'memory' ? memoryVerifier : undefined,
    resolveSecret: (definition) =>
      definition.secretEnv === undefined ? undefined : Deno.env.get(definition.secretEnv),
    eventSubscription,
  });
  const webhookTestDelivery = options.webhookTestDelivery ??
    createWebhookTestDelivery({
      ingress,
      resolveSecret: (definition) =>
        definition.secretEnv === undefined ? undefined : Deno.env.get(definition.secretEnv),
    });
  return {
    definitions,
    eventStore,
    enabledState,
    ingress,
    manualDispatcher,
    webhookTestDelivery,
    eventSubscription,
  };
}

/**
 * Build the converged triggers service builder.
 *
 * Returns a ready {@link ServiceBuilder}; the caller serves with `.serve()`.
 * `serveRpc: true` wires the v1 contract router; the raw HMAC webhook routes are
 * mounted via `rawRoutes`, preserving the external `POST /api/v1/webhooks/:triggerId`
 * (and `/:triggerId/*`) paths existing senders use.
 */
export function createTriggersService(
  context: TriggerServiceContextSource,
  options: Readonly<{ port?: number }> = {},
): ServiceBuilder<typeof router> {
  const port = options.port ?? Number(Deno.env.get('PORT') ?? TRIGGERS_API_DEFAULT_PORT);
  const resolveContext = () => typeof context === 'function' ? context() : context;
  const webhookHandler = (c: Context): Promise<Response> => {
    const resolvedContext = resolveContext();
    return acceptWebhook(
      c,
      resolvedContext.ingress,
      resolvedContext.definitions,
      resolvedContext.enabledState,
    );
  };
  const listEventsHandler = (c: Context): Promise<Response> => {
    const resolvedContext = resolveContext();
    return listTriggerEvents(c, resolvedContext.eventStore);
  };
  return createPluginService(router, {
    name: TRIGGERS_API_SERVICE_NAME,
    version: VERSION,
    port,
    serveRpc: true,
    openApi: {
      title: 'Triggers API',
      description: 'Trigger introspection, event introspection, and webhook ingress.',
    },
    docs: {},
    context: resolveContext,
    rawRoutes: [
      { method: 'get', path: LEGACY_EVENTS_PATH, handler: listEventsHandler },
      { method: 'post', path: `${WEBHOOK_PATH_PREFIX}:triggerId`, handler: webhookHandler },
      { method: 'post', path: `${WEBHOOK_PATH_PREFIX}:triggerId/*`, handler: webhookHandler },
    ],
  });
}

/**
 * Start the triggers service: assemble the runtime context, then serve.
 *
 * Self-bootstrapping (no host `PluginServiceContext`), matching how the Aspire
 * contribution launches this entrypoint as a direct `deno run`.
 */
export async function startTriggersService(
  options: TriggersServiceOptions = {},
): Promise<void> {
  let context = createUnavailableTriggersServiceContext();
  const port = options.port ?? Number(Deno.env.get('PORT') ?? TRIGGERS_API_DEFAULT_PORT);
  await createTriggersService(() => context, { port }).serve();

  queueMicrotask(async () => {
    try {
      context = await createTriggersServiceContext(options);
      console.log(`[Triggers API] Running on http://localhost:${port}`);
    } catch (error) {
      console.error('[Triggers API] Failed to finish post-listen startup:', error);
    }
  });
}

function createUnavailableTriggersServiceContext(): TriggerServiceContext {
  return {
    definitions: [],
    eventStore: new UnavailableTriggerEventStore(),
    enabledState: unavailableTriggerEnabledState,
    ingress: unavailableTriggerIngress,
    manualDispatcher: unavailableManualDispatcher,
    webhookTestDelivery: unavailableWebhookTestDelivery,
    eventSubscription: unavailableEventSubscription,
  };
}

class UnavailableTriggerEventStore implements TriggerEventStorePort {
  save(_event: TriggerEvent): Promise<void> {
    return Promise.reject(triggerRuntimeUnavailable());
  }

  load(_eventId: TriggerEventId): Promise<TriggerEvent | undefined> {
    return Promise.resolve(undefined);
  }

  updateStatus(_eventId: TriggerEventId, _status: TriggerEventStatus): Promise<void> {
    return Promise.reject(triggerRuntimeUnavailable());
  }

  list(_options?: TriggerEventListOptions): Promise<readonly TriggerEvent[]> {
    return Promise.resolve([]);
  }
}

const unavailableTriggerIngress: TriggerIngressPort = {
  accept(_request: TriggerIngressRequest): Promise<TriggerIngressResponse> {
    return Promise.reject(triggerRuntimeUnavailable());
  },
};

const unavailableTriggerEnabledState: TriggerEnabledStatePort = {
  isEnabled(): Promise<boolean> {
    return Promise.resolve(false);
  },
  setEnabled(): Promise<void> {
    return Promise.reject(triggerRuntimeUnavailable());
  },
  list(): Promise<readonly []> {
    return Promise.resolve([]);
  },
};

const unavailableManualDispatcher: ManualDispatcher = {
  fire(): Promise<never> {
    return Promise.reject(triggerRuntimeUnavailable());
  },
};

const unavailableWebhookTestDelivery: WebhookTestDelivery = {
  deliver(): Promise<never> {
    return Promise.reject(triggerRuntimeUnavailable());
  },
};

const unavailableEventSubscription: TriggerEventSubscriptionPort = {
  subscribe(): AsyncIterable<never> {
    return {
      [Symbol.asyncIterator](): AsyncIterator<never> {
        return {
          next(): Promise<IteratorResult<never>> {
            return Promise.reject(triggerRuntimeUnavailable());
          },
        };
      },
    };
  },
  publish(): Promise<never> {
    return Promise.reject(triggerRuntimeUnavailable());
  },
};

function triggerRuntimeUnavailable(): Error {
  return new Error('Triggers runtime context is not ready yet.');
}

/** Assert a KV handle is present (always true on the default-event-store path). */
function requireKv(kv: KvStore | undefined): KvStore {
  if (kv === undefined) {
    throw new Error('Trigger runtime KV is required to construct the default event store.');
  }
  return kv;
}

function isWebhookDefinition(
  definition: ProcessableTriggerDefinition,
): definition is WebhookDefinition<string, never, never> {
  return definition.kind === 'webhook';
}

export { TRIGGERS_API_DEFAULT_PORT, TRIGGERS_API_SERVICE_NAME };

if (import.meta.main) {
  await startTriggersService({
    port: Number(Deno.env.get('PORT') ?? TRIGGERS_API_DEFAULT_PORT),
  });
}
